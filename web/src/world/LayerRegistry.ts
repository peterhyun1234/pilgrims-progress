/**
 * Single source of truth for every Phaser GameObject depth used by the world
 * rendering stack. Replaces ~193 scattered `setDepth(N)` calls. Numbers chosen
 * to match the values in use today so adoption is incremental and safe.
 *
 * Phase 1: new world systems (renderers, lighting, building facades, camera)
 * read from here. Existing code paths keep their literal depths until migrated.
 */
export const LAYER = {
  // ── Parallax curtain (camera-fixed, side-scroll chapters only) ───────────
  PARALLAX_SKY: 0.50,
  PARALLAX_STARS: 0.52,
  PARALLAX_CLOUDS: 0.54,
  PARALLAX_HORIZON_GLOW: 0.56,
  PARALLAX_FAR_SILHOUETTE: 0.58,
  PARALLAX_MID_SILHOUETTE: 0.62,
  PARALLAX_HORIZON_BLEND: 0.64,
  PARALLAX_FOG: 0.66,
  PARALLAX_ATMOSPHERE: 0.68,

  // ── Tile world (camera-following) ────────────────────────────────────────
  GROUND: 0,
  DECOR: 1,
  TERRAIN_ZONE: 2,
  PARALLAX_VIGNETTE: 3.5,
  TILE_FOG: 4,
  OBJECT: 5,
  BUILDING: 6,
  ENVIRONMENT_FX: 6,
  NPC_GLOW: 7,
  PLAYER_BUBBLE: 8,
  LIGHTING: 9,
  NPC: 9,
  PLAYER: 10,
  MAP_OBJECT: 10,

  // ── World labels & dialogue ──────────────────────────────────────────────
  NPC_NAME: 19,
  NPC_BUBBLE: 20,
  NPC_BUBBLE_TEXT: 21,

  // ── Global overlays (fixed to camera) ────────────────────────────────────
  AMBIENT_OVERLAY: 50,
  HUD: 100,
  DIALOGUE: 200,
  TRANSITION: 9998,
  DEBUG: 9999,
} as const;

export type LayerKey = keyof typeof LAYER;
