import Phaser from 'phaser';

export abstract class Entity {
  protected scene: Phaser.Scene;
  public sprite: Phaser.Physics.Arcade.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: number) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, texture, frame);
    this.sprite.setSize(12, 12);
    this.sprite.setOffset(2, 4);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
