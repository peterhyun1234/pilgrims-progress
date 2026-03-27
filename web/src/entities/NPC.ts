import { Entity } from './Entity';
import { EventBus } from '../core/EventBus';
import { NPC_CONFIG, COLORS } from '../config';
import { DesignSystem, FONT_FAMILY } from '../ui/DesignSystem';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { GameEvent, NpcPhase, NpcPhaseChangedPayload } from '../core/GameEvents';
import { StatType } from '../core/GameEvents';

/** Character-specific idle behaviors beyond simple bob. */
export type NPCBehavior =
  | 'gesture'   // Periodic emphatic arm gesture (Evangelist-like)
  | 'pray'      // Slow devotional bob + periodic golden particle
  | 'read'      // Stationary tilt, page-turn micro-animation
  | 'pace'      // Anxious back-and-forth faster than patrol
  | 'cower'     // Reduced scale + shiver
  | 'guard'     // No bob, directional scan sweep
  | 'merchant'; // Beckoning hand gesture + '!' emote loop

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
  private completedBadge: Phaser.GameObjects.Text | null = null;
  private isPromptVisible = false;
  private baseY = 0;
  private baseYInit = false;
  private bobPhase: number;
  private glowGraphics: Phaser.GameObjects.Graphics | null = null;
  private currentPhase: NpcPhase = 'available';

  private behavior: NPCBehavior | undefined;
  private behaviorGraphics: Phaser.GameObjects.Graphics | null = null;

  // Patrol
  private patrolPath: { x: number; y: number }[] | null = null;
  private patrolSpeed: number;
  private patrolTween: Phaser.Tweens.Tween | null = null;
  private patrolPaused = false;
  private patrolIndex = 0;

  constructor(scene: Phaser.Scene, config: NPCConfig) {
    // Use generated 32×32 sprite if available, fallback to legacy PNG
    const genKey = `${config.id}_gen`;
    const texKey = scene.textures.exists(genKey) ? genKey : config.sprite;
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
        fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
        color: '#4a7c59',
        fontFamily: FONT_FAMILY,
        stroke: '#000000',
        strokeThickness: 2,
      },
    ).setOrigin(0.5).setDepth(21);
  }

  showPrompt(): void {
    if (this.isPromptVisible) return;
    if (this.currentPhase === 'locked') return;
    this.isPromptVisible = true;

    this.prompt = this.scene.add.container(
      this.sprite.x, this.sprite.y + NPC_CONFIG.PROMPT_OFFSET_Y - 12,
    ).setDepth(20);

    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.UI.PANEL, 0.88);
    bg.fillRoundedRect(-9, -7, 18, 14, 4);
    bg.lineStyle(1, COLORS.UI.GOLD, 0.5);
    bg.strokeRoundedRect(-9, -7, 18, 14, 4);

    // Completed NPCs show a dot instead of pulsing '!'
    const isIdlePhase = this.currentPhase === 'completed' || this.currentPhase === 'idle';
    const iconText = isIdlePhase ? '·' : '!';
    const iconColor = isIdlePhase ? '#888877' : '#d4a853';

    const icon = this.scene.add.text(0, 0, iconText, {
      fontSize: `${DesignSystem.FONT_SIZE.SM}px`,
      color: iconColor, fontFamily: FONT_FAMILY, fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 1, color: '#000', blur: 0, stroke: true, fill: true },
    }).setOrigin(0.5);

    this.prompt.add([bg, icon]);

    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const displayName = gm.language === 'ko' ? this.nameKo : this.nameEn;
    this.nameLabel = this.scene.add.text(
      this.sprite.x, this.sprite.y - 14,
      displayName, {
        fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
        color: '#b0a898', fontFamily: FONT_FAMILY,
        shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 0, stroke: true, fill: true },
      },
    ).setOrigin(0.5).setDepth(20);

    // Only pulse the '!' for available/active NPCs
    if (!isIdlePhase) {
      this.scene.tweens.add({
        targets: this.prompt,
        y: this.sprite.y + NPC_CONFIG.PROMPT_OFFSET_Y - 16,
        duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    this.glowGraphics = this.scene.add.graphics().setDepth(7);
    this.glowGraphics.fillStyle(COLORS.UI.GOLD, 0.18);
    this.glowGraphics.fillCircle(this.sprite.x, this.sprite.y, 22);
  }

  hidePrompt(): void {
    if (!this.isPromptVisible) return;
    this.isPromptVisible = false;
    this.prompt?.destroy(true);
    this.prompt = null;
    this.nameLabel?.destroy();
    this.nameLabel = null;
    this.glowGraphics?.destroy();
    this.glowGraphics = null;
  }

  interact(): void {
    if (this.currentPhase === 'locked') return;
    this.eventBus.emit('npc_interact', this.npcId);
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
    }
    if (this.completedBadge) {
      this.completedBadge.x = this.sprite.x;
      this.completedBadge.y = this.sprite.y - 20;
    }
    if (this.glowGraphics) {
      this.glowGraphics.clear();
      const pulse = 0.12 + Math.sin(t * 2) * 0.08;
      this.glowGraphics.fillStyle(COLORS.UI.GOLD, pulse);
      this.glowGraphics.fillCircle(this.sprite.x, this.sprite.y, 22);
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
