import Phaser from 'phaser';
import { EventBus } from '../core/EventBus';
import { GameEvent, MoodType } from '../core/GameEvents';
import { DesignSystem, FONT_FAMILY } from '../ui/DesignSystem';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// ─── Step types ─────────────────────────────────────────────────────────────

export type CutsceneStepType =
  | 'dialogue'   // Show a text line (blocking until dismissed or timed)
  | 'wait'       // Pause for ms
  | 'mood'       // Set NarrativeDirector mood
  | 'camera'     // Zoom or shake camera
  | 'flash'      // Screen flash
  | 'shake'      // Screen shake
  | 'music'      // Fade/stop/play music
  | 'sound'      // Play SFX
  | 'particles'  // Emit particle burst
  | 'stat'       // Change player stat silently
  | 'toast'      // Show toast notification
  | 'title';     // Show centred title card (fade in/out)

export interface CutsceneStep {
  type: CutsceneStepType;
  /** Run simultaneously with next step (non-blocking) */
  parallel?: boolean;
  // dialogue
  speaker?: string;
  text?: string;
  duration?: number; // ms; if omitted, waits for tap/space
  // wait
  ms?: number;
  // mood
  mood?: MoodType;
  moodDuration?: number;
  // camera
  zoom?: number;
  zoomDuration?: number;
  shakeIntensity?: number;
  shakeDuration?: number;
  // flash
  flashColor?: number;
  flashDuration?: number;
  // music
  musicAction?: 'fade_out' | 'fade_to_silence' | 'play';
  musicTrack?: string;
  musicFadeDuration?: number;
  // sound
  sfxKey?: string;
  // particles
  particleType?: string;
  particleX?: number;
  particleY?: number;
  particleCount?: number;
  // stat
  statKey?: string;
  statAmount?: number;
  // toast
  toastText?: string;
  toastType?: 'stat-positive' | 'stat-negative' | 'card' | 'info' | 'achievement';
  toastIcon?: string;
  // title
  titleText?: string;
  titleSubtext?: string;
  titleDuration?: number;
}

export interface CutsceneDefinition {
  id: string;
  steps: CutsceneStep[];
  /** Pause player input while playing */
  lockInput?: boolean;
}

// ─── Engine ──────────────────────────────────────────────────────────────────

