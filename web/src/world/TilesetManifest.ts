/**
 * Per-chapter tileset manifest. Phase 1 ships empty — the loader in
 * `PreloadScene` no-ops when the record is empty. Phase 2 populates Ch1's
 * entry with a real PNG tileset to validate the pipeline; Phase 3 fills in
 * the remaining chapters.
 *
 * Tile dimensions are fixed at 16×16 to match `TILE_SIZE` in `config.ts`.
 */
export interface TilesetEntry {
  /** Phaser texture key the tileset is loaded under. */
  key: string;
  /** PNG path relative to `web/public/`. */
  png: string;
  tileWidth: 16;
  tileHeight: 16;
  /** Ordered names matching the tileset's frame indices (0-based). Optional —
   *  kept for documentation / future autotile rule lookup. */
  tileNames?: string[];
}

export const TILESET_MANIFEST: Record<number, TilesetEntry> = {
  // Phase 2 will add chapter 1 here:
  // 1: { key: 'tiles_ch1', png: 'assets/tilesets/ch01.png', tileWidth: 16, tileHeight: 16 },
};
