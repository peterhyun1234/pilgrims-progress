import type Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config';
import type { ChapterConfig, ChapterTheme } from '../ChapterData';

/**
 * Hides the hard seam where the camera-fixed parallax curtain meets the
 * camera-following tile floor. Three additive passes, all camera-fixed at
 * `horizonY = GAME_HEIGHT * 0.42` (matches `ParallaxBackground.horizonY`):
 *
 *   1. **Long bleed band** — extends the existing 32px `HorizonBlend` (in
 *      `ParallaxBackground.buildHorizonBlend`) to ~64px with smoother easing
 *      and uses the chapter's actual `groundBase` so the color matches the
 *      tile floor exactly (the parallax's `groundA` is a separate value that
 *      drifts from the tile palette).
 *
 *   2. **Foreground silhouette bumps** — irregular small mounds (~3–7px tall)
 *      sitting on the horizon line, drawn in `shadowColor`. They cross the
 *      sky-to-ground boundary so the eye reads them as one continuous surface
 *      rather than a stage curtain.
 *
 *   3. **Sky bleed onto top of ground** — a faint `skyBot` tint over the
 *      first ~12px of ground, so atmospheric color visually catches on the
 *      ground surface instead of stopping at the line.
 *
 * Only used by `SideScrollWorldRenderer`; legacy chapters keep their old
 * horizon look so this rolls out incrementally per chapter.
 */
const HORIZON_FRAC = 0.42;

type BumpStyle = 'rounded' | 'blades' | 'jagged' | 'mounds';

/** Maps `ChapterTheme.groundType` to a silhouette shape family.
 *  Unknown groundTypes fall back to 'rounded' (the safe default). */
function bumpStyleFor(groundType: ChapterTheme['groundType']): BumpStyle {
  switch (groundType) {
    case 'grass':
    case 'meadow':
    case 'forest':
      return 'blades';
    case 'rock':
    case 'dungeon':
      return 'jagged';
    case 'mud':
    case 'dark':
      return 'mounds';
    case 'cobble':
    case 'stone':
    case 'market':
    case 'gold':
    default:
      return 'rounded';
  }
}

export class HorizonBridge {
  private scene: Phaser.Scene;
  private layer: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  render(config: ChapterConfig): void {
    this.destroy();
    // Depth 3.7 — above ground/decor/terrain/vignette (0–3.5), below tile fog (4)
    // and everything else. ScrollFactor 0 pins it to the camera with the parallax.
    this.layer = this.scene.add
      .graphics()
      .setDepth(3.7)
      .setScrollFactor(0, 0);

    const theme = config.theme;
    const horizonY = Math.round(GAME_HEIGHT * HORIZON_FRAC);

    this.drawBleedBand(theme, horizonY);
    this.drawSkyBleedOnGround(theme, horizonY);
    this.drawForegroundBumps(theme, horizonY, config.chapter);
  }

  /** Smooth gradient bridging silhouette → groundBase over 64px. */
  private drawBleedBand(theme: ChapterTheme, horizonY: number): void {
    if (!this.layer) return;
    const g = this.layer;
    const W = GAME_WIDTH;
    const BLEND_H = 64;
    const STEPS = 16;

    // Use the tile palette's ground color so the gradient lands on something
    // that matches the actual tile floor color.
    const dstR = (theme.groundBase >> 16) & 0xff;
    const dstG = (theme.groundBase >> 8) & 0xff;
    const dstB = theme.groundBase & 0xff;
    const dst = (dstR << 16) | (dstG << 8) | dstB;

    // Top of the band starts solid (covers the parallax's silhouette base);
    // bottom fades to transparent so the tile ground detail still shows.
    for (let i = 0; i < STEPS; i++) {
      const t = i / STEPS;
      // smootherstep: t * t * (3 - 2t) reversed so we ease OUT toward bottom
      const eased = 1 - (t * t * (3 - 2 * t));
      const alpha = 0.85 * eased;
      g.fillStyle(dst, alpha);
      const y0 = Math.floor(horizonY - 2 + t * BLEND_H);
      const y1 = Math.floor(horizonY - 2 + (t + 1 / STEPS) * BLEND_H) + 1;
      g.fillRect(0, y0, W, y1 - y0);
    }
  }

  /** Faint atmospheric color tint on the top 12px of the ground area. */
  private drawSkyBleedOnGround(theme: ChapterTheme, horizonY: number): void {
    if (!this.layer) return;
    const g = this.layer;
    const W = GAME_WIDTH;
    const BLEED_H = 12;

    for (let i = 0; i < BLEED_H; i++) {
      const t = i / BLEED_H;
      const alpha = 0.18 * (1 - t);
      g.fillStyle(theme.skyBot, alpha);
      g.fillRect(0, horizonY + i, W, 1);
    }
  }

