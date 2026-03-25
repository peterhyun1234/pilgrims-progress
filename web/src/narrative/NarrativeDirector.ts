import { EventBus } from '../core/EventBus';
import { GameEvent, MoodType, MoodPayload, StatChangePayload, NpcPhaseChangedPayload } from '../core/GameEvents';
import { CAMERA, DIALOGUE } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { StatsManager } from '../core/StatsManager';
import { GameManager } from '../core/GameManager';
import { NpcStateManager } from '../systems/NpcStateManager';

interface MoodConfig {
  cameraZoom: number;
  lightAlpha: number;
  lightTint: number;
  typingSpeed: number;
  particleType: string | null;
}

const MOOD_CONFIGS: Record<MoodType, MoodConfig> = {
  tense:    { cameraZoom: 1.1,  lightAlpha: 0.75, lightTint: 0x222222, typingSpeed: DIALOGUE.TYPING_SPEED_FAST,     particleType: null },
  dread:    { cameraZoom: 1.15, lightAlpha: 0.5,  lightTint: 0x110022, typingSpeed: DIALOGUE.TYPING_SPEED_SLOW,     particleType: 'darkness' },
  sorrow:   { cameraZoom: 0.95, lightAlpha: 0.7,  lightTint: 0x1a2a3a, typingSpeed: DIALOGUE.TYPING_SPEED_SLOW,     particleType: 'rain' },
  awe:      { cameraZoom: 0.85, lightAlpha: 1.2,  lightTint: 0xffeedd, typingSpeed: DIALOGUE.TYPING_SPEED_DRAMATIC, particleType: 'light' },
  joy:      { cameraZoom: 0.95, lightAlpha: 1.1,  lightTint: 0xfff5e0, typingSpeed: DIALOGUE.TYPING_SPEED_NORMAL,   particleType: 'light' },
  anger:    { cameraZoom: 1.2,  lightAlpha: 0.8,  lightTint: 0x3a0000, typingSpeed: DIALOGUE.TYPING_SPEED_FAST,     particleType: 'fire' },
  peace:    { cameraZoom: 1.0,  lightAlpha: 1.0,  lightTint: 0xf5f5e0, typingSpeed: DIALOGUE.TYPING_SPEED_NORMAL,   particleType: 'leaf' },
  resolve:  { cameraZoom: 1.15, lightAlpha: 1.0,  lightTint: 0xffffff, typingSpeed: DIALOGUE.TYPING_SPEED_NORMAL,   particleType: null },
  despair:  { cameraZoom: 0.9,  lightAlpha: 0.3,  lightTint: 0x000000, typingSpeed: DIALOGUE.TYPING_SPEED_SLOW,     particleType: null },
  grace:    { cameraZoom: 0.8,  lightAlpha: 1.5,  lightTint: 0xfffae0, typingSpeed: DIALOGUE.TYPING_SPEED_DRAMATIC, particleType: 'holy_light' },
  silence:  { cameraZoom: 1.0,  lightAlpha: 0.8,  lightTint: 0x222222, typingSpeed: DIALOGUE.TYPING_SPEED_SLOW,     particleType: null },
  betrayal: { cameraZoom: 1.3,  lightAlpha: 0.6,  lightTint: 0x111111, typingSpeed: DIALOGUE.TYPING_SPEED_INSTANT,  particleType: null },
};

/** A declarative story trigger evaluated after each significant game event. */
interface StoryTrigger {
  id: string;
  /** Returns true when this trigger's condition is met. */
  condition: (sm: StatsManager, gm: GameManager, nsm: NpcStateManager) => boolean;
  /** Side-effect to execute when the trigger fires. */
  effect: (sm: StatsManager, gm: GameManager, nsm: NpcStateManager) => void;
  /** If true, will only fire once per save (id stored in firedTriggers). */
  once: boolean;
}

const STORY_TRIGGERS: StoryTrigger[] = [
  {
    id: 'interpreter_early_unlock',
    condition: (sm, gm) => sm.get('wisdom') >= 50 && gm.currentChapter < 5,
    effect: (_sm, _gm, nsm) => nsm.setPhase('interpreter', 'available'),
    once: true,
  },
  {
    id: 'goodwill_wisdom_unlock_ch4',
    condition: (sm, gm) => sm.get('wisdom') >= 40 && gm.currentChapter === 4,
    effect: (_sm, _gm, nsm) => {
      if (nsm.getPhase('goodwill') === 'locked') nsm.setPhase('goodwill', 'available');
    },
    once: false,
  },
  {
    id: 'high_faith_bonus',
    condition: (sm, gm) => sm.get('faith') >= 80 && gm.currentChapter >= 4,
    effect: (sm) => sm.addInsight(5),
    once: true,
  },
  {
    id: 'burden_almost_free_hint',
    condition: (sm) => sm.get('burden') <= 10 && sm.get('burden') > 0,
    effect: (_sm, _gm, _nsm) => {
      EventBus.getInstance().emit(GameEvent.TOAST_SHOW, {
        text: '짐이 거의 없어졌습니다...',
        type: 'info',
        duration: 3000,
      });
    },
    once: true,
  },
];

