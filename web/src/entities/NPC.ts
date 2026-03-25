import { Entity } from './Entity';
import { EventBus } from '../core/EventBus';
import { NPC_CONFIG, COLORS } from '../config';
import { DesignSystem, FONT_FAMILY } from '../ui/DesignSystem';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { GameEvent, NpcPhase, NpcPhaseChangedPayload } from '../core/GameEvents';
import { StatType } from '../core/GameEvents';

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

  // Patrol
  private patrolPath: { x: number; y: number }[] | null = null;
  private patrolSpeed: number;
  private patrolTween: Phaser.Tweens.Tween | null = null;
  private patrolPaused = false;
  private patrolIndex = 0;

  constructor(scene: Phaser.Scene, config: NPCConfig) {
    super(scene, config.x, config.y, config.sprite, config.frame ?? 0);

    this.npcId = config.id;
    this.nameKo = config.nameKo;
    this.nameEn = config.nameEn;
    this.eventBus = EventBus.getInstance();
    this.bobPhase = Math.random() * Math.PI * 2;
    this.patrolSpeed = config.patrolSpeed ?? 20;

    this.sprite.setImmovable(true);
    this.sprite.setDepth(9);
    if (this.sprite.body) {
      (this.sprite.body as Phaser.Physics.Arcade.Body).setSize(10, 10).setOffset(3, 6);
    }

    const anim = `${config.sprite}_idle_down`;
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
        fontSize: '6px',
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
    this.glowGraphics.fillStyle(COLORS.UI.GOLD, 0.06);
    this.glowGraphics.fillCircle(this.sprite.x, this.sprite.y, 20);
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

    // Only bob if not patrolling
    if (!this.patrolPath) {
      const bob = Math.sin(t * 1.5 + this.bobPhase) * 0.5;
      this.sprite.y = this.baseY + bob;
    }

    if (this.prompt) {
      this.prompt.x = this.sprite.x;
    }
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
      const pulse = 0.04 + Math.sin(t * 2) * 0.02;
      this.glowGraphics.fillStyle(COLORS.UI.GOLD, pulse);
      this.glowGraphics.fillCircle(this.sprite.x, this.sprite.y, 20);
    }
  }

  override destroy(): void {
    this.eventBus.off(GameEvent.NPC_PHASE_CHANGED, this.onPhaseChanged);
    this.patrolTween?.destroy();
    this.hidePrompt();
    this.completedBadge?.destroy();
    super.destroy();
  }
}