  /** Irregular foreground silhouettes on the horizon — shape varies by
   *  `theme.groundType` so different chapters feel materially distinct
   *  (grass blades vs. jagged rocks vs. rounded mounds). All variants share
   *  the deterministic per-chapter PRNG so positions don't shimmer on rebuild. */
  private drawForegroundBumps(theme: ChapterTheme, horizonY: number, chapter: number): void {
    if (!this.layer) return;
    const g = this.layer;
    const W = GAME_WIDTH;

    let seed = chapter * 9176 + 1;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    const style = bumpStyleFor(theme.groundType);
    const BUMP_COUNT = 28;
    const TALL_COUNT = 6;

    if (style === 'blades') {
      // Tall thin vertical grass/wheat blades — wide spread, irregular heights
      for (let i = 0; i < BUMP_COUNT + 12; i++) {
        const x = Math.round(rand() * W);
        const h = 3 + Math.round(rand() * 7);
        g.fillStyle(theme.shadowColor, 0.85);
        g.fillRect(x, horizonY - h + 1, 1, h + 1);
        // Sparse accent (highlight on a few blades)
        if ((i & 3) === 0) {
          g.fillStyle(theme.accentColor, 0.30);
          g.fillRect(x, horizonY - h + 1, 1, 1);
        }
      }
      // A few taller "stalks" for variety
      for (let i = 0; i < TALL_COUNT; i++) {
        const x = Math.round(rand() * W);
        const h = 8 + Math.round(rand() * 6);
        g.fillStyle(theme.shadowColor, 0.90);
        g.fillRect(x, horizonY - h + 1, 1, h + 1);
        g.fillRect(x - 1, horizonY - h + 1, 1, 2); // tiny side leaf
      }
      return;
    }

    if (style === 'jagged') {
      // Sharp triangular peaks — rocks / dungeon stalagmites
      for (let i = 0; i < BUMP_COUNT; i++) {
        const x = Math.round(rand() * W);
        const w = 4 + Math.round(rand() * 10);
        const h = 3 + Math.round(rand() * 7);
        g.fillStyle(theme.shadowColor, 0.82);
        g.fillTriangle(x, horizonY - h, x - w / 2, horizonY + 2, x + w / 2, horizonY + 2);
        // Edge highlight on the windward side
        g.fillStyle(theme.accentColor, 0.18);
        g.fillRect(x - 1, horizonY - h + 1, 1, Math.max(2, h - 1));
      }
      for (let i = 0; i < TALL_COUNT; i++) {
        const x = Math.round(rand() * W);
        const w = 14 + Math.round(rand() * 18);
        const h = 8 + Math.round(rand() * 10);
        g.fillStyle(theme.shadowColor, 0.88);
        g.fillTriangle(x, horizonY - h, x - w / 2, horizonY + 3, x + w / 2, horizonY + 3);
      }
      return;
    }

    if (style === 'mounds') {
      // Wide flat low mounds — swamp / mud / dark soil
      for (let i = 0; i < BUMP_COUNT; i++) {
        const x = Math.round(rand() * W);
        const w = 8 + Math.round(rand() * 16);
        const h = 1 + Math.round(rand() * 3);
        g.fillStyle(theme.shadowColor, 0.72);
        g.fillEllipse(x, horizonY + 2, w, h * 2);
      }
      for (let i = 0; i < TALL_COUNT; i++) {
        const x = Math.round(rand() * W);
        const w = 22 + Math.round(rand() * 24);
        const h = 4 + Math.round(rand() * 5);
        g.fillStyle(theme.shadowColor, 0.80);
        g.fillEllipse(x, horizonY + 3, w, h * 2);
      }
      return;
    }

    // Default 'rounded' — generic pebble silhouette (cobble/stone/gold/market)
    for (let i = 0; i < BUMP_COUNT; i++) {
      const x = Math.round(rand() * W);
      const w = 4 + Math.round(rand() * 10);
      const h = 2 + Math.round(rand() * 5);
      g.fillStyle(theme.shadowColor, 0.78);
      g.fillEllipse(x, horizonY + 1, w, h * 2);
      g.fillStyle(theme.accentColor, 0.20);
      g.fillRect(x - Math.round(w / 4), horizonY - h + 1, Math.max(2, Math.round(w / 2)), 1);
    }
    for (let i = 0; i < TALL_COUNT; i++) {
      const x = Math.round(rand() * W);
      const w = 12 + Math.round(rand() * 18);
      const h = 6 + Math.round(rand() * 8);
      g.fillStyle(theme.shadowColor, 0.85);
      g.fillEllipse(x, horizonY + 2, w, h * 2);
    }
  }

  destroy(): void {
    this.layer?.destroy();
    this.layer = null;
  }
}
