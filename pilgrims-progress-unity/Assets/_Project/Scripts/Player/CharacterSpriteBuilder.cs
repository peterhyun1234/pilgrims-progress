using UnityEngine;

namespace PilgrimsProgress.Player
{
    public static class CharacterSpriteBuilder
    {
        private const int S = 16;

        private struct Palette
        {
            public Color Skin, SkinSh, SkinHi;
            public Color Hair, HairDk;
            public Color Outfit, OutfitDk, OutfitHi, Belt;
            public Color Boot, BootHi;
            public Color EyeW, EyeP;
            public Color Burden, BurdenDk;
            public HairPreset HairStyle;
        }

        public static Sprite Build(PlayerCustomization data, CustomizationPresets presets, bool showBurden = true)
        {
            if (presets == null) return null;
            data.ClampIndices(presets.SkinTones.Length, presets.HairStyles.Length,
                presets.HairColors.Length, presets.OutfitColors.Length);

            var p = MakePalette(data, presets);
            var px = new Color[S * S];
            DrawDown(px, p, 0, showBurden);

            var tex = new Texture2D(S, S);
            tex.SetPixels(px);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, S, S), new Vector2(0.5f, 0.25f), S);
        }

        public static Sprite BuildPreview(PlayerCustomization data, CustomizationPresets presets)
            => Build(data, presets, showBurden: true);

        public static Sprite BuildWithoutBurden(PlayerCustomization data, CustomizationPresets presets)
            => Build(data, presets, showBurden: false);

        public static Texture2D BuildSpriteSheet(PlayerCustomization data, CustomizationPresets presets,
            bool showBurden = true)
        {
            if (presets == null) return null;
            data.ClampIndices(presets.SkinTones.Length, presets.HairStyles.Length,
                presets.HairColors.Length, presets.OutfitColors.Length);

            const int cols = 3, rows = 4;
            int w = cols * S, h = rows * S;
            var p = MakePalette(data, presets);
            var all = new Color[w * h];

            for (int row = 0; row < rows; row++)
            {
                for (int col = 0; col < cols; col++)
                {
                    var cell = new Color[S * S];
                    switch (row)
                    {
                        case 0: DrawDown(cell, p, col, showBurden); break;
                        case 1: DrawSide(cell, p, col, showBurden, false); break;
                        case 2: DrawSide(cell, p, col, showBurden, true); break;
                        case 3: DrawUp(cell, p, col, showBurden); break;
                    }

                    int bx = col * S;
                    int by = (rows - 1 - row) * S;
                    for (int y = 0; y < S; y++)
                        for (int x = 0; x < S; x++)
                        {
                            var c = cell[y * S + x];
                            if (c.a > 0) all[(by + y) * w + bx + x] = c;
                        }
                }
            }

            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            tex.SetPixels(all);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return tex;
        }

        #region Down (front-facing)

        private static void DrawDown(Color[] px, Palette p, int frame, bool showBurden)
        {
            int legOff = frame == 1 ? -1 : frame == 2 ? 1 : 0;

            // Boots
            int lbx = 5 + (legOff < 0 ? legOff : 0);
            int rbx = 9 + (legOff > 0 ? legOff : 0);
            FillRect(px, lbx, 0, 2, 2, p.Boot);
            P(px, lbx, 1, p.BootHi);
            FillRect(px, rbx, 0, 2, 2, p.Boot);
            P(px, rbx, 1, p.BootHi);

            // Lower legs
            FillRect(px, 5 + (legOff < 0 ? legOff : 0), 2, 2, 2, p.OutfitDk);
            FillRect(px, 9 + (legOff > 0 ? legOff : 0), 2, 2, 2, p.OutfitDk);

            // Upper legs / crotch
            FillRect(px, 6, 4, 4, 1, p.OutfitDk);

            // Body (y 5-9)
            for (int y = 5; y <= 9; y++)
                for (int x = 4; x <= 11; x++)
                {
                    Color c = p.Outfit;
                    if (x == 4 || x == 11) c = p.OutfitDk;
                    if (y == 9) c = (x >= 6 && x <= 9) ? p.OutfitHi : p.Outfit;
                    P(px, x, y, c);
                }

            // Belt
            for (int x = 5; x <= 10; x++) P(px, x, 5, p.Belt);
            P(px, 7, 5, Lit(p.Belt, 1.3f));

            // Collar / neckline
            P(px, 6, 9, p.Skin); P(px, 7, 9, p.Skin);
            P(px, 8, 9, p.Skin); P(px, 9, 9, p.Skin);

            // Arms
            for (int y = 6; y <= 8; y++) { P(px, 3, y, p.Skin); P(px, 12, y, p.Skin); }
            P(px, 3, 6, p.SkinSh); P(px, 12, 6, p.SkinSh);
            P(px, 3, 5, p.SkinHi); P(px, 12, 5, p.SkinHi);

            // Neck
            P(px, 6, 10, p.Skin); P(px, 7, 10, p.SkinSh);
            P(px, 8, 10, p.SkinSh); P(px, 9, 10, p.Skin);

            // Head
            for (int y = 11; y <= 14; y++)
                for (int x = 5; x <= 10; x++)
                {
                    Color c = p.Skin;
                    if (x == 5 || x == 10) c = p.SkinSh;
                    if (y == 14) c = (x >= 6 && x <= 9) ? p.SkinHi : p.SkinSh;
                    P(px, x, y, c);
                }

            // Eyes
            P(px, 6, 12, p.EyeW); P(px, 7, 12, p.EyeP);
            P(px, 8, 12, p.EyeP); P(px, 9, 12, p.EyeW);

            // Eyebrows
            P(px, 6, 13, p.HairDk); P(px, 7, 13, p.HairDk);
            P(px, 8, 13, p.HairDk); P(px, 9, 13, p.HairDk);

            // Nose highlight
            P(px, 7, 13, p.SkinHi);

            // Mouth
            P(px, 7, 11, p.SkinSh); P(px, 8, 11, p.SkinSh);

            // Ears
            P(px, 4, 12, p.SkinSh); P(px, 11, 12, p.SkinSh);

            // Hair
            DrawHairDown(px, p);

            // Burden
            if (showBurden) DrawBurdenBack(px, p);
        }

        private static void DrawHairDown(Color[] px, Palette p)
        {
            int topH = Mathf.Clamp(p.HairStyle.TopHeight, 1, 5);
            int sideW = Mathf.Clamp(p.HairStyle.SideWidth, 0, 3);

            for (int dy = 0; dy < topH; dy++)
            {
                int y = 15 - dy;
                if (y < 0) continue;
                int xMin = Mathf.Max(5 - (dy > 0 ? 1 : 0), 3);
                int xMax = Mathf.Min(10 + (dy > 0 ? 1 : 0), 12);
                for (int x = xMin; x <= xMax; x++)
                    P(px, x, y, (dy == 0 || x == xMin || x == xMax) ? p.HairDk : p.Hair);
            }

            if (sideW > 0)
                for (int y = 11; y <= 14; y++)
                    for (int sw = 1; sw <= sideW; sw++)
                    {
                        int lx = 5 - sw, rx = 10 + sw;
                        if (lx >= 0) P(px, lx, y, sw == sideW ? p.HairDk : p.Hair);
                        if (rx < S) P(px, rx, y, sw == sideW ? p.HairDk : p.Hair);
                    }

            if (p.HairStyle.HasBangs)
            {
                P(px, 6, 14, p.Hair); P(px, 7, 14, p.HairDk);
                P(px, 8, 14, p.Hair); P(px, 9, 14, p.HairDk);
            }

            if (sideW >= 2)
                for (int y = 8; y <= 10; y++)
                {
                    if (5 - sideW >= 0) P(px, 5 - sideW, y, p.HairDk);
                    if (10 + sideW < S) P(px, 10 + sideW, y, p.HairDk);
                }
        }

        #endregion

        #region Up (back-facing)

        private static void DrawUp(Color[] px, Palette p, int frame, bool showBurden)
        {
            int legOff = frame == 1 ? -1 : frame == 2 ? 1 : 0;

            // Boots
            FillRect(px, 5 + (legOff < 0 ? legOff : 0), 0, 2, 2, p.Boot);
            FillRect(px, 9 + (legOff > 0 ? legOff : 0), 0, 2, 2, p.Boot);

            // Legs
            FillRect(px, 5 + (legOff < 0 ? legOff : 0), 2, 2, 2, p.OutfitDk);
            FillRect(px, 9 + (legOff > 0 ? legOff : 0), 2, 2, 2, p.OutfitDk);
            FillRect(px, 6, 4, 4, 1, p.OutfitDk);

            // Body
            for (int y = 5; y <= 9; y++)
                for (int x = 4; x <= 11; x++)
                {
                    Color c = p.Outfit;
                    if (x == 4 || x == 11) c = p.OutfitDk;
                    P(px, x, y, c);
                }

            // Belt
            for (int x = 5; x <= 10; x++) P(px, x, 5, p.Belt);

            // Arms (from behind - same positions)
            for (int y = 6; y <= 8; y++) { P(px, 3, y, p.Skin); P(px, 12, y, p.Skin); }
            P(px, 3, 5, p.SkinSh); P(px, 12, 5, p.SkinSh);

            // Neck (from behind)
            P(px, 6, 10, p.SkinSh); P(px, 7, 10, p.SkinSh);
            P(px, 8, 10, p.SkinSh); P(px, 9, 10, p.SkinSh);

            // Head (back of head = mostly skin shadow)
            for (int y = 11; y <= 14; y++)
                for (int x = 5; x <= 10; x++)
                    P(px, x, y, (x == 5 || x == 10) ? p.SkinSh : p.Skin);

            // Ears (from behind)
            P(px, 4, 12, p.SkinSh); P(px, 11, 12, p.SkinSh);

            // Hair (covers most of the back of head)
            DrawHairUp(px, p);

            // Burden (very visible from behind)
            if (showBurden) DrawBurdenBack(px, p);
        }

        private static void DrawHairUp(Color[] px, Palette p)
        {
            int topH = Mathf.Clamp(p.HairStyle.TopHeight, 1, 5);
            int sideW = Mathf.Clamp(p.HairStyle.SideWidth, 0, 3);

            // Top hair
            for (int dy = 0; dy < topH; dy++)
            {
                int y = 15 - dy;
                if (y < 0) continue;
                int xMin = Mathf.Max(5 - (dy > 0 ? 1 : 0), 3);
                int xMax = Mathf.Min(10 + (dy > 0 ? 1 : 0), 12);
                for (int x = xMin; x <= xMax; x++)
                    P(px, x, y, (dy == 0 || x == xMin || x == xMax) ? p.HairDk : p.Hair);
            }

            // Back of head is heavily covered by hair
            for (int y = 12; y <= 14; y++)
                for (int x = 5; x <= 10; x++)
                    P(px, x, y, (x == 5 || x == 10 || y == 12) ? p.HairDk : p.Hair);

            // Side hair
            if (sideW > 0)
                for (int y = 11; y <= 14; y++)
                    for (int sw = 1; sw <= sideW; sw++)
                    {
                        int lx = 5 - sw, rx = 10 + sw;
                        if (lx >= 0) P(px, lx, y, sw == sideW ? p.HairDk : p.Hair);
                        if (rx < S) P(px, rx, y, sw == sideW ? p.HairDk : p.Hair);
                    }

            // Long hair goes below head
            if (sideW >= 2)
                for (int y = 7; y <= 10; y++)
                {
                    if (5 - sideW >= 0) P(px, 5 - sideW, y, p.HairDk);
                    if (10 + sideW < S) P(px, 10 + sideW, y, p.HairDk);
                    if (sideW >= 3)
                    {
                        P(px, 5, y, p.Hair);
                        P(px, 10, y, p.Hair);
                    }
                }
        }

        #endregion

        #region Side (left / right)

        private static void DrawSide(Color[] px, Palette p, int frame, bool showBurden, bool flipRight)
        {
            int legOff = frame == 1 ? -1 : frame == 2 ? 1 : 0;

            int cx = 7;
            int bw = 3;
            int bLeft = cx - 1, bRight = cx + bw;

            // Boots (from side = 2px wide)
            int bootY0 = 0;
            int frontFoot = flipRight ? cx + 1 : cx - 1;
            int backFoot = flipRight ? cx : cx + 1;
            int ff = frontFoot + (legOff < 0 ? -1 : 0);
            int bf = backFoot + (legOff > 0 ? 1 : 0);
            FillRect(px, ff, bootY0, 2, 2, p.Boot);
            P(px, ff, 1, p.BootHi);
            FillRect(px, bf, bootY0, 2, 2, p.Boot);

            // Legs from side
            FillRect(px, ff, 2, 2, 2, p.OutfitDk);
            FillRect(px, bf, 2, 2, 2, p.OutfitDk);
            FillRect(px, cx, 4, 3, 1, p.OutfitDk);

            // Body (narrower from side)
            for (int y = 5; y <= 9; y++)
                for (int x = bLeft; x <= bRight; x++)
                {
                    Color c = p.Outfit;
                    if (x == bLeft || x == bRight) c = p.OutfitDk;
                    P(px, x, y, c);
                }

            // Belt
            for (int x = bLeft; x <= bRight; x++) P(px, x, 5, p.Belt);

            // Arm (trailing side)
            int armX = flipRight ? bRight + 1 : bLeft - 1;
            for (int y = 6; y <= 8; y++) P(px, armX, y, p.Skin);
            P(px, armX, 5, p.SkinHi);

            // Neck
            P(px, cx, 10, p.SkinSh); P(px, cx + 1, 10, p.Skin);

            // Head (profile, 5px wide × 4px tall)
            int headL = flipRight ? cx - 1 : cx - 2;
            int headR = flipRight ? cx + 3 : cx + 2;
            for (int y = 11; y <= 14; y++)
                for (int x = headL; x <= headR; x++)
                    P(px, x, y, (x == headL || x == headR) ? p.SkinSh : p.Skin);

            // Eye (single, profile)
            int eyeX = flipRight ? headR - 1 : headL + 1;
            P(px, eyeX, 12, p.EyeW);
            P(px, flipRight ? eyeX + 1 : eyeX - 1, 12, p.EyeP);

            // Mouth (profile)
            int mouthX = flipRight ? headR - 1 : headL + 1;
            P(px, mouthX, 11, p.SkinSh);

            // Ear
            int earX = flipRight ? headL : headR;
            P(px, earX, 12, p.SkinSh);

            // Hair (side view)
            DrawHairSide(px, p, headL, headR, flipRight);

            // Burden visible from side
            if (showBurden)
            {
                int burdX = flipRight ? headL - 1 : headR + 1;
                for (int y = 11; y <= 14; y++)
                {
                    P(px, burdX, y, p.BurdenDk);
                    if (!flipRight && burdX + 1 < S) P(px, burdX + 1, y, p.Burden);
                    if (flipRight && burdX - 1 >= 0) P(px, burdX - 1, y, p.Burden);
                }
                P(px, burdX, 15, p.BurdenDk);
            }
        }

        private static void DrawHairSide(Color[] px, Palette p, int headL, int headR, bool flipR)
        {
            int topH = Mathf.Clamp(p.HairStyle.TopHeight, 1, 5);
            int sideW = Mathf.Clamp(p.HairStyle.SideWidth, 0, 3);

            // Top hair
            for (int dy = 0; dy < topH; dy++)
            {
                int y = 15 - dy;
                if (y < 0) continue;
                int xL = headL - (dy > 0 ? 1 : 0);
                int xR = headR + (dy > 0 ? 1 : 0);
                xL = Mathf.Max(xL, 0);
                xR = Mathf.Min(xR, S - 1);
                for (int x = xL; x <= xR; x++)
                    P(px, x, y, (x == xL || x == xR || dy == 0) ? p.HairDk : p.Hair);
            }

            // Back hair (visible from side = trails behind head)
            int backX = flipR ? headL : headR;
            for (int y = 12; y <= 14; y++)
                P(px, backX, y, p.Hair);

            // Long hair extension downward
            if (sideW >= 2)
            {
                int trailX = flipR ? headL - 1 : headR + 1;
                if (trailX >= 0 && trailX < S)
                    for (int y = 9; y <= 13; y++)
                        P(px, trailX, y, p.HairDk);
            }

            // Bangs
            if (p.HairStyle.HasBangs)
            {
                int bangX = flipR ? headR : headL;
                P(px, bangX, 14, p.Hair);
                P(px, bangX, 13, p.HairDk);
            }
        }

        #endregion

        #region Burden

        private static void DrawBurdenBack(Color[] px, Palette p)
        {
            for (int y = 11; y <= 14; y++)
                for (int x = 11; x <= 13; x++)
                {
                    if (x == 11 && y == 11) continue;
                    if (x == 13 && y == 14) continue;
                    P(px, x, y, (x == 11 || y == 11) ? p.BurdenDk : p.Burden);
                }
            P(px, 12, 15, p.BurdenDk);
        }

        #endregion

        #region Palette + Helpers

        private static Palette MakePalette(PlayerCustomization data, CustomizationPresets presets)
        {
            Color skin = presets.SkinTones[data.SkinToneIndex];
            Color hair = presets.HairColors[data.HairColorIndex];
            Color outfit = presets.OutfitColors[data.OutfitColorIndex];
            return new Palette
            {
                Skin = skin,
                SkinSh = Dk(skin, 0.78f),
                SkinHi = Lit(skin, 1.12f),
                Hair = hair,
                HairDk = Dk(hair, 0.70f),
                Outfit = outfit,
                OutfitDk = Dk(outfit, 0.70f),
                OutfitHi = Lit(outfit, 1.15f),
                Belt = Dk(outfit, 0.55f),
                Boot = new Color(0.30f, 0.22f, 0.15f),
                BootHi = new Color(0.40f, 0.30f, 0.20f),
                EyeW = new Color(0.95f, 0.95f, 0.95f),
                EyeP = new Color(0.12f, 0.10f, 0.08f),
                Burden = new Color(0.45f, 0.32f, 0.18f),
                BurdenDk = new Color(0.35f, 0.24f, 0.12f),
                HairStyle = presets.HairStyles[data.HairStyleIndex],
            };
        }

        private static void P(Color[] px, int x, int y, Color c)
        {
            if (x >= 0 && x < S && y >= 0 && y < S) px[y * S + x] = c;
        }

        private static void FillRect(Color[] px, int x0, int y0, int w, int h, Color c)
        {
            for (int dy = 0; dy < h; dy++)
                for (int dx = 0; dx < w; dx++)
                    P(px, x0 + dx, y0 + dy, c);
        }

        private static Color Dk(Color c, float f)
            => new Color(c.r * f, c.g * f, c.b * f, 1f);

        private static Color Lit(Color c, float f)
            => new Color(Mathf.Clamp01(c.r * f), Mathf.Clamp01(c.g * f), Mathf.Clamp01(c.b * f), 1f);

        #endregion
    }

    public enum SpriteLayer { Body, Outfit, Hair, Burden }
}
