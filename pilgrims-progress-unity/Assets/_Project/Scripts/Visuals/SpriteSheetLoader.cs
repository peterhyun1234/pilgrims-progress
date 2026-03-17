using System.Collections.Generic;
using UnityEngine;

namespace PilgrimsProgress.Visuals
{
    public static class SpriteSheetLoader
    {
        private static readonly Dictionary<string, SheetData> _cache = new();

        public enum Direction { Down = 0, Left = 1, Right = 2, Up = 3 }

        public enum AnimRow
        {
            Walk = 0,     // rows 0-3: directional walk/idle (always present)
            Interact = 4, // row 4: interact animation (if sheet is tall enough)
            Emote = 5     // row 5: emote animation
        }

        private const int DirectionCount = 4;

        public class SheetData
        {
            public Sprite[] Sprites;
            public int FramesPerDirection;
            public int TotalRows;
            public int CellWidth;
            public int CellHeight;

            public bool HasRow(AnimRow row) => (int)row < TotalRows;
        }

        public static SheetData Load(string npcId, int spriteSize = 16)
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

            int cols = DetectColumnCount(tex);
            int cellW = tex.width / cols;
            int cellH = cellW;
            int rows = tex.height / cellH;

            var data = new SheetData
            {
                FramesPerDirection = cols,
                TotalRows = rows,
                CellWidth = cellW,
                CellHeight = cellH,
                Sprites = new Sprite[cols * rows]
            };

            for (int row = 0; row < rows; row++)
            {
                for (int col = 0; col < cols; col++)
                {
                    int x = col * cellW;
                    int y = (rows - 1 - row) * cellH;
                    var rect = new Rect(x, y, cellW, cellH);
                    var pivot = new Vector2(0.5f, 0.25f);
                    data.Sprites[row * cols + col] = Sprite.Create(
                        tex, rect, pivot, cellW, 0, SpriteMeshType.FullRect);
                }
            }

            _cache[key] = data;
            return data;
        }

        private static int DetectColumnCount(Texture2D tex)
        {
            float aspect = (float)tex.width / tex.height;
            if (aspect >= 0.9f && aspect <= 1.1f) return 4;  // 4x4 grid
            if (aspect >= 0.7f && aspect <= 0.8f) return 3;  // 3x4 grid
            return tex.width > tex.height ? 4 : 3;
        }

        public static Sprite GetSprite(string npcId, Direction dir, int frame, int spriteSize = 16)
        {
            var data = Load(npcId, spriteSize);
            if (data == null) return null;

            int clampedFrame = Mathf.Clamp(frame, 0, data.FramesPerDirection - 1);
            int idx = (int)dir * data.FramesPerDirection + clampedFrame;
            return idx < data.Sprites.Length ? data.Sprites[idx] : null;
        }

        public static Sprite GetAnimSprite(string npcId, AnimRow animRow, int frame)
        {
            var data = Load(npcId);
            if (data == null || !data.HasRow(animRow)) return null;

            int clampedFrame = Mathf.Clamp(frame, 0, data.FramesPerDirection - 1);
            int idx = (int)animRow * data.FramesPerDirection + clampedFrame;
            return idx < data.Sprites.Length ? data.Sprites[idx] : null;
        }

        public static int GetWalkFrameCount(string npcId)
        {
            var data = Load(npcId);
            return data?.FramesPerDirection ?? 3;
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
