import { Entity } from './Entity';
import { EventBus } from '../core/EventBus';
import { NPC_CONFIG, COLORS } from '../config';
import { DesignSystem, FONT_FAMILY } from '../ui/DesignSystem';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { GameEvent, NpcPhase, NpcPhaseChangedPayload } from '../core/GameEvents';
import { StatType } from '../core/GameEvents';
import { CharacterSpriteFactory } from './CharacterSpriteFactory';

/** Character-specific idle behaviors beyond simple bob. */
export type NPCBehavior =
  | 'gesture'   // Periodic emphatic arm gesture (Evangelist-like)
  | 'pray'      // Slow devotional bob + periodic golden particle
  | 'read'      // Stationary tilt, page-turn micro-animation
  | 'pace'      // Anxious back-and-forth faster than patrol
  | 'cower'     // Reduced scale + shiver
  | 'guard'     // No bob, directional scan sweep
  | 'merchant'  // Beckoning hand gesture + '!' emote loop
  | 'angelic'   // Floating hover + radiant halo pulse (Shining Ones)
  | 'welcome'   // Open-arm gentle sway + warm glow (Palace sisters)
  | 'judge';    // Imposing stillness + authority aura (Lord Hategood)

export interface NPCConfig {
  id: string;
  nameKo: string;
  nameEn: string;
  sprite: string;
  x: number;
  y: number;
  frame?: number;
  chapter: number;
  /** Prerequisite NPC id that must be 'completed' before this NPC becomes interactable. */
  unlockedAt?: string;
  /** Stat-based unlock: NPC becomes available when stat >= value. */
  minStatUnlock?: { stat: StatType; value: number };
  /** Optional patrol waypoints. NPC will loop through them via tweens. */
  patrolPath?: { x: number; y: number }[];
  /** Patrol speed in px/s (default 20). */
  patrolSpeed?: number;
  /** Character-specific idle behavior. */
  behavior?: NPCBehavior;
}

export class NPC extends Entity {
  public readonly npcId: string;
  public readonly nameKo: string;
  public readonly nameEn: string;

  private eventBus: EventBus;
  private prompt: Phaser.GameObjects.Container | null = null;
  private nameLabel: Phaser.GameObjects.Text | null = null;
  private nameBadgeGraphics: Phaser.GameObjects.Graphics | null = null;
  private completedBadge: Phaser.GameObjects.Text | null = null;
  private isPromptVisible = false;
  private baseY = 0;
  private baseYInit = false;
  private bobPhase: number;
  private glowGraphics: Phaser.GameObjects.Graphics | null = null;
  private currentPhase: NpcPhase = 'available';
  private _frameTick = 0;

  private behavior: NPCBehavior | undefined;
  private behaviorGraphics: Phaser.GameObjects.Graphics | null = null;

  // Patrol
  private patrolPath: { x: number; y: number }[] | null = null;
  private patrolSpeed: number;
  private patrolTween: Phaser.Tweens.Tween | null = null;
  private patrolPaused = false;
  private patrolIndex = 0;

  constructor(scene: Phaser.Scene, config: NPCConfig) {
    // Use generated 32×32 sprite if available; lazy-generate if missing
    const genKey = `${config.id}_gen`;
    let texKey: string;
    if (scene.textures.exists(genKey)) {
      texKey = genKey;
    } else if (scene.textures.exists(config.sprite)) {
      texKey = config.sprite;
    } else {
      // Lazy-generate character sprite on first use (in case PreloadScene was skipped)
      texKey = CharacterSpriteFactory.generate(scene, config.id);
    }
    super(scene, config.x, config.y, texKey, config.frame ?? 0);
    this.npcId = config.id;
    this.nameKo = config.nameKo;
    this.nameEn = config.nameEn;
    this.eventBus = EventBus.getInstance();
    this.bobPhase = Math.random() * Math.PI * 2;
    this.patrolSpeed = config.patrolSpeed ?? 20;
    this.behavior = config.behavior;

    this.sprite.setImmovable(true);
    this.sprite.setDepth(9);
    if (this.sprite.body) {
      // Hitbox proportional to sprite size
      const is32 = texKey.endsWith('_gen');
      if (is32) {
        (this.sprite.body as Phaser.Physics.Arcade.Body).setSize(12, 12).setOffset(10, 18);
      } else {
        (this.sprite.body as Phaser.Physics.Arcade.Body).setSize(10, 10).setOffset(3, 6);
      }
    }

    const anim = `${texKey}_idle_down`;
    if (scene.anims.exists(anim)) {
      this.sprite.play(anim, true);
    }

    if (config.patrolPath && config.patrolPath.length >= 2) {
      this.patrolPath = config.patrolPath;
      this.startPatrol();
    }

    this.eventBus.on(GameEvent.NPC_PHASE_CHANGED, this.onPhaseChanged);
  }

