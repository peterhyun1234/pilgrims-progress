import Phaser from 'phaser';

export class ScreenEffects {
  static fadeIn(camera: Phaser.Cameras.Scene2D.Camera, duration = 500): void {
    camera.fadeIn(duration);
  }

  static fadeOut(camera: Phaser.Cameras.Scene2D.Camera, duration = 500): void {
    camera.fadeOut(duration);
  }

  static flash(camera: Phaser.Cameras.Scene2D.Camera, duration = 200): void {
    camera.flash(duration, 255, 255, 255);
  }
}
