using System.Collections.Generic;
using UnityEngine;

namespace PilgrimsProgress.Visuals
{
    public static class SpriteSheetLoader
    {
        private static readonly Dictionary<string, Sprite[]> _cache = new Dictionary<string, Sprite[]>();

        public enum Direction { Down = 0, Left = 1, Right = 2, Up = 3 }

        private const int FramesPerDirection = 3;
        private const int DirectionCount = 4;

        /// <summary>
        /// Load a sprite sheet from Resources/Sprites/{npcId}_spritesheet.
        /// Layout: 3 columns (idle, walk1, walk2) × 4 rows (down, left, right, up).
        /// Returns null if not found, falling back to procedural generation.
        /// </summary>
        public static Sprite[] Load(string npcId, int spriteSize = 16)
        {
            string key = npcId.ToLower();
            if (_cache.TryGetValue(key, out var cached))
                return cached;

            var tex = Resources.Load<Texture2D>($"Sprites/{key}_spritesheet");
            if (tex == null)
            {
                _cache[key] = null;
                return null;
            }

            int cols = FramesPerDirection;
            int rows = DirectionCount;
            int cellW = tex.width / cols;
            int cellH = tex.height / rows;

            var sprites = new Sprite[cols * rows];
            for (int row = 0; row < rows; row++)
            {
                for (int col = 0; col < cols; col++)
                {
                    int x = col * cellW;
                    int y = (rows - 1 - row) * cellH; // Unity textures are bottom-up
                    var rect = new Rect(x, y, cellW, cellH);
                    var pivot = new Vector2(0.5f, 0.25f);
                    sprites[row * cols + col] = Sprite.Create(
                        tex, rect, pivot, cellW, 0, SpriteMeshType.FullRect);
                }
            }

            _cache[key] = sprites;
            return sprites;
        }

        public static Sprite GetSprite(string npcId, Direction dir, int frame, int spriteSize = 16)
        {
            var sprites = Load(npcId, spriteSize);
            if (sprites == null) return null;

            int idx = (int)dir * FramesPerDirection + Mathf.Clamp(frame, 0, FramesPerDirection - 1);
            return idx < sprites.Length ? sprites[idx] : null;
        }

        public static Sprite GetIdleSprite(string npcId, int spriteSize = 16)
        {
            return GetSprite(npcId, Direction.Down, 0, spriteSize);
        }

        public static void ClearCache()
        {
            _cache.Clear();
        }
    }
}