  private onPhaseChanged = (payload: NpcPhaseChangedPayload | undefined) => {
    if (!payload || payload.npcId !== this.npcId) return;
    this.setPhase(payload.phase);
  };

  setPhase(phase: NpcPhase): void {
    this.currentPhase = phase;

    switch (phase) {
      case 'locked':
        this.sprite.setAlpha(0.4);
        this.sprite.setTint(0x888888);
        this.hidePrompt();
        this.completedBadge?.destroy();
        this.completedBadge = null;
        break;

      case 'available':
        this.sprite.setAlpha(1);
        this.sprite.clearTint();
        this.completedBadge?.destroy();
        this.completedBadge = null;
        break;

      case 'active':
        this.sprite.setAlpha(1);
        this.sprite.clearTint();
        break;

      case 'completed':
        this.sprite.setAlpha(1);
        this.sprite.clearTint();
        this.hidePrompt();
        this.showCompletedBadge();
        break;

      case 'idle':
        this.sprite.setAlpha(1);
        this.sprite.clearTint();
        this.hidePrompt();
        this.showCompletedBadge();
        break;
    }
  }

  private showCompletedBadge(): void {
    if (this.completedBadge) return;
    this.completedBadge = this.scene.add.text(
      this.sprite.x, this.sprite.y - 20,
      '✓', {
        fontSize: `${DesignSystem.FONT_SIZE.SM}px`,
        color: '#d4a853',
        fontFamily: FONT_FAMILY,
        stroke: '#000000',
        strokeThickness: 3,
        shadow: { offsetX: 0, offsetY: 0, color: '#ffd080', blur: 4, fill: true },
      },
    ).setOrigin(0.5).setDepth(21);
    // Pulse the badge gently
    this.scene.tweens.add({
      targets: this.completedBadge,
      alpha: 0.55, scaleX: 0.9, scaleY: 0.9,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  showPrompt(): void {
    if (this.isPromptVisible) return;
    if (this.currentPhase === 'locked') return;
    this.isPromptVisible = true;

    this.prompt = this.scene.add.container(
      this.sprite.x, this.sprite.y + NPC_CONFIG.PROMPT_OFFSET_Y - 12,
    ).setDepth(20);

    // Completed NPCs show a dimmed orb instead of pulsing interaction orb
    const isIdlePhase = this.currentPhase === 'completed' || this.currentPhase === 'idle';

    // 3-layer glow orb prompt
    const bg = this.scene.add.graphics();
    if (!isIdlePhase) {
      // Outer soft glow (more visible — 0.12 → 0.22)
      bg.fillStyle(COLORS.UI.GOLD, 0.22);
      bg.fillCircle(0, 0, 10);
      // Mid ring
      bg.fillStyle(COLORS.UI.GOLD, 0.28);
      bg.fillCircle(0, 0, 7);
      // Core bright
      bg.fillStyle(0xffd080, 0.9);
      bg.fillCircle(0, 0, 4);
      // Gold border
      bg.lineStyle(1, COLORS.UI.GOLD, 0.7);
      bg.strokeCircle(0, 0, 7);
      // Inner sparkle cross
      bg.lineStyle(1, 0xffffff, 0.6);
      bg.lineBetween(-3, 0, 3, 0);
      bg.lineBetween(0, -3, 0, 3);
    } else {
      // Dimmed dot for completed phase
      bg.fillStyle(COLORS.UI.PANEL, 0.7);
      bg.fillRoundedRect(-7, -5, 14, 10, 3);
      bg.lineStyle(0.5, COLORS.UI.GOLD, 0.3);
      bg.strokeRoundedRect(-7, -5, 14, 10, 3);
      bg.fillStyle(0x888877, 0.6);
      bg.fillCircle(0, 0, 2.5);
    }

    this.prompt.add([bg]);

    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const displayName = gm.language === 'ko' ? this.nameKo : this.nameEn;

    // Name label with background pill
    const nameLabelObj = this.scene.add.text(
      this.sprite.x, this.sprite.y - 14,
      displayName, {
        fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
        color: '#d0c8b0', fontFamily: FONT_FAMILY, fontStyle: 'bold',
        shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 1, stroke: true, fill: true },
      },
    ).setOrigin(0.5).setDepth(20);
    this.nameLabel = nameLabelObj;

    // Name badge background (semi-transparent pill behind the text, tracked separately)
    this.nameBadgeGraphics = this.scene.add.graphics().setDepth(19);
    this.drawNameBadge(this.sprite.x, this.sprite.y - 14, nameLabelObj.width);

    // Only pulse the '!' for available/active NPCs
    if (!isIdlePhase) {
      this.scene.tweens.add({
        targets: this.prompt,
        y: this.sprite.y + NPC_CONFIG.PROMPT_OFFSET_Y - 16,
        duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    this.glowGraphics = this.scene.add.graphics().setDepth(7);
    // Initial draw — updated each frame in update()
    this.glowGraphics.fillStyle(COLORS.UI.GOLD, 0.12);
    this.glowGraphics.fillCircle(this.sprite.x, this.sprite.y, 28);
    this.glowGraphics.fillStyle(COLORS.UI.GOLD, 0.28);
    this.glowGraphics.fillCircle(this.sprite.x, this.sprite.y, 18);
  }

  private drawNameBadge(x: number, y: number, textWidth: number): void {
    if (!this.nameBadgeGraphics) return;
    this.nameBadgeGraphics.clear();
    const nw = textWidth + 10;
    const nh = 13;
    this.nameBadgeGraphics.fillStyle(0x0a0814, 0.72);
    this.nameBadgeGraphics.fillRoundedRect(x - nw / 2, y - nh / 2, nw, nh, 4);
    this.nameBadgeGraphics.lineStyle(0.5, COLORS.UI.GOLD, 0.4);
    this.nameBadgeGraphics.strokeRoundedRect(x - nw / 2, y - nh / 2, nw, nh, 4);
  }

  hidePrompt(): void {
    if (!this.isPromptVisible) return;
    this.isPromptVisible = false;
    this.prompt?.destroy(true);
    this.prompt = null;
    this.nameLabel?.destroy();
    this.nameLabel = null;
    this.nameBadgeGraphics?.destroy();
    this.nameBadgeGraphics = null;
    this.glowGraphics?.destroy();
    this.glowGraphics = null;
  }

  interact(): void {
    if (this.currentPhase === 'locked') return;
    this.eventBus.emit(GameEvent.NPC_INTERACT, this.npcId);
  }

  // ─── Patrol ──────────────────────────────────────────────────────────────

  private startPatrol(): void {
    if (!this.patrolPath || this.patrolPath.length < 2) return;
    this.advancePatrol();
  }

  private advancePatrol(): void {
    if (!this.patrolPath || this.patrolPaused) return;

    this.patrolIndex = (this.patrolIndex + 1) % this.patrolPath.length;
    const target = this.patrolPath[this.patrolIndex];
    const dx = target.x - this.sprite.x;
    const dy = target.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const duration = (dist / this.patrolSpeed) * 1000;

    this.patrolTween = this.scene.tweens.add({
      targets: this.sprite,
      x: target.x,
      y: target.y,
      duration,
      ease: 'Linear',
      onComplete: () => this.advancePatrol(),
    });
  }

  pausePatrol(): void {
    this.patrolPaused = true;
    this.patrolTween?.pause();
  }

  resumePatrol(): void {
    this.patrolPaused = false;
    if (this.patrolTween) {
      this.patrolTween.resume();
    } else {
      this.advancePatrol();
    }
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  update(): void {
    if (!this.baseYInit) { this.baseY = this.sprite.y; this.baseYInit = true; }

    const t = this.scene.time.now * 0.001;

    // Default bob (skipped for guard and actively patrolling NPCs)
    if (!this.patrolPath && this.behavior !== 'guard') {
      const bobSpeed = this.behavior === 'pray' ? 0.8 : 1.5;
      const bobAmp = this.behavior === 'cower' ? 0.2 : 0.5;
      const bob = Math.sin(t * bobSpeed + this.bobPhase) * bobAmp;
      this.sprite.y = this.baseY + bob;
    }

    // Behavior-specific animations
    this.applyBehavior(t);

    if (this.prompt) this.prompt.x = this.sprite.x;
    if (this.nameLabel) {
      this.nameLabel.x = this.sprite.x;
      this.nameLabel.y = this.sprite.y - 14;
      if (this.nameBadgeGraphics && this._frameTick % 3 === 0) {
        this.drawNameBadge(this.sprite.x, this.sprite.y - 14, this.nameLabel.width);
      }
    }
    if (this.completedBadge) {
      this.completedBadge.x = this.sprite.x;
      this.completedBadge.y = this.sprite.y - 20;
    }
    this._frameTick++;
    if (this.glowGraphics) {
      // Throttle glow redraw to every other frame — pulsing at 30fps is imperceptible.
      if (this._frameTick % 2 !== 0) return;
      this.glowGraphics.clear();
      // Skip glow for completed/idle NPCs
      if (this.currentPhase === 'completed' || this.currentPhase === 'idle') return;
      // Pulsing triple-layer bloom: outer (0.10-0.22), mid (0.25-0.45), inner (0.50-0.75)
      const pulse = 0.5 + Math.sin(t * 2.2) * 0.5; // 0..1 normalised
      // Wide outer aura
      this.glowGraphics.fillStyle(COLORS.UI.GOLD, 0.10 + pulse * 0.12);
      this.glowGraphics.fillCircle(this.sprite.x, this.sprite.y, 32);
      // Mid ring
      this.glowGraphics.fillStyle(COLORS.UI.GOLD, 0.25 + pulse * 0.20);
      this.glowGraphics.fillCircle(this.sprite.x, this.sprite.y, 20);
      // Inner bright core
      this.glowGraphics.fillStyle(COLORS.UI.GOLD, 0.50 + pulse * 0.25);
      this.glowGraphics.fillCircle(this.sprite.x, this.sprite.y, 10);
    }
  }

  private applyBehavior(t: number): void {
    if (!this.behavior) return;

    // Lazy-create behavior graphics layer
    if (!this.behaviorGraphics) {
      this.behaviorGraphics = this.scene.add.graphics().setDepth(10);
    }
    this.behaviorGraphics.clear();

    const sx = this.sprite.x;
    const sy = this.sprite.y;

    switch (this.behavior) {
      case 'gesture': {
        // Emphatic arm gesture — periodic scaleX flip + tilt sim
        const gesturePhase = (t * 0.5) % (Math.PI * 2);
        if (gesturePhase < 0.4) {
          // Arms-raised moment: scale tweak
          this.sprite.setScale(1 + Math.sin(gesturePhase / 0.4 * Math.PI) * 0.08, 1);
        } else {
          this.sprite.setScale(1, 1);
        }
        // Golden emphasis dot above head during gesture
        if (gesturePhase < 0.6) {
          const dotAlpha = Math.sin(gesturePhase / 0.6 * Math.PI) * 0.4;
          this.behaviorGraphics.fillStyle(0xd4a853, dotAlpha);
          this.behaviorGraphics.fillCircle(sx, sy - 22, 2.5);
        }
        break;
      }

      case 'pray': {
        // Devotional bob + golden aura pulsing
        const prayPulse = Math.sin(t * 1.2) * 0.5 + 0.5;
        this.behaviorGraphics.fillStyle(0xffd700, 0.04 + prayPulse * 0.04);
        this.behaviorGraphics.fillCircle(sx, sy, 14 + prayPulse * 4);
        // Occasional golden spark
        if (Math.floor(t * 2) % 3 === 0) {
          const sparkAngle = t * 3;
          const sparkR = 10 + Math.sin(t * 4) * 3;
          this.behaviorGraphics.fillStyle(0xffd700, 0.3);
          this.behaviorGraphics.fillCircle(
            sx + Math.cos(sparkAngle) * sparkR,
            sy + Math.sin(sparkAngle) * sparkR * 0.5,
            1.5,
          );
        }
        break;
      }

      case 'read': {
        // Stationary slight forward tilt (scaleX toward 0.95)
        const readTilt = 1 - Math.abs(Math.sin(t * 0.3)) * 0.05;
        this.sprite.setScale(readTilt, 1);
        // Page-turn: brief flash every ~4s
        const pageCycle = t % 4;
        if (pageCycle > 3.8) {
          this.behaviorGraphics.fillStyle(0xffffff, (4 - pageCycle) / 0.2 * 0.08);
          this.behaviorGraphics.fillRect(sx - 4, sy - 2, 8, 6);
        }
        break;
      }

      case 'pace': {
        // No extra graphical effect — patrol handles movement
        // Worry '?' emote above head periodically
        const worryCycle = t % 5;
        if (worryCycle < 0.8) {
          const wa = Math.sin(worryCycle / 0.8 * Math.PI) * 0.6;
          this.behaviorGraphics.fillStyle(0xaaaaaa, wa);
          this.behaviorGraphics.fillCircle(sx + 8, sy - 18, 3);
        }
        break;
      }

      case 'cower': {
        // Small scale + periodic shiver
        const shiver = Math.sin(t * 8) * 0.03;
        this.sprite.setScale(0.85 + shiver, 0.85);
        // Gray-blue tint pulse (fear)
        const fearAlpha = 0.02 + Math.sin(t * 2) * 0.01;
        this.behaviorGraphics.fillStyle(0x8888cc, Math.max(0, fearAlpha));
        this.behaviorGraphics.fillCircle(sx, sy, 10);
        break;
      }

      case 'guard': {
        // Scan sweep: sprite faces left/right periodically
        const scanPeriod = 4; // seconds per full sweep
        const scanPhase = (t % scanPeriod) / scanPeriod;
        if (scanPhase < 0.5) {
          this.sprite.setFlipX(false);
        } else {
          this.sprite.setFlipX(true);
        }
        // Alert chevron above head
        const alertPulse = Math.sin(t * 1.5) * 0.5 + 0.5;
        this.behaviorGraphics.fillStyle(0xaaaaaa, 0.15 + alertPulse * 0.1);
        this.behaviorGraphics.fillTriangle(sx - 4, sy - 22, sx, sy - 28, sx + 4, sy - 22);
        break;
      }

      case 'merchant': {
        // Beckoning hand: scale twitch + '!' flash
        const beckCycle = t % 2;
        if (beckCycle < 0.3) {
          this.sprite.setScale(1 + Math.sin(beckCycle / 0.3 * Math.PI) * 0.1, 1);
        } else {
          this.sprite.setScale(1, 1);
        }
        // '!' emote in merchant gold
        const emoteAlpha = 0.5 + Math.sin(t * 3) * 0.3;
        this.behaviorGraphics.fillStyle(0xffcc00, Math.max(0, emoteAlpha));
        this.behaviorGraphics.fillCircle(sx + 10, sy - 20, 3);
        this.behaviorGraphics.fillStyle(0xffcc00, Math.max(0, emoteAlpha) * 0.7);
        this.behaviorGraphics.fillCircle(sx + 10, sy - 14, 1.5);
        break;
      }

      case 'angelic': {
        // Celestial floating — override Y with hover offset
        const hoverY = Math.sin(t * 1.2) * 2.5;
        this.sprite.y = this.baseY + hoverY;
        // Radiant halo ring above head
        const haloPulse = 0.5 + Math.sin(t * 2.0) * 0.35;
        this.behaviorGraphics.lineStyle(1.5, 0xffd700, haloPulse);
        this.behaviorGraphics.strokeEllipse(sx, sy - 20, 16, 5);
        this.behaviorGraphics.lineStyle(0.8, 0xffffff, haloPulse * 0.5);
        this.behaviorGraphics.strokeEllipse(sx, sy - 20, 13, 4);
        // Soft gold body glow
        const bodyGlow = 0.06 + Math.sin(t * 1.6) * 0.03;
        this.behaviorGraphics.fillStyle(0xffd700, bodyGlow);
        this.behaviorGraphics.fillCircle(sx, sy, 18);
        // Rising light motes — 3 drifting particles
        for (let m = 0; m < 3; m++) {
          const mPhase = (t * 0.7 + m * 2.09) % (Math.PI * 2);
          const mX = sx + Math.cos(mPhase + m) * 10;
          const mY = sy - 10 - ((t * 20 + m * 15) % 30);
          const mA = (1 - ((t * 20 + m * 15) % 30) / 30) * 0.5;
          this.behaviorGraphics.fillStyle(0xffd700, mA);
          this.behaviorGraphics.fillCircle(mX, mY, 1);
        }
        break;
      }

      case 'welcome': {
        // Open-arm gentle sway — welcoming pose
        const swayAmp = Math.sin(t * 0.9) * 0.04;
        this.sprite.setScale(1 + swayAmp, 1);
        // Warm soft glow radiating outward
        const warmPulse = 0.04 + Math.sin(t * 1.3) * 0.02;
        this.behaviorGraphics.fillStyle(0xff9966, warmPulse);
        this.behaviorGraphics.fillCircle(sx, sy - 4, 16);
        this.behaviorGraphics.fillStyle(0xffdd88, warmPulse * 0.5);
        this.behaviorGraphics.fillCircle(sx, sy - 4, 22);
        // Small floating hearts — subtle, not kitsch
        const heartCycle = t % 4;
        if (heartCycle < 1.5) {
          const ha = Math.sin(heartCycle / 1.5 * Math.PI) * 0.25;
          const hy = sy - 22 - heartCycle * 6;
          this.behaviorGraphics.fillStyle(0xff8899, ha);
          this.behaviorGraphics.fillCircle(sx - 2, hy, 1.5);
          this.behaviorGraphics.fillCircle(sx + 2, hy, 1.5);
          this.behaviorGraphics.fillTriangle(sx - 3, hy + 1, sx, hy + 4, sx + 3, hy + 1);
        }
        break;
      }

      case 'judge': {
        // Imposing stillness — minimal movement, authority aura
        this.sprite.setScale(1, 1); // no bob override; handled by base bob = 0.5
        // Dark authority emanation — deep crimson ground shadow
        const judgePulse = 0.06 + Math.sin(t * 0.8) * 0.03;
        this.behaviorGraphics.fillStyle(0x660000, judgePulse);
        this.behaviorGraphics.fillEllipse(sx, sy + 10, 30, 8);
        this.behaviorGraphics.fillStyle(0xaa2200, judgePulse * 0.4);
        this.behaviorGraphics.fillEllipse(sx, sy + 10, 46, 12);
        // Subtle dark motes drifting downward (inverted prayer)
        for (let m = 0; m < 2; m++) {
          const mY = sy + ((t * 15 + m * 20) % 35);
          const mA = (1 - ((t * 15 + m * 20) % 35) / 35) * 0.2;
          this.behaviorGraphics.fillStyle(0x440000, mA);
          this.behaviorGraphics.fillCircle(sx + (m === 0 ? -5 : 5), mY, 1);
        }
        // Occasional gavel-like emphasis: scale pulse on a slow beat
        const judgeBeat = t % 3;
        if (judgeBeat < 0.15) {
          const beatPulse = Math.sin(judgeBeat / 0.15 * Math.PI) * 0.06;
          this.sprite.setScale(1 + beatPulse, 1 - beatPulse * 0.3);
        }
        break;
      }
    }
  }

  override destroy(): void {
    this.eventBus.off(GameEvent.NPC_PHASE_CHANGED, this.onPhaseChanged);
    this.patrolTween?.destroy();
    this.patrolTween = null;
    // Kill any orphaned tweens targeting this sprite
    if (this.scene?.tweens) {
      this.scene.tweens.killTweensOf(this.sprite);
    }
    this.hidePrompt();
    this.completedBadge?.destroy();
    this.behaviorGraphics?.destroy();
    this.behaviorGraphics = null;
    super.destroy();
  }
}
