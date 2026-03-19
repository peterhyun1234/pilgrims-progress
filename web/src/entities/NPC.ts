import Phaser from 'phaser';
import { Entity } from './Entity';
import { NPC as NPCConfig } from '../config';
import { EventBus } from '../core/EventBus';
import { GameEvent } from '../core/GameEvents';

export class NPC extends Entity {
  public readonly id: string;
  public readonly nameKo: string;
  public readonly nameEn: string;
  private prompt?: Phaser.GameObjects.Text;
  private isNearPlayer = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    id: string,
    nameKo: string,
    nameEn: string,
  ) {
    super(scene, x, y, texture);
    this.id = id;
    this.nameKo = nameKo;
    this.nameEn = nameEn;

    this.sprite.setDepth(5);
    this.sprite.setImmovable(true);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    if (scene.anims.exists(`${texture}_idle_down`)) {
      this.sprite.anims.play(`${texture}_idle_down`, true);
    }

    this.prompt = scene.add
      .text(x, y + NPCConfig.PROMPT_OFFSET_Y, '!', {
        fontSize: '8px',
        color: '#E6C86E',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false);
  }

  update(playerX: number, playerY: number): void {
    const dist = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      playerX,
      playerY,
    );

    const wasNear = this.isNearPlayer;
    this.isNearPlayer = dist <= NPCConfig.INTERACTION_DISTANCE;

    if (this.prompt) {
      this.prompt.setPosition(this.sprite.x, this.sprite.y + NPCConfig.PROMPT_OFFSET_Y);
      this.prompt.setVisible(this.isNearPlayer);
    }

    if (this.isNearPlayer && !wasNear) {
      EventBus.getInstance().emit(GameEvent.NPC_PROMPT_SHOW, this.id);
    } else if (!this.isNearPlayer && wasNear) {
      EventBus.getInstance().emit(GameEvent.NPC_PROMPT_HIDE, this.id);
    }
  }

  destroy(): void {
    this.prompt?.destroy();
    super.destroy();
  }
}
