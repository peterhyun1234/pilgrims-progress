import { Entity } from './Entity';
import { EventBus } from '../core/EventBus';
import { NPC_CONFIG, COLORS } from '../config';
import { DesignSystem, FONT_FAMILY } from '../ui/DesignSystem';

export interface NPCConfig {
  id: string;
  nameKo: string;
  nameEn: string;
  sprite: string;
  x: number;
  y: number;
  frame?: number;
  chapter: number;
}

export class NPC extends Entity {
  public readonly npcId: string;
  public readonly nameKo: string;
  public readonly nameEn: string;

  private eventBus: EventBus;
  private prompt: Phaser.GameObjects.Container | null = null;
  private nameLabel: Phaser.GameObjects.Text | null = null;
  private isPromptVisible = false;
  private idleTimer = 0;
  private bobPhase: number;
  private glowGraphics: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, config: NPCConfig) {
    super(scene, config.x, config.y, config.sprite, config.frame ?? 0);

    this.npcId = config.id;
    this.nameKo = config.nameKo;
    this.nameEn = config.nameEn;
    this.eventBus = EventBus.getInstance();
    this.bobPhase = Math.random() * Math.PI * 2;

    this.sprite.setImmovable(true);
    this.sprite.setDepth(9);
    if (this.sprite.body) {
      (this.sprite.body as Phaser.Physics.Arcade.Body).setSize(10, 10).setOffset(3, 6);
    }

    const anim = `${config.sprite}_idle_down`;
    if (scene.anims.exists(anim)) {
      this.sprite.play(anim, true);
    }
  }

  showPrompt(): void {
    if (this.isPromptVisible) return;
    this.isPromptVisible = true;

    this.prompt = this.scene.add.container(
      this.sprite.x, this.sprite.y + NPC_CONFIG.PROMPT_OFFSET_Y - 12,
    ).setDepth(20);

    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.UI.PANEL, 0.88);
    bg.fillRoundedRect(-9, -7, 18, 14, 4);
    bg.lineStyle(1, COLORS.UI.GOLD, 0.5);
    bg.strokeRoundedRect(-9, -7, 18, 14, 4);

    const icon = this.scene.add.text(0, 0, '!', {
      fontSize: `${DesignSystem.FONT_SIZE.SM}px`,
      color: '#d4a853', fontFamily: FONT_FAMILY, fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 1, color: '#000', blur: 2, stroke: true, fill: true },
    }).setOrigin(0.5);

    this.prompt.add([bg, icon]);

    this.nameLabel = this.scene.add.text(
      this.sprite.x, this.sprite.y - 14,
      this.nameEn, {
        fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
        color: '#b0a898', fontFamily: FONT_FAMILY,
        shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, stroke: true, fill: true },
      },
    ).setOrigin(0.5).setDepth(20);

    this.scene.tweens.add({
      targets: this.prompt,
      y: this.sprite.y + NPC_CONFIG.PROMPT_OFFSET_Y - 16,
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

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
    this.eventBus.emit('npc_interact', this.npcId);
  }

  update(): void {
    this.idleTimer += 0.016;

    const bob = Math.sin(this.idleTimer * 1.5 + this.bobPhase) * 0.5;
    if (!this.sprite.getData('baseY')) this.sprite.setData('baseY', this.sprite.y);
    this.sprite.y = (this.sprite.getData('baseY') as number) + bob;

    if (this.prompt) {
      this.prompt.x = this.sprite.x;
    }
    if (this.nameLabel) {
      this.nameLabel.x = this.sprite.x;
      this.nameLabel.y = this.sprite.y - 14;
    }
    if (this.glowGraphics) {
      this.glowGraphics.clear();
      const pulse = 0.04 + Math.sin(this.idleTimer * 2) * 0.02;
      this.glowGraphics.fillStyle(COLORS.UI.GOLD, pulse);
      this.glowGraphics.fillCircle(this.sprite.x, this.sprite.y, 20);
    }
  }

  override destroy(): void {
    this.hidePrompt();
    super.destroy();
  }
}