export class CutsceneEngine {
  private scene: Phaser.Scene;
  private eventBus: EventBus;
  private isPlaying = false;
  private cancelRequested = false;
  private overlay: Phaser.GameObjects.Rectangle | null = null;
  private dialogueContainer: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventBus = EventBus.getInstance();
  }

  get playing(): boolean { return this.isPlaying; }

  async play(def: CutsceneDefinition): Promise<void> {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.cancelRequested = false;

    if (def.lockInput !== false) {
      this.eventBus.emit(GameEvent.PAUSE);
    }

    for (let i = 0; i < def.steps.length; i++) {
      if (this.cancelRequested) break;
      const step = def.steps[i];
      const promise = this.executeStep(step);

      if (!step.parallel) {
        await promise;
      }
      // If parallel, start the next step immediately (without awaiting)
    }

    this.cleanup();

    if (def.lockInput !== false) {
      this.eventBus.emit(GameEvent.RESUME);
    }

    this.isPlaying = false;
  }

  cancel(): void {
    this.cancelRequested = true;
    this.cleanup();
  }

  private cleanup(): void {
    this.overlay?.destroy();
    this.overlay = null;
    this.dialogueContainer?.destroy(true);
    this.dialogueContainer = null;
  }

  private executeStep(step: CutsceneStep): Promise<void> {
    switch (step.type) {
      case 'dialogue':  return this.stepDialogue(step);
      case 'wait':      return this.stepWait(step.ms ?? 1000);
      case 'mood':      return this.stepMood(step);
      case 'camera':    return this.stepCamera(step);
      case 'flash':     return this.stepFlash(step);
      case 'shake':     return this.stepShake(step);
      case 'music':     return this.stepMusic(step);
      case 'sound':     return this.stepSound(step);
      case 'particles': return this.stepParticles(step);
      case 'stat':      return this.stepStat(step);
      case 'toast':     return this.stepToast(step);
      case 'title':     return this.stepTitle(step);
      default:          return Promise.resolve();
    }
  }

  // ── Step implementations ─────────────────────────────────────────────────

  private stepDialogue(step: CutsceneStep): Promise<void> {
    return new Promise<void>(resolve => {
      this.dialogueContainer?.destroy(true);

      const panelH = 60;
      const panelY = GAME_HEIGHT - panelH - 8;

      const container = this.scene.add
        .container(0, panelY)
        .setDepth(200)
        .setScrollFactor(0);

      const bg = this.scene.add.graphics();
      bg.fillStyle(0x0a0814, 0.92);
      bg.fillRoundedRect(8, 0, GAME_WIDTH - 16, panelH, 6);
      bg.lineStyle(1, 0xd4a853, 0.4);
      bg.strokeRoundedRect(8, 0, GAME_WIDTH - 16, panelH, 6);

      const speakerLabel = step.speaker
        ? this.scene.add.text(20, 6, step.speaker, {
            fontSize: `${DesignSystem.FONT_SIZE.SM}px`,
            color: '#d4a853',
            fontFamily: FONT_FAMILY,
          })
        : null;

      const textY = step.speaker ? 18 : 8;
      const textObj = this.scene.add.text(20, textY, '', {
        fontSize: `${DesignSystem.FONT_SIZE.SM}px`,
        color: '#e8e0d0',
        fontFamily: FONT_FAMILY,
        wordWrap: { width: GAME_WIDTH - 44 },
        lineSpacing: 2,
      });

      const items: Phaser.GameObjects.GameObject[] = [bg, textObj];
      if (speakerLabel) items.push(speakerLabel);
      container.add(items);
      this.dialogueContainer = container;

      // Type the text
      const fullText = step.text ?? '';
      let charIndex = 0;
      const typingTimer = this.scene.time.addEvent({
        delay: 30,
        repeat: fullText.length - 1,
        callback: () => {
          charIndex++;
          textObj.setText(fullText.slice(0, charIndex));
        },
      });

      const finish = () => {
        typingTimer.destroy();
        textObj.setText(fullText);

        if (step.duration != null) {
          this.scene.time.delayedCall(step.duration, () => {
            container.destroy(true);
            this.dialogueContainer = null;
            resolve();
          });
        } else {
          // Wait for tap or space
          const advance = () => {
            container.destroy(true);
            this.dialogueContainer = null;
            resolve();
          };
          this.scene.input.once('pointerdown', advance);
          this.scene.input.keyboard?.once('keydown-SPACE', advance);
          this.scene.input.keyboard?.once('keydown-ENTER', advance);
        }
      };

      // If text is short (< 40 chars), skip typing on tap
      this.scene.input.once('pointerdown', () => {
        if (charIndex < fullText.length) {
          finish(); // skip to full text immediately
        }
      });

      this.scene.time.delayedCall(fullText.length * 30 + 80, finish);
    });
  }

  private stepWait(ms: number): Promise<void> {
    return new Promise<void>(resolve => {
      this.scene.time.delayedCall(ms, resolve);
    });
  }

  private stepMood(step: CutsceneStep): Promise<void> {
    if (step.mood) {
      this.eventBus.emit(GameEvent.MOOD_CHANGE, {
        mood: step.mood,
        duration: step.moodDuration ?? 1200,
      });
    }
    return Promise.resolve();
  }

  private stepCamera(step: CutsceneStep): Promise<void> {
    const cam = this.scene.cameras.main;
    const duration = step.zoomDuration ?? 600;

    if (step.zoom != null) {
      this.scene.tweens.add({
        targets: cam,
        zoom: step.zoom,
        duration,
        ease: 'Sine.easeInOut',
      });
    }

    if (step.shakeIntensity != null) {
      this.eventBus.emit(GameEvent.SCREEN_SHAKE, {
        intensity: step.shakeIntensity,
        duration: step.shakeDuration ?? 400,
      });
    }

    return new Promise<void>(resolve => {
      this.scene.time.delayedCall(duration, resolve);
    });
  }

  private stepFlash(step: CutsceneStep): Promise<void> {
    const color = step.flashColor ?? 0xffffff;
    const duration = step.flashDuration ?? 400;
    this.eventBus.emit(GameEvent.SCREEN_FLASH, { color, duration });
    return new Promise<void>(resolve => {
      this.scene.time.delayedCall(duration, resolve);
    });
  }

  private stepShake(step: CutsceneStep): Promise<void> {
    const intensity = step.shakeIntensity ?? 3;
    const duration = step.shakeDuration ?? 500;
    this.eventBus.emit(GameEvent.SCREEN_SHAKE, { intensity, duration });
    return new Promise<void>(resolve => {
      this.scene.time.delayedCall(duration, resolve);
    });
  }

  private stepMusic(step: CutsceneStep): Promise<void> {
    switch (step.musicAction) {
      case 'fade_out':
        this.eventBus.emit(GameEvent.MUSIC_FADE_OUT, { duration: step.musicFadeDuration ?? 2000 });
        break;
      case 'fade_to_silence':
        this.eventBus.emit(GameEvent.MUSIC_FADE_TO_SILENCE, { duration: step.musicFadeDuration ?? 2000 });
        break;
      case 'play':
        if (step.musicTrack) this.eventBus.emit(GameEvent.BGM_PLAY, step.musicTrack);
        break;
    }
    return Promise.resolve();
  }

  private stepSound(step: CutsceneStep): Promise<void> {
    if (step.sfxKey) this.eventBus.emit(GameEvent.SFX_PLAY, step.sfxKey);
    return Promise.resolve();
  }

  private stepParticles(step: CutsceneStep): Promise<void> {
    const x = step.particleX ?? GAME_WIDTH / 2;
    const y = step.particleY ?? GAME_HEIGHT / 2;
    this.eventBus.emit('particle:burst', {
      type: step.particleType ?? 'light',
      x, y,
      count: step.particleCount ?? 12,
    });
    return Promise.resolve();
  }

  private stepStat(step: CutsceneStep): Promise<void> {
    if (step.statKey && step.statAmount != null) {
      this.eventBus.emit('cutscene:stat_change', {
        stat: step.statKey,
        amount: step.statAmount,
      });
    }
    return Promise.resolve();
  }

  private stepToast(step: CutsceneStep): Promise<void> {
    if (step.toastText) {
      this.eventBus.emit(GameEvent.TOAST_SHOW, {
        text: step.toastText,
        type: step.toastType ?? 'info',
        icon: step.toastIcon,
        duration: 3500,
      });
    }
    return Promise.resolve();
  }

  private stepTitle(step: CutsceneStep): Promise<void> {
    return new Promise<void>(resolve => {
      const duration = step.titleDuration ?? 2500;
      const cx = GAME_WIDTH / 2;
      const cy = GAME_HEIGHT / 2;

      const bg = this.scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
        .setDepth(190).setScrollFactor(0);

      const titleObj = this.scene.add.text(cx, cy - 8, step.titleText ?? '', {
        fontSize: `${DesignSystem.FONT_SIZE.LG}px`,
        color: '#d4a853',
        fontFamily: FONT_FAMILY,
        align: 'center',
      }).setOrigin(0.5).setAlpha(0).setDepth(191).setScrollFactor(0);

      const subObj = step.titleSubtext
        ? this.scene.add.text(cx, cy + 10, step.titleSubtext, {
            fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
            color: '#b0a898',
            fontFamily: FONT_FAMILY,
            align: 'center',
          }).setOrigin(0.5).setAlpha(0).setDepth(191).setScrollFactor(0)
        : null;

      this.scene.tweens.add({
        targets: [bg, titleObj, subObj].filter(Boolean),
        alpha: { from: 0, to: 1 },
        duration: 600,
        ease: 'Sine.easeIn',
        onComplete: () => {
          this.scene.time.delayedCall(duration - 1200, () => {
            this.scene.tweens.add({
              targets: [bg, titleObj, subObj].filter(Boolean),
              alpha: 0,
              duration: 600,
              ease: 'Sine.easeOut',
              onComplete: () => {
                bg.destroy();
                titleObj.destroy();
                subObj?.destroy();
                resolve();
              },
            });
          });
        },
      });
    });
  }

  // ── Scene-level overlay for extreme darkness ─────────────────────────────

  createDarkOverlay(alpha = 0.8): Phaser.GameObjects.Rectangle {
    this.overlay?.destroy();
    this.overlay = this.scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, alpha)
      .setDepth(180)
      .setScrollFactor(0);
    return this.overlay;
  }

  fadeOverlay(targetAlpha: number, duration: number): Promise<void> {
    if (!this.overlay) return Promise.resolve();
    return new Promise<void>(resolve => {
      this.scene.tweens.add({
        targets: this.overlay,
        alpha: targetAlpha,
        duration,
        ease: 'Sine.easeInOut',
        onComplete: () => resolve(),
      });
    });
  }

  destroy(): void {
    this.cancel();
  }
}
