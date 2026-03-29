import Phaser from 'phaser';
import { COLORS } from '../config';
import { EventBus } from '../core/EventBus';
import { GameEvent, EmoteType } from '../core/GameEvents';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { AudioManager } from '../audio/AudioManager';

/**
 * Game-feel ("juice") effects: hit freeze, squash/stretch, emote bubbles,
 * speed lines, impact flashes, and pickup sparkles.
 */

const EMOTE_ICONS: Record<EmoteType, string> = {
  surprise: '!',
  question: '?',
  thinking: '...',
  joy: '\u2665',       // ♥
  anger: '\u2620',     // ☠ (skull & crossbones for rage)
  sadness: '\u2639',   // ☹
  fear: '\u203c',      // ‼
  love: '\u2764',      // ❤
  frustration: '\u2026', // …
  sleep: 'z',
  shine: '\u2726',     // ✦
  cross: '\u271a',     // ✚
};

const EMOTE_COLORS: Partial<Record<EmoteType, number>> = {
  surprise: 0xffd700,
  question: 0x4a90d9,
  joy: 0xff69b4,
  anger: 0xff4444,
  sadness: 0x6688aa,
  love: 0xff3366,
  shine: 0xffd700,
  cross: 0xd4a853,
};

export class JuiceEffects {
  private scene: Phaser.Scene;
  private eventBus: EventBus;
  private activeEmotes = new Map<string, Phaser.GameObjects.Container>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventBus = EventBus.getInstance();
    this.setupListeners();
  }

  private setupListeners(): void {
    this.eventBus.on(GameEvent.EMOTE_SHOW, this.onEmoteShow);
    this.eventBus.on(GameEvent.PLAYER_DAMAGED, this.onPlayerDamaged);
    this.eventBus.on(GameEvent.ITEM_ACQUIRED, this.onItemAcquired);
    this.eventBus.on(GameEvent.BIBLE_CARD_COLLECTED, this.onCardCollected);
  }

  destroy(): void {
    this.eventBus.off(GameEvent.EMOTE_SHOW, this.onEmoteShow);
    this.eventBus.off(GameEvent.PLAYER_DAMAGED, this.onPlayerDamaged);
    this.eventBus.off(GameEvent.ITEM_ACQUIRED, this.onItemAcquired);
    this.eventBus.off(GameEvent.BIBLE_CARD_COLLECTED, this.onCardCollected);
    this.activeEmotes.forEach(e => e.destroy());
    this.activeEmotes.clear();
  }

  // ─── Hit Freeze ──────────────────────────────────────────────────────

  /**
   * Pauses the game for a few frames on damage — creates impact weight.
   * Used by BattleScene and Player.onDamaged.
   */
  hitFreeze(durationMs = 60): void {
    this.scene.time.timeScale = 0;
    this.scene.physics?.world?.pause();

    this.scene.time.addEvent({
      delay: durationMs,
      callback: () => {
        this.scene.time.timeScale = 1;
        this.scene.physics?.world?.resume();
      },
      callbackScope: this,
    });
  }

  // ─── Impact Flash ─────────────────────────────────────────────────

  /** White flash overlay that fades out — used on critical hits */
  impactFlash(color = 0xffffff, alpha = 0.4, duration = 120): void {
    const { width, height } = this.scene.cameras.main;
    const flash = this.scene.add.rectangle(
      width / 2, height / 2, width + 20, height + 20,
      color, alpha,
    ).setScrollFactor(0).setDepth(9990);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });
  }

  // ─── Emote Bubble ─────────────────────────────────────────────────

  private onEmoteShow = (payload?: { target: string; emote: EmoteType; duration?: number }) => {
    if (!payload) return;
    this.showEmote(payload.target, payload.emote, payload.duration);
  };

  /**
   * Show a floating emote bubble above a game object.
   * @param targetKey - npcId or 'player'
   * @param emote - emote type
   * @param duration - how long to show (ms, default 1500)
   */
  showEmote(targetKey: string, emote: EmoteType, duration = 1500): void {
    // Remove existing emote for this target
    const existing = this.activeEmotes.get(targetKey);
    if (existing) {
      existing.destroy();
      this.activeEmotes.delete(targetKey);
    }

    // Find target sprite
    const target = this.findTarget(targetKey);
    if (!target) return;

    const icon = EMOTE_ICONS[emote] ?? '!';
    const color = EMOTE_COLORS[emote] ?? 0xffffff;

    const container = this.scene.add.container(target.x, target.y - 24).setDepth(100);

    // Bubble background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1428, 0.9);
    bg.fillRoundedRect(-10, -10, 20, 20, 6);
    bg.lineStyle(1, color, 0.7);
    bg.strokeRoundedRect(-10, -10, 20, 20, 6);

    // Bubble tail
    bg.fillStyle(0x1a1428, 0.9);
    bg.fillTriangle(-3, 10, 3, 10, 0, 15);

    // Icon text
    const text = this.scene.add.text(0, 0, icon, {
      fontSize: '10px',
      color: '#' + color.toString(16).padStart(6, '0'),
      fontFamily: "'Silkscreen', monospace",
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, text]);
    this.activeEmotes.set(targetKey, container);

    // Pop-in animation
    container.setScale(0);
    this.scene.tweens.add({
      targets: container,
      scaleX: 1, scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });

    // Icon bounce
    this.scene.tweens.add({
      targets: text,
      y: -2,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Follow target position
    const followEvent = this.scene.time.addEvent({
      delay: 16,
      repeat: Math.floor(duration / 16),
      callback: () => {
        if (!target.active) {
          container.destroy();
          this.activeEmotes.delete(targetKey);
          return;
        }
        container.x = target.x;
        container.y = target.y - 24;
      },
    });

    // Fade out and destroy
    this.scene.time.delayedCall(duration - 300, () => {
      this.scene.tweens.add({
        targets: container,
        alpha: 0,
        scaleX: 0.5, scaleY: 0.5,
        y: container.y - 8,
        duration: 300,
        ease: 'Quad.easeIn',
        onComplete: () => {
          followEvent.destroy();
          container.destroy();
          this.activeEmotes.delete(targetKey);
        },
      });
    });
  }

  private findTarget(key: string): Phaser.GameObjects.Sprite | null {
    const children = this.scene.children.list;
    for (const child of children) {
      if (child instanceof Phaser.GameObjects.Sprite) {
        // Match player by texture key
        if (key === 'player' && (child.texture.key === 'christian_gen' || child.texture.key === 'christian')) {
          return child;
        }
        // Match NPC by generated texture key
        if (child.texture.key === `${key}_gen` || child.texture.key === key) {
          return child;
        }
      }
    }
    return null;
  }

  // ─── Pickup Sparkles ──────────────────────────────────────────────

  private onItemAcquired = () => {
    this.spawnSparkles('player', 0xd4a853, 8);
    const audio = ServiceLocator.get<AudioManager>(SERVICE_KEYS.AUDIO_MANAGER);
    audio?.procedural?.playPickup();
  };

  private onCardCollected = () => {
    this.spawnSparkles('player', 0xffd700, 12);
    this.impactFlash(COLORS.UI.GOLD, 0.15, 200);
    const audio = ServiceLocator.get<AudioManager>(SERVICE_KEYS.AUDIO_MANAGER);
    audio?.procedural?.playPickup();
  };

  /** Spawn sparkle particles around a target */
  spawnSparkles(targetKey: string, color: number, count = 8): void {
    const target = this.findTarget(targetKey);
    if (!target) return;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = 8 + Math.random() * 12;
      const px = target.x + Math.cos(angle) * dist;
      const py = target.y + Math.sin(angle) * dist - 4;

      const spark = this.scene.add.circle(px, py, 1.5, color, 1).setDepth(99);

      this.scene.tweens.add({
        targets: spark,
        x: px + Math.cos(angle) * 10,
        y: py + Math.sin(angle) * 10 - 6,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 400 + Math.random() * 300,
        ease: 'Quad.easeOut',
        delay: i * 30,
        onComplete: () => spark.destroy(),
      });
    }
  }

  // ─── Speed Lines ──────────────────────────────────────────────────

  /** Radial speed lines for dash/run states */
  showSpeedLines(x: number, y: number, dirX: number, _dirY?: number): void {
    const count = 3;
    for (let i = 0; i < count; i++) {
      const offsetY = (Math.random() - 0.5) * 8;
      const lineX = x - dirX * 6;
      const lineY = y + offsetY;

      const line = this.scene.add.graphics().setDepth(8);
      line.lineStyle(0.5, 0xffffff, 0.3);
      line.lineBetween(lineX, lineY, lineX - dirX * 8, lineY);

      this.scene.tweens.add({
        targets: line,
        alpha: 0,
        duration: 200,
        onComplete: () => line.destroy(),
      });
    }
  }

  // ─── Damage handler ───────────────────────────────────────────────

  private onPlayerDamaged = () => {
    this.hitFreeze(80);
    this.impactFlash(0xff2222, 0.25, 150);
    this.scene.cameras.main.shake(200, 0.008);
    const audio = ServiceLocator.get<AudioManager>(SERVICE_KEYS.AUDIO_MANAGER);
    audio?.procedural?.playHit();
  };

  // ─── Phase 5A additions ────────────────────────────────────────────

  /**
   * Brief full-screen color flash overlay.
   * @param color  - hex color for the flash
   * @param duration - fade-out duration in ms
   */
  flashScreen(color = 0xffffff, duration = 150): void {
    this.impactFlash(color, 0.45, duration);
  }

  /**
   * Floating damage number that rises and fades.
   * @param x/y  - world position
   * @param amount - numeric damage value
   * @param color  - hex color
   */
  damageNumber(x: number, y: number, amount: number, color = 0xff4444): void {
    const colorHex = '#' + color.toString(16).padStart(6, '0');
    const sign = amount > 0 ? '+' : '';
    const txt = this.scene.add.text(x, y - 8, `${sign}${amount}`, {
      fontSize: '11px',
      color: colorHex,
      fontFamily: "'Silkscreen', monospace",
      fontStyle: 'bold',
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 0, stroke: true, fill: true },
    }).setOrigin(0.5).setDepth(200);

    this.scene.tweens.add({
      targets: txt,
      y: y - 28,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 700,
      ease: 'Quad.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  /**
   * 6-8 tiny particles explode outward then fade.
   * @param x/y    - world position
   * @param color  - hex particle color
   */
  spawnPickupParticles(x: number, y: number, color = 0xd4a853): void {
    const count = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 12 + Math.random() * 16;
      const p = this.scene.add.circle(x, y, 1.5 + Math.random(), color, 0.9)
        .setDepth(99);
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed - 6,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: 350 + Math.random() * 200,
        ease: 'Quad.easeOut',
        delay: i * 20,
        onComplete: () => p.destroy(),
      });
    }
  }

  /**
   * "xN COMBO!" text with scale-in animation.
   * @param x/y   - world position
   * @param count - combo multiplier (shown as x2, x3 etc.)
   */
  comboText(x: number, y: number, count: number): void {
    if (count < 2) return;
    const label = `x${count} COMBO!`;
    const txt = this.scene.add.text(x, y, label, {
      fontSize: '12px',
      color: '#ffdd44',
      fontFamily: "'Silkscreen', monospace",
      fontStyle: 'bold',
      shadow: { offsetX: 1, offsetY: 1, color: '#aa6600', blur: 0, stroke: true, fill: true },
    }).setOrigin(0.5).setDepth(201).setScale(0).setAlpha(0);

    this.scene.tweens.add({
      targets: txt,
      scaleX: 1.2, scaleY: 1.2, alpha: 1,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(600, () => {
          this.scene.tweens.add({
            targets: txt, alpha: 0, y: y - 16,
            duration: 300, ease: 'Quad.easeIn',
            onComplete: () => txt.destroy(),
          });
        });
      },
    });
  }

  // ─── Static helpers ───────────────────────────────────────────────

  /** Enhanced squash/stretch with overshoot */
  static squash(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.Sprite,
    sx: number, sy: number,
    duration: number,
    ease = 'Back.easeOut',
  ): void {
    scene.tweens.add({
      targets: target,
      scaleX: sx, scaleY: sy,
      duration: duration / 2,
      yoyo: true,
      ease,
    });
  }

  /** Landing impact: squash + dust ring */
  static landingImpact(scene: Phaser.Scene, target: Phaser.GameObjects.Sprite): void {
    JuiceEffects.squash(scene, target, 1.3, 0.7, 200, 'Sine.easeOut');

    // Dust puff
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const px = target.x + Math.cos(angle) * 4;
      const py = target.y + 6;
      const dust = scene.add.circle(px, py, 1.5, 0x888877, 0.4).setDepth(8);
      scene.tweens.add({
        targets: dust,
        x: px + Math.cos(angle) * 6,
        y: py - 2,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 300,
        onComplete: () => dust.destroy(),
      });
    }
  }
}
