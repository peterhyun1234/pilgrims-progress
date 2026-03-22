import Phaser from 'phaser';

export abstract class Entity {
  protected scene: Phaser.Scene;
  public sprite: Phaser.Physics.Arcade.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: number) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, texture, frame);
  }

  setPosition(x: number, y: number): void {
    this.sprite.setPosition(x, y);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