export class NarrativeDirector {
  private scene: Phaser.Scene;
  private eventBus: EventBus;
  private currentMood: MoodType = 'peace';
  private lightOverlay: Phaser.GameObjects.Rectangle | null = null;
  private transitionTween: Phaser.Tweens.Tween | null = null;
  private firedTriggers: Set<string> = new Set();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventBus = EventBus.getInstance();
    this.setupEvents();
    this.createLightOverlay();
  }

  private createLightOverlay(): void {
    this.lightOverlay = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width * 2,
      this.scene.cameras.main.height * 2,
      0x000000, 0,
    ).setDepth(50).setScrollFactor(0).setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  initFiredTriggers(ids: string[]): void {
    this.firedTriggers = new Set(ids);
  }

  getFiredTriggers(): string[] {
    return Array.from(this.firedTriggers);
  }

  private onMoodChange = (payload: MoodPayload | undefined) => {
    if (payload) this.setMood(payload.mood, payload.duration);
  };

  private onStatChanged = (_payload: StatChangePayload | undefined) => {
    this.evaluateTriggers();
  };

  private onNpcPhaseChanged = (_payload: NpcPhaseChangedPayload | undefined) => {
    this.evaluateTriggers();
  };

  private onChapterChanged = () => {
    this.evaluateTriggers();
  };

  private onBattleEnd = () => {
    this.evaluateTriggers();
  };

  private setupEvents(): void {
    this.eventBus.on(GameEvent.MOOD_CHANGE, this.onMoodChange);
    this.eventBus.on(GameEvent.STAT_CHANGED, this.onStatChanged);
    this.eventBus.on(GameEvent.NPC_PHASE_CHANGED, this.onNpcPhaseChanged);
    this.eventBus.on(GameEvent.CHAPTER_CHANGED, this.onChapterChanged);
    this.eventBus.on(GameEvent.BATTLE_END, this.onBattleEnd);
  }

  private evaluateTriggers(): void {
    if (!ServiceLocator.has(SERVICE_KEYS.STATS_MANAGER)) return;
    if (!ServiceLocator.has(SERVICE_KEYS.GAME_MANAGER)) return;
    if (!ServiceLocator.has(SERVICE_KEYS.NPC_STATE_MANAGER)) return;

    const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const nsm = ServiceLocator.get<NpcStateManager>(SERVICE_KEYS.NPC_STATE_MANAGER);

    for (const trigger of STORY_TRIGGERS) {
      if (trigger.once && this.firedTriggers.has(trigger.id)) continue;
      if (!trigger.condition(sm, gm, nsm)) continue;

      trigger.effect(sm, gm, nsm);
      if (trigger.once) this.firedTriggers.add(trigger.id);

      this.eventBus.emit(GameEvent.STORY_TRIGGER_FIRED, { triggerId: trigger.id });
    }
  }

  setMood(mood: MoodType, duration = 1000): void {
    const config = MOOD_CONFIGS[mood];
    if (!config) return;

    const prevMood = this.currentMood;
    this.currentMood = mood;

    this.transitionCamera(config.cameraZoom, duration);
    this.transitionLight(config.lightTint, config.lightAlpha, duration);
    this.eventBus.emit(GameEvent.TYPING_SPEED_CHANGE, config.typingSpeed);

    if (config.particleType) {
      this.eventBus.emit('particle:start', config.particleType);
    }

    if (mood === 'silence') {
      this.eventBus.emit(GameEvent.MUSIC_FADE_TO_SILENCE, { duration: 2000 });
    }

    if (mood === 'betrayal') {
      this.eventBus.emit(GameEvent.SCREEN_SHAKE, { intensity: 2, duration: 300 });
      this.eventBus.emit(GameEvent.SFX_PLAY, 'glass_break');
    }

    if (mood === 'grace' && prevMood === 'despair') {
      this.scene.time.delayedCall(500, () => {
        this.eventBus.emit(GameEvent.SCREEN_FLASH, { color: 0xffffff, duration: 500 });
      });
    }
  }

  private transitionCamera(targetZoom: number, duration: number): void {
    const cam = this.scene.cameras.main;
    this.scene.tweens.add({
      targets: cam,
      zoom: targetZoom,
      duration,
      ease: 'Sine.easeInOut',
    });
  }

  private transitionLight(tint: number, alpha: number, duration: number): void {
    if (!this.lightOverlay) return;

    const displayAlpha = Math.max(0, 1 - alpha);
    this.lightOverlay.setFillStyle(tint, 0);

    this.scene.tweens.add({
      targets: this.lightOverlay,
      alpha: displayAlpha,
      duration,
      ease: 'Sine.easeInOut',
    });
  }

  applyTag(tag: string): void {
    const parts = tag.trim().split(':').map(s => s.trim());
    const command = parts[0];
    const value = parts.slice(1).join(':').trim();

    switch (command) {
      case 'MOOD':
        this.setMood(value as MoodType);
        break;

      case 'CAMERA': {
        const [action, param] = value.split(' ');
        if (action === 'zoom_in') {
          const zoom = param ? parseFloat(param) : CAMERA.ZOOM_CLOSEUP;
          this.transitionCamera(zoom, 500);
        } else if (action === 'zoom_out') {
          const zoom = param ? parseFloat(param) : CAMERA.ZOOM_WIDE;
          this.transitionCamera(zoom, 800);
        } else if (action === 'shake') {
          const intensity = param ? parseFloat(param) : 2;
          this.eventBus.emit(GameEvent.SCREEN_SHAKE, { intensity, duration: 300 });
        } else if (action === 'reset') {
          this.transitionCamera(CAMERA.ZOOM_DEFAULT, 500);
        }
        break;
      }

      case 'LIGHT': {
        const [action, param] = value.split(' ');
        if (action === 'darken') {
          const amount = param ? parseFloat(param) : 0.5;
          this.transitionLight(0x000000, amount, 500);
        } else if (action === 'brighten') {
          const amount = param ? parseFloat(param) : 1.2;
          this.transitionLight(0xffffff, amount, 500);
        } else if (action === 'reset') {
          this.transitionLight(0x000000, 1.0, 500);
        }
        break;
      }

      case 'MUSIC':
        if (value.startsWith('play')) {
          const track = value.split(' ')[1];
          if (track) this.eventBus.emit(GameEvent.BGM_PLAY, track);
        } else if (value === 'fade_out') {
          this.eventBus.emit(GameEvent.MUSIC_FADE_OUT, { duration: 2000 });
        } else if (value === 'fade_to_silence') {
          this.eventBus.emit(GameEvent.MUSIC_FADE_TO_SILENCE, { duration: 2000 });
        }
        break;

      case 'SFX':
        this.eventBus.emit(GameEvent.SFX_PLAY, value);
        break;

      case 'WAIT': {
        const ms = parseFloat(value) * 1000;
        this.scene.time.delayedCall(ms, () => {
          this.eventBus.emit('narrative:wait_complete');
        });
        break;
      }

      case 'TRANSITION':
        if (value === 'fade_black') {
          this.eventBus.emit(GameEvent.SCREEN_FADE, { color: 0x000000, duration: 500 });
        } else if (value === 'fade_white') {
          this.eventBus.emit(GameEvent.SCREEN_FADE, { color: 0xffffff, duration: 500 });
        } else if (value === 'flash') {
          this.eventBus.emit(GameEvent.SCREEN_FLASH, { color: 0xffffff, duration: 300 });
        }
        break;

      case 'EMOTE': {
        const [target, emote] = value.split(' ');
        this.eventBus.emit(GameEvent.EMOTE_SHOW, { target, emote });
        break;
      }

      case 'EMOTION': {
        const [target, emotion] = value.split(' ');
        this.eventBus.emit(GameEvent.EMOTION_CHANGE, { target, emotion });
        break;
      }

      case 'TYPING':
        this.eventBus.emit(GameEvent.TYPING_SPEED_CHANGE, value);
        break;

      case 'TEXT_EFFECT':
        this.eventBus.emit(GameEvent.TEXT_EFFECT, value);
        break;

      case 'PALETTE': {
        const [valStr, durStr] = value.split(' ');
        this.eventBus.emit(GameEvent.PALETTE_SHIFT, {
          value: parseFloat(valStr),
          duration: parseFloat(durStr || '2') * 1000,
        });
        break;
      }
    }
  }

  getMood(): MoodType {
    return this.currentMood;
  }

  destroy(): void {
    this.eventBus.off(GameEvent.MOOD_CHANGE, this.onMoodChange);
    this.eventBus.off(GameEvent.STAT_CHANGED, this.onStatChanged);
    this.eventBus.off(GameEvent.NPC_PHASE_CHANGED, this.onNpcPhaseChanged);
    this.eventBus.off(GameEvent.CHAPTER_CHANGED, this.onChapterChanged);
    this.eventBus.off(GameEvent.BATTLE_END, this.onBattleEnd);
    this.lightOverlay?.destroy();
    this.transitionTween?.destroy();
  }
}
