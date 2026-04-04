import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { EventBus } from '../core/EventBus';
import { GameEvent } from '../core/GameEvents';

interface LightSource {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: number;
  alpha: number;
  flicker?: boolean;
  /** If set, follows this game object's position */
  follow?: Phaser.GameObjects.Sprite;
}

/**
 * Dynamic lighting overlay using alpha-masked Graphics.
 * Creates a dark overlay with "holes" punched for each light source,
 * simulating point lights without requiring WebGL Light2D pipeline.
 * Compatible with all renderers (Canvas & WebGL).
 */
export class LightingManager {
  private scene: Phaser.Scene;
  private overlay: Phaser.GameObjects.Graphics;
  private lights: Map<string, LightSource> = new Map();
  private eventBus: EventBus;
  private ambientAlpha = 0.3;
  private ambientColor = 0x000000;
  private enabled = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventBus = EventBus.getInstance();
    this.overlay = scene.add.graphics().setDepth(50).setScrollFactor(0);
    this.setupEvents();
  }

  private setupEvents(): void {
    this.eventBus.on(GameEvent.LIGHT_CHANGE, this.onLightChange);
  }

  private onLightChange = (payload?: { action: string; alpha?: number; color?: number }) => {
    if (!payload) return;
    if (payload.action === 'darken') {
      this.setAmbient(payload.alpha ?? 0.5, payload.color ?? 0x000000);
    } else if (payload.action === 'brighten') {
      this.setAmbient(payload.alpha ?? 0.1, payload.color ?? 0x000000);
    } else if (payload.action === 'tint') {
      this.setAmbient(this.ambientAlpha, payload.color ?? 0x000000);
    }
  };

  /** Set the ambient darkness level */
  setAmbient(alpha: number, color = 0x000000): void {
    this.ambientAlpha = Phaser.Math.Clamp(alpha, 0, 0.9);
    this.ambientColor = color;
  }

  /** Set ambient based on chapter theme — stronger values for real lighting presence */
  setChapterLighting(chapter: number): void {
    // Values tripled from v1; dark chapters are now distinctly darker
    switch (chapter) {
      case 1:  this.setAmbient(0.18, 0x100808); break; // City of Destruction — ashen tint
      case 2:  this.setAmbient(0.22, 0x0a1a10); break; // Slough — murky green
      case 3:  this.setAmbient(0.10, 0x060412); break; // Wicket Gate — night-ish
      case 4:  this.setAmbient(0.12, 0x080514); break; // Interpreter's House — dim candlelight
      case 5:  this.setAmbient(0.20, 0x100a08); break; // Hill of Difficulty — oppressive dusk
      case 6:  this.setAmbient(0.08, 0x080a06); break; // Palace Beautiful — gentle evening
      case 7:  this.setAmbient(0.28, 0x0a0408); break; // Valley of Humiliation — dark
      case 8:  this.setAmbient(0.35, 0x100204); break; // Apollyon — volcanic darkness
      case 9:  this.setAmbient(0.42, 0x060108); break; // Shadow of Death — near-pitch black
      case 10: this.setAmbient(0.14, 0x080c14); break; // Vanity Fair — cold city glow
      case 11: this.setAmbient(0.25, 0x080810); break; // Doubting Castle — grey gloom
      case 12: this.setAmbient(0.06, 0x100c04); break; // Celestial City — golden glow
      default: this.setAmbient(0.12, 0x000000); break;
    }
  }

  /** Add a light source (torch, player glow, etc.) */
  addLight(id: string, x: number, y: number, radius: number, color = 0xffd4a0, alpha = 0.8, flicker = false): void {
    this.lights.set(id, { id, x, y, radius, color, alpha, flicker });
  }

  /** Add a light that follows a sprite */
  addFollowLight(id: string, sprite: Phaser.GameObjects.Sprite, radius: number, color = 0xffd4a0, alpha = 0.8): void {
    this.lights.set(id, { id, x: sprite.x, y: sprite.y, radius, color, alpha, follow: sprite });
  }

  removeLight(id: string): void {
    this.lights.delete(id);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.overlay.setVisible(enabled);
  }

  /** Call every frame to redraw the lighting overlay */
  update(): void {
    if (!this.enabled || this.ambientAlpha <= 0.01) {
      this.overlay.clear();
      return;
    }

    const cam = this.scene.cameras.main;
    const time = this.scene.time.now * 0.001;

    // Use a RenderTexture-based approach: draw ambient dark, then draw
    // warm-colored circles where lights are to "brighten" those areas.
    // Since we can't truly punch holes in Graphics, we draw the dark overlay
    // as strips, skipping areas near lights. Simple but effective.

    this.overlay.clear();

    // Collect light screen positions
    const screenLights: { x: number; y: number; r: number; a: number; color: number }[] = [];
    this.lights.forEach(light => {
      if (light.follow?.active) {
        light.x = light.follow.x;
        light.y = light.follow.y;
      }
      const sx = light.x - cam.scrollX;
      const sy = light.y - cam.scrollY;
      if (sx < -light.radius * 2 || sx > GAME_WIDTH + light.radius * 2 ||
          sy < -light.radius * 2 || sy > GAME_HEIGHT + light.radius * 2) return;

      let radius = light.radius;
      if (light.flicker) {
        const flick = Math.sin(time * 8 + light.x * 0.1) * 0.15 +
                       Math.sin(time * 13 + light.y * 0.1) * 0.1;
        radius *= (1 + flick * 0.15);
      }
      screenLights.push({ x: sx, y: sy, r: radius, a: light.alpha, color: light.color });
    });

    // Draw ambient overlay with per-pixel alpha variation near lights
    // For performance, we use a grid-based approach (8px cells)
    const cellSize = 8;
    const cols = Math.ceil(GAME_WIDTH / cellSize) + 1;
    const rows = Math.ceil(GAME_HEIGHT / cellSize) + 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx = col * cellSize;
        const cy = row * cellSize;

        // Calculate light influence at this cell
        let lightInfluence = 0;
        for (const sl of screenLights) {
          const dx = cx - sl.x;
          const dy = cy - sl.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < sl.r) {
            const falloff = 1 - (dist / sl.r);
            lightInfluence += falloff * falloff * sl.a;
          }
        }

        const finalAlpha = Math.max(0, this.ambientAlpha * (1 - Math.min(lightInfluence, 1)));
        if (finalAlpha > 0.01) {
          this.overlay.fillStyle(this.ambientColor, finalAlpha);
          this.overlay.fillRect(cx, cy, cellSize, cellSize);
        }
      }
    }

    // Add warm glow at light centers — multi-layer with visible bloom
    for (const sl of screenLights) {
      // Outer bloom (wide, soft)
      this.overlay.fillStyle(sl.color, 0.035 * sl.a);
      this.overlay.fillCircle(sl.x, sl.y, sl.r * 0.65);
      // Mid ring
      this.overlay.fillStyle(sl.color, 0.06 * sl.a);
      this.overlay.fillCircle(sl.x, sl.y, sl.r * 0.42);
      // Inner warm core
      this.overlay.fillStyle(sl.color, 0.10 * sl.a);
      this.overlay.fillCircle(sl.x, sl.y, sl.r * 0.24);
      // Bright center
      this.overlay.fillStyle(0xffffff, 0.04 * sl.a);
      this.overlay.fillCircle(sl.x, sl.y, sl.r * 0.10);
    }
  }

  destroy(): void {
    this.eventBus.off(GameEvent.LIGHT_CHANGE, this.onLightChange);
    this.overlay.destroy();
    this.lights.clear();
  }
}
