import Phaser from 'phaser';

export class ScreenShake {
  static shake(camera: Phaser.Cameras.Scene2D.Camera, intensity = 0.005, duration = 200): void {
    camera.shake(duration, intensity);
  }

  static zoom(camera: Phaser.Cameras.Scene2D.Camera, zoom: number, duration = 300): void {
    camera.zoomTo(zoom, duration);
  }

  static resetZoom(camera: Phaser.Cameras.Scene2D.Camera, duration = 300): void {
    camera.zoomTo(1, duration);
  }
}
