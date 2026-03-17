using UnityEngine;
using UnityEngine.Tilemaps;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.Visuals
{
    /// <summary>
    /// Generates all game textures procedurally at runtime.
    /// No external image files needed.
    /// </summary>
    public static class ProceduralAssets
    {
        #region Main Menu Background

        public static Texture2D CreateMenuBackground(int w = 480, int h = 270)
        {
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            var rng = new System.Random(42);

            for (int y = 0; y < h; y++)
            {
                float t = (float)y / h;
                for (int x = 0; x < w; x++)
                {
                    float u = (float)x / w;
                    Color c = DrawMenuPixel(u, t, w, h, rng);
                    tex.SetPixel(x, y, c);
                }
            }

            tex.Apply();
            tex.filterMode = FilterMode.Bilinear;
            tex.wrapMode = TextureWrapMode.Clamp;
            return tex;
        }

        private static Color DrawMenuPixel(float u, float t, int w, int h, System.Random rng)
        {
            // Sky gradient
            var skyTop = new Color(0.02f, 0.01f, 0.06f);
            var skyMid = new Color(0.06f, 0.04f, 0.14f);
            var skyHorizon = new Color(0.12f, 0.06f, 0.10f);
            Color sky;
            if (t > 0.6f)
                sky = Color.Lerp(skyMid, skyTop, (t - 0.6f) / 0.4f);
            else if (t > 0.3f)
                sky = Color.Lerp(skyHorizon, skyMid, (t - 0.3f) / 0.3f);
            else
                sky = skyHorizon;

            // Stars
            int starSeed = (int)(u * 1000) * 7919 + (int)(t * 1000) * 6271;
            if (t > 0.45f && (starSeed % 397 == 0))
            {
                float brightness = 0.4f + (starSeed % 100) / 160f;
                sky = Color.Lerp(sky, new Color(0.9f, 0.85f, 0.7f), brightness);
            }

            // Golden glow from celestial city (upper right area)
            float glowDx = u - 0.78f;
            float glowDy = t - 0.62f;
            float glowDist = Mathf.Sqrt(glowDx * glowDx + glowDy * glowDy);
            float glowIntensity = Mathf.Max(0, 1f - glowDist * 3.5f) * 0.25f;
            var goldenGlow = new Color(0.95f, 0.80f, 0.40f);
            sky = Color.Lerp(sky, goldenGlow, glowIntensity);

            // Light rays from celestial city
            float angle = Mathf.Atan2(t - 0.62f, u - 0.78f);
            float rayPattern = Mathf.Sin(angle * 8f) * 0.5f + 0.5f;
            float rayStrength = Mathf.Max(0, 1f - glowDist * 2.5f) * rayPattern * 0.08f;
            sky = Color.Lerp(sky, goldenGlow, rayStrength);

            // Far mountains (silhouette)
            float farMtnHeight = 0.42f
                + Mathf.Sin(u * 6f) * 0.06f
                + Mathf.Sin(u * 11f + 2f) * 0.03f
                + Mathf.Sin(u * 23f) * 0.015f;
            if (t < farMtnHeight)
            {
                var farMtnColor = new Color(0.05f, 0.04f, 0.09f);
                sky = Color.Lerp(sky, farMtnColor, 0.7f);
            }

            // Mid mountains
            float midMtnHeight = 0.35f
                + Mathf.Sin(u * 4f + 1f) * 0.08f
                + Mathf.Sin(u * 9f + 3f) * 0.04f
                + Mathf.Sin(u * 17f) * 0.02f;
            if (t < midMtnHeight)
            {
                var midMtnColor = new Color(0.04f, 0.035f, 0.07f);
                sky = Color.Lerp(sky, midMtnColor, 0.85f);
            }

            // Hills
            float hillHeight = 0.26f
                + Mathf.Sin(u * 3f + 0.5f) * 0.06f
                + Mathf.Sin(u * 7f + 2f) * 0.03f;
            if (t < hillHeight)
            {
                var hillColor = new Color(0.035f, 0.05f, 0.03f);
                float hillBlend = Mathf.Clamp01((hillHeight - t) * 15f);
                sky = Color.Lerp(sky, hillColor, hillBlend);
            }

            // Celestial city silhouette (golden buildings on distant hill)
            float cityX = u - 0.78f;
            if (Mathf.Abs(cityX) < 0.10f && t > 0.48f && t < 0.65f)
            {
                float cityBase = 0.50f + Mathf.Sin(u * 50f) * 0.01f;
                int towerSeed = (int)((u - 0.68f) * 200f);
                float towerH = (towerSeed % 5 == 0) ? 0.04f + (towerSeed % 7) * 0.008f : 0f;
                float buildingH = 0.02f + Mathf.Abs(Mathf.Sin(u * 80f)) * 0.025f;

                if (t > cityBase && t < cityBase + buildingH + towerH)
                {
                    float glow = 0.6f + Mathf.Sin(u * 60f + t * 40f) * 0.15f;
                    sky = Color.Lerp(sky, new Color(0.95f, 0.82f, 0.45f), glow * 0.7f);
                }
            }

            // Winding path in foreground
            float pathCenter = 0.5f + Mathf.Sin(t * 8f + 1f) * 0.12f;
            float pathWidth = 0.04f + (0.25f - t) * 0.15f;
            float pathDist = Mathf.Abs(u - pathCenter);
            if (t < 0.22f && pathDist < pathWidth)
            {
                float pathBlend = 1f - pathDist / pathWidth;
                var pathColor = new Color(0.12f, 0.10f, 0.07f);
                sky = Color.Lerp(sky, pathColor, pathBlend * 0.6f);
            }

            // Ground (bottom area)
            if (t < 0.18f)
            {
                var groundColor = new Color(0.03f, 0.04f, 0.025f);
                float groundBlend = 1f - t / 0.18f;
                sky = Color.Lerp(sky, groundColor, groundBlend * 0.9f);
            }

            sky.a = 1f;
            return sky;
        }

        #endregion

        #region Tile Textures

        public static Tile CreateGrassTile(int variant = 0, MapTheme theme = MapTheme.Fields)
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var rng = new System.Random(100 + variant + (int)theme * 37);

            Color baseColor, darkColor, lightColor, accentColor;
            GetGrassPalette(theme, out baseColor, out darkColor, out lightColor, out accentColor);

            for (int y = 0; y < s; y++)
            {
                for (int x = 0; x < s; x++)
                {
                    float perlin = Mathf.PerlinNoise((x + variant * 16) * 0.4f, (y + variant * 16) * 0.4f);
                    Color c = Color.Lerp(darkColor, baseColor, perlin);

                    float dither = ((x + y) % 2 == 0) ? 0.02f : -0.02f;
                    c.r += dither; c.g += dither; c.b += dither;

                    float noise = (rng.Next(100) - 50) / 1200f;
                    c.r += noise; c.g += noise * 1.3f; c.b += noise * 0.6f;

                    // Grass blades
                    if (rng.Next(100) < 12)
                    {
                        int bladeH = rng.Next(2, 4);
                        if (y < bladeH + 2)
                            c = Color.Lerp(c, lightColor, 0.5f);
                    }

                    // Grass tufts
                    if (rng.Next(100) < 5)
                        c = Color.Lerp(c, lightColor, 0.35f);

                    // Scattered detail
                    if (variant == 0 && rng.Next(100) < 3)
                        c = Color.Lerp(c, accentColor, 0.5f);
                    if (variant == 2 && rng.Next(100) < 4)
                    {
                        Color pebble = new Color(0.45f, 0.40f, 0.35f);
                        c = Color.Lerp(c, pebble, 0.4f);
                    }

                    // Shadow at edges for depth
                    if (x == 0 || y == 0)
                        c *= 0.92f;
                    if (x == s - 1 || y == s - 1)
                        c = Color.Lerp(c, lightColor, 0.08f);

                    c.a = 1f;
                    tex.SetPixel(x, y, c);
                }
            }
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return MakeTile(tex);
        }

        private static void GetGrassPalette(MapTheme theme,
            out Color baseCol, out Color darkCol, out Color lightCol, out Color accentCol)
        {
            switch (theme)
            {
                case MapTheme.DarkValley:
                    baseCol = new Color(0.18f, 0.28f, 0.16f);
                    darkCol = new Color(0.12f, 0.20f, 0.12f);
                    lightCol = new Color(0.22f, 0.35f, 0.20f);
                    accentCol = new Color(0.30f, 0.25f, 0.35f);
                    break;
                case MapTheme.Celestial:
                    baseCol = new Color(0.38f, 0.58f, 0.35f);
                    darkCol = new Color(0.30f, 0.48f, 0.28f);
                    lightCol = new Color(0.50f, 0.70f, 0.45f);
                    accentCol = new Color(0.90f, 0.85f, 0.55f);
                    break;
                case MapTheme.Hill:
                    baseCol = new Color(0.35f, 0.50f, 0.30f);
                    darkCol = new Color(0.28f, 0.42f, 0.24f);
                    lightCol = new Color(0.42f, 0.62f, 0.35f);
                    accentCol = new Color(0.80f, 0.65f, 0.85f);
                    break;
                case MapTheme.Castle:
                    baseCol = new Color(0.28f, 0.42f, 0.25f);
                    darkCol = new Color(0.22f, 0.34f, 0.20f);
                    lightCol = new Color(0.35f, 0.52f, 0.30f);
                    accentCol = new Color(0.60f, 0.55f, 0.45f);
                    break;
                default:
                    baseCol = new Color(0.32f, 0.52f, 0.28f);
                    darkCol = new Color(0.25f, 0.42f, 0.22f);
                    lightCol = new Color(0.40f, 0.62f, 0.34f);
                    accentCol = new Color(0.85f, 0.78f, 0.35f);
                    break;
            }
        }

        public static Tile CreatePathTile(MapTheme theme = MapTheme.Fields)
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var rng = new System.Random(200 + (int)theme * 23);

            Color baseColor, darkColor, lightColor;
            GetPathPalette(theme, out baseColor, out darkColor, out lightColor);

            for (int y = 0; y < s; y++)
            {
                for (int x = 0; x < s; x++)
                {
                    float perlin = Mathf.PerlinNoise(x * 0.5f, y * 0.5f);
                    Color c = Color.Lerp(baseColor, darkColor, perlin * 0.3f);

                    float noise = (rng.Next(100) - 50) / 800f;
                    c.r += noise; c.g += noise * 0.8f; c.b += noise * 0.5f;

                    // Pebbles with highlight
                    int pHash = (x * 7 + y * 13) % 97;
                    if (pHash < 6)
                    {
                        Color pebble = Color.Lerp(darkColor, lightColor, rng.Next(100) / 100f);
                        c = Color.Lerp(c, pebble, 0.5f);
                        if (pHash < 3 && x < s - 1 && y > 0)
                            tex.SetPixel(x + 1, y - 1, Color.Lerp(c, lightColor, 0.2f));
                    }

                    // Dither
                    if ((x + y) % 2 == 0)
                        c = Color.Lerp(c, darkColor, 0.04f);

                    // Edge worn marks
                    if (y <= 1 || y >= s - 2)
                        c = Color.Lerp(c, new Color(0.32f, 0.50f, 0.28f), 0.15f);

                    c.a = 1f;
                    tex.SetPixel(x, y, c);
                }
            }
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return MakeTile(tex);
        }

        private static void GetPathPalette(MapTheme theme,
            out Color baseCol, out Color darkCol, out Color lightCol)
        {
            switch (theme)
            {
                case MapTheme.DarkValley:
                    baseCol = new Color(0.35f, 0.30f, 0.25f);
                    darkCol = new Color(0.25f, 0.22f, 0.18f);
                    lightCol = new Color(0.42f, 0.38f, 0.32f);
                    break;
                case MapTheme.Interior:
                    baseCol = new Color(0.48f, 0.40f, 0.32f);
                    darkCol = new Color(0.38f, 0.32f, 0.26f);
                    lightCol = new Color(0.55f, 0.48f, 0.38f);
                    break;
                case MapTheme.Celestial:
                    baseCol = new Color(0.70f, 0.62f, 0.48f);
                    darkCol = new Color(0.58f, 0.52f, 0.40f);
                    lightCol = new Color(0.80f, 0.72f, 0.55f);
                    break;
                default:
                    baseCol = new Color(0.58f, 0.48f, 0.35f);
                    darkCol = new Color(0.45f, 0.38f, 0.28f);
                    lightCol = new Color(0.68f, 0.58f, 0.42f);
                    break;
            }
        }

        public static Tile CreateWallTile(MapTheme theme = MapTheme.City)
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var rng = new System.Random(300 + (int)theme * 19);

            Color stoneBase, mortarColor, highlight;
            GetWallPalette(theme, out stoneBase, out mortarColor, out highlight);

            for (int y = 0; y < s; y++)
            {
                for (int x = 0; x < s; x++)
                {
                    int row = y / 4;
                    int offset = (row % 2 == 0) ? 0 : 4;
                    bool isMortarH = (y % 4 == 0);
                    bool isMortarV = ((x + offset) % 8 == 0);
                    bool isMortar = isMortarH || isMortarV;

                    Color c;
                    if (isMortar)
                    {
                        c = mortarColor;
                        float mortarNoise = (rng.Next(60) - 30) / 1000f;
                        c.r += mortarNoise; c.g += mortarNoise; c.b += mortarNoise;
                    }
                    else
                    {
                        int brickSeed = row * 7 + ((x + offset) / 8) * 13;
                        float brickVar = (brickSeed % 5) / 80f;
                        c = new Color(stoneBase.r + brickVar, stoneBase.g + brickVar * 0.8f, stoneBase.b + brickVar * 0.6f);

                        float noise = (rng.Next(80) - 40) / 1000f;
                        c.r += noise; c.g += noise; c.b += noise;

                        // Highlight on top edge of each brick
                        if (y % 4 == 3)
                            c = Color.Lerp(c, highlight, 0.15f);
                        // Shadow on bottom edge
                        if (y % 4 == 1)
                            c *= 0.92f;

                        // Crack details
                        if (rng.Next(200) < 2)
                            c = Color.Lerp(c, mortarColor, 0.6f);
                    }

                    c.a = 1f;
                    tex.SetPixel(x, y, c);
                }
            }
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return MakeTile(tex);
        }

        private static void GetWallPalette(MapTheme theme,
            out Color stone, out Color mortar, out Color highlight)
        {
            switch (theme)
            {
                case MapTheme.Castle:
                    stone = new Color(0.42f, 0.40f, 0.38f);
                    mortar = new Color(0.30f, 0.28f, 0.26f);
                    highlight = new Color(0.55f, 0.52f, 0.48f);
                    break;
                case MapTheme.DarkValley:
                    stone = new Color(0.25f, 0.22f, 0.20f);
                    mortar = new Color(0.15f, 0.13f, 0.12f);
                    highlight = new Color(0.32f, 0.28f, 0.25f);
                    break;
                case MapTheme.Celestial:
                    stone = new Color(0.70f, 0.68f, 0.62f);
                    mortar = new Color(0.55f, 0.52f, 0.48f);
                    highlight = new Color(0.82f, 0.78f, 0.70f);
                    break;
                default:
                    stone = new Color(0.40f, 0.36f, 0.32f);
                    mortar = new Color(0.28f, 0.25f, 0.22f);
                    highlight = new Color(0.50f, 0.46f, 0.40f);
                    break;
            }
        }

        public static Tile CreateWaterTile(int frame = 0)
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var rng = new System.Random(400 + frame);
            var deepColor = new Color(0.10f, 0.20f, 0.42f);
            var midColor = new Color(0.18f, 0.32f, 0.52f);
            var lightColor = new Color(0.28f, 0.42f, 0.62f);
            var foamColor = new Color(0.50f, 0.62f, 0.78f);

            for (int y = 0; y < s; y++)
            {
                for (int x = 0; x < s; x++)
                {
                    float wave1 = Mathf.Sin((x + frame * 2) * 0.6f + y * 0.35f) * 0.5f + 0.5f;
                    float wave2 = Mathf.Sin((x - frame) * 0.9f + y * 0.55f + 2f) * 0.5f + 0.5f;
                    float combined = wave1 * 0.6f + wave2 * 0.4f;

                    Color c;
                    if (combined < 0.3f) c = deepColor;
                    else if (combined < 0.6f) c = Color.Lerp(deepColor, midColor, (combined - 0.3f) / 0.3f);
                    else c = Color.Lerp(midColor, lightColor, (combined - 0.6f) / 0.4f);

                    // Foam/sparkles on wave peaks
                    if (combined > 0.82f)
                        c = Color.Lerp(c, foamColor, (combined - 0.82f) / 0.18f * 0.5f);

                    // Dither
                    float dither = ((x + y) % 2 == 0) ? 0.015f : -0.015f;
                    c.r += dither * 0.5f; c.g += dither * 0.7f; c.b += dither;

                    float noise = (rng.Next(60) - 30) / 1500f;
                    c.r += noise; c.g += noise; c.b += noise;

                    // Bright sparkle
                    if (rng.Next(100) < 2)
                        c = Color.Lerp(c, new Color(0.65f, 0.75f, 0.90f), 0.4f);

                    c.a = 1f;
                    tex.SetPixel(x, y, c);
                }
            }
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return MakeTile(tex);
        }

        public static Tile CreateFlowerTile(Color flowerColor, MapTheme theme = MapTheme.Fields)
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var rng = new System.Random(500 + flowerColor.GetHashCode());

            Color grassBase, grassDark, grassLight, accent;
            GetGrassPalette(theme, out grassBase, out grassDark, out grassLight, out accent);

            Color flowerDark = flowerColor * 0.7f; flowerDark.a = 1f;
            Color flowerLight = Color.Lerp(flowerColor, Color.white, 0.3f);
            Color stem = new Color(0.22f, 0.40f, 0.18f);

            for (int y = 0; y < s; y++)
            {
                for (int x = 0; x < s; x++)
                {
                    float perlin = Mathf.PerlinNoise(x * 0.4f, y * 0.4f);
                    Color c = Color.Lerp(grassDark, grassBase, perlin);
                    float noise = (rng.Next(80) - 40) / 1000f;
                    c.r += noise; c.g += noise * 1.3f; c.b += noise * 0.5f;

                    int fHash = (x * 37 + y * 59) % 127;
                    if (fHash < 8)
                    {
                        // Flower: center + petals
                        c = flowerColor;
                        if (fHash < 2) c = flowerLight;
                        if (fHash == 0 && y > 0) tex.SetPixel(x, y - 1, stem);
                    }
                    else if (fHash < 12 && y > 0)
                    {
                        c = Color.Lerp(c, stem, 0.3f);
                    }

                    c.a = 1f;
                    tex.SetPixel(x, y, c);
                }
            }
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return MakeTile(tex);
        }

        public static Tile CreateBridgeTile()
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var rng = new System.Random(600);
            var woodBase = new Color(0.48f, 0.35f, 0.20f);
            var woodDark = new Color(0.35f, 0.25f, 0.14f);
            var woodLight = new Color(0.58f, 0.42f, 0.25f);
            var nailColor = new Color(0.35f, 0.32f, 0.30f);

            for (int y = 0; y < s; y++)
            {
                for (int x = 0; x < s; x++)
                {
                    int plank = x / 4;
                    bool isGap = (x % 4 == 0);
                    bool isEdge = (x % 4 == 3);

                    Color c;
                    if (isGap)
                    {
                        c = woodDark;
                    }
                    else
                    {
                        float grain = Mathf.PerlinNoise(x * 0.3f + plank * 5f, y * 0.8f);
                        c = Color.Lerp(woodBase, woodLight, grain * 0.3f);
                        if (isEdge) c = Color.Lerp(c, woodDark, 0.15f);

                        float noise = (rng.Next(60) - 30) / 1200f;
                        c.r += noise; c.g += noise * 0.8f; c.b += noise * 0.4f;

                        // Wood knots
                        if (rng.Next(200) < 2)
                            c = Color.Lerp(c, woodDark, 0.4f);
                    }

                    // Nails
                    if ((y == 2 || y == 13) && x % 4 == 2)
                        c = nailColor;

                    // Top/bottom rails
                    if (y == 0 || y == s - 1)
                        c = Color.Lerp(woodDark, woodBase, 0.3f);

                    c.a = 1f;
                    tex.SetPixel(x, y, c);
                }
            }
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return MakeTile(tex);
        }

        private static Tile MakeTile(Texture2D tex)
        {
            var tile = ScriptableObject.CreateInstance<Tile>();
            tile.sprite = Sprite.Create(tex, new Rect(0, 0, tex.width, tex.height),
                new Vector2(0.5f, 0.5f), 16f);
            tile.color = Color.white;
            return tile;
        }

        #endregion

        #region NPC Sprites

        /// <summary>
        /// Creates a distinct 16x16 pixel art NPC sprite based on character archetype.
        /// </summary>
        public static Sprite CreateNPCSprite(string npcId, int facing = 0)
        {
            var config = GetNPCConfig(npcId);
            return DrawNPCSprite(config);
        }

        private static NPCVisualConfig GetNPCConfig(string npcId)
        {
            switch (npcId?.ToLower())
            {
                case "evangelist":
                    return new NPCVisualConfig
                    {
                        SkinColor = new Color(0.82f, 0.68f, 0.55f),
                        RobeColor = new Color(0.20f, 0.18f, 0.35f),
                        AccentColor = new Color(0.85f, 0.75f, 0.45f),
                        HairColor = new Color(0.40f, 0.35f, 0.30f),
                        HasBeard = true, HasBook = true, HairHeight = 2
                    };
                case "obstinate":
                    return new NPCVisualConfig
                    {
                        SkinColor = new Color(0.78f, 0.60f, 0.50f),
                        RobeColor = new Color(0.55f, 0.22f, 0.18f),
                        AccentColor = new Color(0.70f, 0.30f, 0.20f),
                        HairColor = new Color(0.25f, 0.18f, 0.12f),
                        HairHeight = 3, IsAngry = true
                    };
                case "pliable":
                    return new NPCVisualConfig
                    {
                        SkinColor = new Color(0.80f, 0.70f, 0.58f),
                        RobeColor = new Color(0.35f, 0.55f, 0.35f),
                        AccentColor = new Color(0.45f, 0.65f, 0.40f),
                        HairColor = new Color(0.50f, 0.40f, 0.25f),
                        HairHeight = 2
                    };
                case "help":
                    return new NPCVisualConfig
                    {
                        SkinColor = new Color(0.75f, 0.62f, 0.48f),
                        RobeColor = new Color(0.25f, 0.40f, 0.60f),
                        AccentColor = new Color(0.40f, 0.55f, 0.75f),
                        HairColor = new Color(0.35f, 0.28f, 0.20f),
                        HairHeight = 2, HasShield = true
                    };
                case "worldlywiseman":
                    return new NPCVisualConfig
                    {
                        SkinColor = new Color(0.80f, 0.68f, 0.55f),
                        RobeColor = new Color(0.50f, 0.38f, 0.50f),
                        AccentColor = new Color(0.65f, 0.50f, 0.60f),
                        HairColor = new Color(0.55f, 0.50f, 0.45f),
                        HasBeard = true, HairHeight = 1
                    };
                case "goodwill":
                case "gatekeeper":
                    return new NPCVisualConfig
                    {
                        SkinColor = new Color(0.78f, 0.65f, 0.52f),
                        RobeColor = new Color(0.80f, 0.72f, 0.50f),
                        AccentColor = new Color(0.90f, 0.82f, 0.55f),
                        HairColor = new Color(0.45f, 0.38f, 0.28f),
                        HairHeight = 2, HasHalo = true
                    };
                case "interpreter":
                    return new NPCVisualConfig
                    {
                        SkinColor = new Color(0.75f, 0.60f, 0.48f),
                        RobeColor = new Color(0.40f, 0.28f, 0.50f),
                        AccentColor = new Color(0.55f, 0.40f, 0.65f),
                        HairColor = new Color(0.30f, 0.25f, 0.20f),
                        HasBeard = true, HasBook = true, HairHeight = 1
                    };
                case "faithful":
                    return new NPCVisualConfig
                    {
                        SkinColor = new Color(0.55f, 0.42f, 0.32f),
                        RobeColor = new Color(0.70f, 0.55f, 0.30f),
                        AccentColor = new Color(0.85f, 0.70f, 0.40f),
                        HairColor = new Color(0.20f, 0.15f, 0.10f),
                        HairHeight = 2
                    };
                case "hopeful":
                    return new NPCVisualConfig
                    {
                        SkinColor = new Color(0.82f, 0.72f, 0.60f),
                        RobeColor = new Color(0.35f, 0.55f, 0.70f),
                        AccentColor = new Color(0.50f, 0.70f, 0.85f),
                        HairColor = new Color(0.55f, 0.45f, 0.30f),
                        HairHeight = 3
                    };
                case "apollyon":
                    return new NPCVisualConfig
                    {
                        SkinColor = new Color(0.45f, 0.30f, 0.30f),
                        RobeColor = new Color(0.30f, 0.10f, 0.10f),
                        AccentColor = new Color(0.60f, 0.15f, 0.10f),
                        HairColor = new Color(0.20f, 0.10f, 0.08f),
                        HairHeight = 4, IsAngry = true, HasHorns = true
                    };
                case "prudence":
                    return new NPCVisualConfig
                    {
                        SkinColor = new Color(0.85f, 0.72f, 0.60f),
                        RobeColor = new Color(0.55f, 0.45f, 0.65f),
                        AccentColor = new Color(0.70f, 0.60f, 0.80f),
                        HairColor = new Color(0.30f, 0.22f, 0.18f),
                        HairHeight = 4
                    };
                case "piety":
                    return new NPCVisualConfig
                    {
                        SkinColor = new Color(0.82f, 0.70f, 0.58f),
                        RobeColor = new Color(0.40f, 0.25f, 0.55f),
                        AccentColor = new Color(0.55f, 0.35f, 0.70f),
                        HairColor = new Color(0.25f, 0.18f, 0.12f),
                        HairHeight = 4
                    };
                case "charity":
                    return new NPCVisualConfig
                    {
                        SkinColor = new Color(0.85f, 0.72f, 0.60f),
                        RobeColor = new Color(0.65f, 0.25f, 0.25f),
                        AccentColor = new Color(0.80f, 0.35f, 0.35f),
                        HairColor = new Color(0.35f, 0.20f, 0.15f),
                        HairHeight = 4
                    };
                case "giant_despair":
                    return new NPCVisualConfig
                    {
                        SkinColor = new Color(0.40f, 0.35f, 0.30f),
                        RobeColor = new Color(0.25f, 0.20f, 0.18f),
                        AccentColor = new Color(0.35f, 0.28f, 0.22f),
                        HairColor = new Color(0.20f, 0.15f, 0.10f),
                        HairHeight = 3, IsAngry = true
                    };
                case "shepherd1":
                case "shepherd2":
                    return new NPCVisualConfig
                    {
                        SkinColor = new Color(0.82f, 0.70f, 0.58f),
                        RobeColor = new Color(0.85f, 0.82f, 0.78f),
                        AccentColor = new Color(0.75f, 0.70f, 0.60f),
                        HairColor = new Color(0.50f, 0.42f, 0.32f),
                        HairHeight = 2
                    };
                case "ignorance":
                    return new NPCVisualConfig
                    {
                        SkinColor = new Color(0.85f, 0.75f, 0.62f),
                        RobeColor = new Color(0.60f, 0.55f, 0.45f),
                        AccentColor = new Color(0.70f, 0.65f, 0.50f),
                        HairColor = new Color(0.60f, 0.50f, 0.35f),
                        HairHeight = 2
                    };
                case "byends":
                    return new NPCVisualConfig
                    {
                        SkinColor = new Color(0.82f, 0.70f, 0.58f),
                        RobeColor = new Color(0.55f, 0.45f, 0.20f),
                        AccentColor = new Color(0.75f, 0.65f, 0.30f),
                        HairColor = new Color(0.35f, 0.28f, 0.18f),
                        HairHeight = 2
                    };
                case "shining1":
                case "shining2":
                case "shining3":
                    return new NPCVisualConfig
                    {
                        SkinColor = new Color(0.95f, 0.92f, 0.85f),
                        RobeColor = new Color(0.95f, 0.95f, 0.90f),
                        AccentColor = new Color(0.90f, 0.85f, 0.55f),
                        HairColor = new Color(0.90f, 0.85f, 0.70f),
                        HairHeight = 2
                    };
                default:
                    return new NPCVisualConfig
                    {
                        SkinColor = new Color(0.80f, 0.68f, 0.55f),
                        RobeColor = new Color(0.45f, 0.40f, 0.35f),
                        AccentColor = new Color(0.55f, 0.50f, 0.45f),
                        HairColor = new Color(0.40f, 0.32f, 0.22f),
                        HairHeight = 2
                    };
            }
        }

        private static Sprite DrawNPCSprite(NPCVisualConfig cfg)
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = Color.clear;

            // Feet (y=0-1)
            SetBlock(pixels, s, 5, 0, 3, 2, cfg.RobeColor * 0.6f);
            SetBlock(pixels, s, 9, 0, 3, 2, cfg.RobeColor * 0.6f);

            // Robe body (y=2-9)
            SetBlock(pixels, s, 4, 2, 8, 8, cfg.RobeColor);
            // Robe accent (belt area)
            SetBlock(pixels, s, 4, 5, 8, 1, cfg.AccentColor);

            // Arms
            SetBlock(pixels, s, 3, 4, 1, 4, cfg.RobeColor * 0.85f);
            SetBlock(pixels, s, 12, 4, 1, 4, cfg.RobeColor * 0.85f);

            // Neck
            SetBlock(pixels, s, 6, 10, 4, 1, cfg.SkinColor);

            // Head (y=10-14)
            SetBlock(pixels, s, 5, 10, 6, 5, cfg.SkinColor);

            // Eyes
            SetPixelSafe(pixels, s, 6, 12, new Color(0.15f, 0.12f, 0.10f));
            SetPixelSafe(pixels, s, 9, 12, new Color(0.15f, 0.12f, 0.10f));

            // Mouth
            if (cfg.IsAngry)
            {
                SetPixelSafe(pixels, s, 7, 11, new Color(0.4f, 0.15f, 0.10f));
                SetPixelSafe(pixels, s, 8, 11, new Color(0.4f, 0.15f, 0.10f));
            }

            // Hair
            SetBlock(pixels, s, 5, 15 - cfg.HairHeight, 6, cfg.HairHeight, cfg.HairColor);
            SetBlock(pixels, s, 4, 13, 1, 2, cfg.HairColor); // side hair left
            SetBlock(pixels, s, 11, 13, 1, 2, cfg.HairColor); // side hair right

            // Beard
            if (cfg.HasBeard)
            {
                SetBlock(pixels, s, 6, 10, 4, 1, cfg.HairColor * 0.9f);
                SetPixelSafe(pixels, s, 7, 9, cfg.HairColor * 0.85f);
                SetPixelSafe(pixels, s, 8, 9, cfg.HairColor * 0.85f);
            }

            // Book
            if (cfg.HasBook)
            {
                SetBlock(pixels, s, 12, 5, 2, 3, new Color(0.50f, 0.35f, 0.18f));
                SetPixelSafe(pixels, s, 13, 6, new Color(0.85f, 0.78f, 0.60f));
            }

            // Shield
            if (cfg.HasShield)
            {
                SetBlock(pixels, s, 1, 4, 2, 5, new Color(0.50f, 0.45f, 0.40f));
                SetPixelSafe(pixels, s, 2, 6, cfg.AccentColor);
            }

            // Halo
            if (cfg.HasHalo)
            {
                int haloY = Mathf.Min(15, 15);
                SetPixelSafe(pixels, s, 6, haloY, new Color(1f, 0.9f, 0.5f, 0.8f));
                SetPixelSafe(pixels, s, 7, haloY, new Color(1f, 0.9f, 0.5f, 0.8f));
                SetPixelSafe(pixels, s, 8, haloY, new Color(1f, 0.9f, 0.5f, 0.8f));
                SetPixelSafe(pixels, s, 9, haloY, new Color(1f, 0.9f, 0.5f, 0.8f));
            }

            // Horns
            if (cfg.HasHorns)
            {
                SetPixelSafe(pixels, s, 4, 15, cfg.AccentColor);
                SetPixelSafe(pixels, s, 4, 14, cfg.AccentColor);
                SetPixelSafe(pixels, s, 11, 15, cfg.AccentColor);
                SetPixelSafe(pixels, s, 11, 14, cfg.AccentColor);
            }

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.25f), s);
        }

        private struct NPCVisualConfig
        {
            public Color SkinColor, RobeColor, AccentColor, HairColor;
            public int HairHeight;
            public bool HasBeard, HasBook, HasShield, HasHalo, HasHorns, IsAngry;
        }

        #endregion

        #region UI Textures

        public static Texture2D CreatePanelTexture(int w = 32, int h = 32,
            Color fill = default, Color border = default, int borderWidth = 2)
        {
            if (fill == default) fill = new Color(0.08f, 0.06f, 0.12f, 0.92f);
            if (border == default) border = new Color(0.65f, 0.55f, 0.35f, 0.6f);

            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    bool isBorder = x < borderWidth || x >= w - borderWidth
                        || y < borderWidth || y >= h - borderWidth;

                    // Rounded corners
                    bool isCorner = (x < borderWidth + 1 && y < borderWidth + 1)
                        || (x < borderWidth + 1 && y >= h - borderWidth - 1)
                        || (x >= w - borderWidth - 1 && y < borderWidth + 1)
                        || (x >= w - borderWidth - 1 && y >= h - borderWidth - 1);

                    if (isCorner)
                        tex.SetPixel(x, y, Color.clear);
                    else if (isBorder)
                        tex.SetPixel(x, y, border);
                    else
                        tex.SetPixel(x, y, fill);
                }
            }

            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return tex;
        }

        public static Sprite CreatePanelSprite()
        {
            var tex = CreatePanelTexture();
            return Sprite.Create(tex, new Rect(0, 0, tex.width, tex.height),
                new Vector2(0.5f, 0.5f), 16f,
                0, SpriteMeshType.FullRect, new Vector4(4, 4, 4, 4));
        }

        public static Sprite CreateButtonSprite(Color fill, Color border)
        {
            var tex = CreatePanelTexture(24, 12, fill, border, 1);
            return Sprite.Create(tex, new Rect(0, 0, 24, 12),
                new Vector2(0.5f, 0.5f), 12f,
                0, SpriteMeshType.FullRect, new Vector4(3, 3, 3, 3));
        }

        #endregion

        #region Item/Icon Sprites

        public static Sprite CreateScrollIcon()
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = Color.clear;

            var parchment = new Color(0.90f, 0.82f, 0.65f);
            var ink = new Color(0.25f, 0.20f, 0.15f);

            SetBlock(pixels, s, 3, 2, 10, 12, parchment);
            // Curl at top
            SetBlock(pixels, s, 3, 13, 10, 1, parchment * 0.8f);
            SetBlock(pixels, s, 3, 1, 10, 1, parchment * 0.8f);
            // Text lines
            for (int row = 0; row < 4; row++)
                SetBlock(pixels, s, 5, 4 + row * 2, 6, 1, ink * 0.4f);

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.5f), s);
        }

        public static Sprite CreateCrossIcon()
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = Color.clear;

            var wood = new Color(0.50f, 0.35f, 0.20f);
            SetBlock(pixels, s, 7, 1, 2, 14, wood);
            SetBlock(pixels, s, 4, 10, 8, 2, wood);

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.5f), s);
        }

        public static Sprite CreateKeyIcon()
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = Color.clear;

            var gold = new Color(0.85f, 0.72f, 0.35f);
            // Key shaft
            SetBlock(pixels, s, 3, 7, 8, 2, gold);
            // Key head (ring)
            SetBlock(pixels, s, 10, 5, 4, 6, gold);
            SetBlock(pixels, s, 11, 6, 2, 4, Color.clear);
            // Key teeth
            SetBlock(pixels, s, 3, 5, 1, 2, gold);
            SetBlock(pixels, s, 5, 5, 1, 2, gold);

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.5f), s);
        }

        #endregion

        #region Environment Objects

        public static Sprite CreateTreeSprite(int variant = 0, MapTheme theme = MapTheme.Fields)
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = Color.clear;
            var rng = new System.Random(variant * 31 + (int)theme * 7);

            Color trunk, trunkDark, leaves, leavesDark, leavesLight;
            GetTreePalette(theme, variant, out trunk, out trunkDark, out leaves, out leavesDark, out leavesLight);

            // Trunk with bark texture
            for (int y = 0; y < 7; y++)
            {
                for (int dx = 0; dx < 2; dx++)
                {
                    int px = 7 + dx;
                    float bark = (rng.Next(100) < 30) ? -0.04f : 0f;
                    Color tc = trunk;
                    tc.r += bark; tc.g += bark; tc.b += bark;
                    if (dx == 0) tc = Color.Lerp(tc, trunkDark, 0.2f);
                    SetPixelSafe(pixels, s, px, y, tc);
                }
            }
            // Roots
            SetPixelSafe(pixels, s, 6, 0, trunkDark);
            SetPixelSafe(pixels, s, 9, 0, trunkDark);
            if (variant % 3 == 0) SetPixelSafe(pixels, s, 6, 1, trunkDark);

            // Canopy shape varies by variant
            if (variant % 4 == 0)
            {
                // Round canopy
                for (int y = 6; y < 15; y++)
                {
                    float cy = 10.5f;
                    float cx = 8f;
                    float ry = 4.5f;
                    float rx = 5f;
                    for (int x = 2; x < 14; x++)
                    {
                        float dx = (x - cx) / rx;
                        float dy = (y - cy) / ry;
                        if (dx * dx + dy * dy <= 1f)
                        {
                            Color c = (rng.Next(100) < 35) ? leavesLight :
                                      (rng.Next(100) < 25) ? leavesDark : leaves;
                            // Inner shadow
                            if (dx < -0.3f && dy < -0.2f) c = Color.Lerp(c, leavesDark, 0.3f);
                            // Outer highlight
                            if (dx > 0.3f && dy > 0.2f) c = Color.Lerp(c, leavesLight, 0.15f);
                            SetPixelSafe(pixels, s, x, y, c);
                        }
                    }
                }
            }
            else if (variant % 4 == 1)
            {
                // Pine/conical canopy
                for (int y = 5; y < 15; y++)
                {
                    int width = Mathf.Max(1, (y - 4));
                    if (width > 8) width = 8;
                    int startX = 8 - width / 2;
                    for (int x = startX; x < startX + width && x < s; x++)
                    {
                        if (x < 0) continue;
                        Color c = (rng.Next(100) < 30) ? leavesLight : leaves;
                        if (x == startX || x == startX + width - 1) c = leavesDark;
                        if ((y - 5) % 3 == 0 && x > startX && x < startX + width - 1)
                            c = Color.Lerp(c, leavesLight, 0.2f);
                        SetPixelSafe(pixels, s, x, y, c);
                    }
                }
            }
            else if (variant % 4 == 2)
            {
                // Wide/oak canopy
                for (int y = 7; y < 15; y++)
                {
                    int baseW = 10;
                    int w = (y < 9) ? baseW - (9 - y) * 2 : (y > 13) ? baseW - (y - 13) * 3 : baseW;
                    w = Mathf.Clamp(w, 2, 12);
                    int startX = 8 - w / 2;
                    for (int x = startX; x < startX + w && x < s; x++)
                    {
                        if (x < 0) continue;
                        Color c = (rng.Next(100) < 30) ? leavesLight :
                                  (rng.Next(100) < 20) ? leavesDark : leaves;
                        SetPixelSafe(pixels, s, x, y, c);
                    }
                }
                // Extra branch bumps
                SetPixelSafe(pixels, s, 4, 10, leaves);
                SetPixelSafe(pixels, s, 11, 11, leavesLight);
            }
            else
            {
                // Bushy/irregular canopy
                for (int y = 6; y < 14; y++)
                {
                    int w = 6 + rng.Next(4);
                    int startX = 8 - w / 2 + rng.Next(3) - 1;
                    for (int x = startX; x < startX + w && x < s; x++)
                    {
                        if (x < 0) continue;
                        Color c = (rng.Next(100) < 35) ? leavesLight : leaves;
                        if (rng.Next(100) < 15) c = leavesDark;
                        SetPixelSafe(pixels, s, x, y, c);
                    }
                }
            }

            // Leaf outline shadow
            for (int y = 5; y < 15; y++)
            {
                for (int x = 1; x < s - 1; x++)
                {
                    if (pixels[y * s + x].a > 0.5f)
                    {
                        if (x > 0 && pixels[y * s + (x - 1)].a < 0.1f)
                            pixels[y * s + x] = Color.Lerp(pixels[y * s + x], leavesDark, 0.3f);
                        if (y > 0 && pixels[(y - 1) * s + x].a < 0.1f)
                            pixels[y * s + x] = Color.Lerp(pixels[y * s + x], leavesDark, 0.2f);
                    }
                }
            }

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.0f), s);
        }

        private static void GetTreePalette(MapTheme theme, int variant,
            out Color trunk, out Color trunkDark, out Color leaves, out Color leavesDark, out Color leavesLight)
        {
            switch (theme)
            {
                case MapTheme.DarkValley:
                    trunk = new Color(0.25f, 0.18f, 0.12f);
                    trunkDark = new Color(0.18f, 0.12f, 0.08f);
                    leaves = new Color(0.15f, 0.28f, 0.15f);
                    leavesDark = new Color(0.10f, 0.20f, 0.10f);
                    leavesLight = new Color(0.20f, 0.35f, 0.18f);
                    break;
                case MapTheme.Celestial:
                    trunk = new Color(0.45f, 0.35f, 0.22f);
                    trunkDark = new Color(0.35f, 0.25f, 0.15f);
                    leaves = new Color(0.35f, 0.58f, 0.32f);
                    leavesDark = new Color(0.28f, 0.48f, 0.25f);
                    leavesLight = new Color(0.48f, 0.70f, 0.42f);
                    break;
                default:
                    trunk = new Color(0.40f, 0.28f, 0.15f);
                    trunkDark = new Color(0.30f, 0.20f, 0.10f);
                    if (variant % 2 == 0)
                    {
                        leaves = new Color(0.22f, 0.45f, 0.20f);
                        leavesDark = new Color(0.16f, 0.35f, 0.15f);
                        leavesLight = new Color(0.32f, 0.58f, 0.28f);
                    }
                    else
                    {
                        leaves = new Color(0.28f, 0.50f, 0.22f);
                        leavesDark = new Color(0.20f, 0.38f, 0.16f);
                        leavesLight = new Color(0.38f, 0.62f, 0.30f);
                    }
                    break;
            }
        }

        public static Sprite CreateRockSprite(int variant = 0, MapTheme theme = MapTheme.Fields)
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = Color.clear;
            var rng = new System.Random(700 + variant);

            Color rockBase, rockDark, rockLight;
            switch (theme)
            {
                case MapTheme.DarkValley:
                    rockBase = new Color(0.22f, 0.20f, 0.20f);
                    rockDark = new Color(0.14f, 0.12f, 0.12f);
                    rockLight = new Color(0.30f, 0.28f, 0.28f);
                    break;
                case MapTheme.Celestial:
                    rockBase = new Color(0.60f, 0.58f, 0.55f);
                    rockDark = new Color(0.48f, 0.45f, 0.42f);
                    rockLight = new Color(0.72f, 0.70f, 0.65f);
                    break;
                default:
                    rockBase = new Color(0.42f, 0.40f, 0.38f);
                    rockDark = new Color(0.32f, 0.30f, 0.28f);
                    rockLight = new Color(0.52f, 0.50f, 0.48f);
                    break;
            }

            int w = (variant % 3 == 0) ? 8 : (variant % 3 == 1) ? 10 : 6;
            int h = (variant % 3 == 0) ? 6 : (variant % 3 == 1) ? 5 : 7;
            int ox = 8 - w / 2;

            for (int y = 0; y < h; y++)
            {
                int rowShrink = (y == 0 || y == h - 1) ? 1 : 0;
                for (int x = rowShrink; x < w - rowShrink; x++)
                {
                    Color c = rockBase;
                    float nx = (float)x / w;
                    float ny = (float)y / h;
                    if (ny > 0.6f) c = Color.Lerp(c, rockLight, (ny - 0.6f) * 0.6f);
                    if (ny < 0.3f) c = Color.Lerp(c, rockDark, (0.3f - ny) * 0.5f);
                    if (nx < 0.3f) c = Color.Lerp(c, rockDark, 0.15f);

                    c.r += (rng.Next(60) - 30) / 1000f;
                    c.g += (rng.Next(60) - 30) / 1000f;
                    c.b += (rng.Next(60) - 30) / 1000f;

                    if (rng.Next(100) < 5) c = Color.Lerp(c, rockDark, 0.3f);

                    c.a = 1f;
                    SetPixelSafe(pixels, s, ox + x, y, c);
                }
            }

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.0f), s);
        }

        public static Sprite CreateBushSprite(int variant = 0, MapTheme theme = MapTheme.Fields)
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = Color.clear;
            var rng = new System.Random(800 + variant);

            Color bushBase, bushDark, bushLight;
            switch (theme)
            {
                case MapTheme.DarkValley:
                    bushBase = new Color(0.15f, 0.25f, 0.15f);
                    bushDark = new Color(0.10f, 0.18f, 0.10f);
                    bushLight = new Color(0.20f, 0.32f, 0.18f);
                    break;
                case MapTheme.Celestial:
                    bushBase = new Color(0.32f, 0.55f, 0.30f);
                    bushDark = new Color(0.25f, 0.45f, 0.22f);
                    bushLight = new Color(0.42f, 0.68f, 0.38f);
                    break;
                default:
                    bushBase = new Color(0.25f, 0.42f, 0.22f);
                    bushDark = new Color(0.18f, 0.32f, 0.16f);
                    bushLight = new Color(0.35f, 0.55f, 0.30f);
                    break;
            }

            bool hasBerries = variant % 3 == 0;
            Color berryColor = new Color(0.75f, 0.20f, 0.20f);

            float cx = 7.5f, cy = 4f, rx = 5f, ry = 3.5f;
            for (int y = 0; y < 8; y++)
            {
                for (int x = 2; x < 14; x++)
                {
                    float dx = (x - cx) / rx;
                    float dy = (y - cy) / ry;
                    if (dx * dx + dy * dy <= 1f)
                    {
                        Color c = (rng.Next(100) < 30) ? bushLight :
                                  (rng.Next(100) < 25) ? bushDark : bushBase;
                        if (dx < -0.3f) c = Color.Lerp(c, bushDark, 0.2f);
                        if (dy > 0.3f) c = Color.Lerp(c, bushLight, 0.15f);

                        if (hasBerries && rng.Next(100) < 10)
                            c = berryColor;

                        c.a = 1f;
                        SetPixelSafe(pixels, s, x, y, c);
                    }
                }
            }

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.0f), s);
        }

        public static Sprite CreateFlowerPropSprite(int variant = 0)
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = Color.clear;

            Color[] petalColors = {
                new Color(0.85f, 0.35f, 0.35f),
                new Color(0.90f, 0.78f, 0.30f),
                new Color(0.45f, 0.35f, 0.80f),
                new Color(0.90f, 0.55f, 0.70f),
                new Color(0.40f, 0.65f, 0.85f),
            };
            Color petals = petalColors[variant % petalColors.Length];
            Color center = new Color(0.90f, 0.82f, 0.30f);
            Color stem = new Color(0.20f, 0.38f, 0.15f);
            Color leaf = new Color(0.25f, 0.48f, 0.20f);

            SetPixelSafe(pixels, s, 7, 0, stem); SetPixelSafe(pixels, s, 8, 0, stem);
            SetPixelSafe(pixels, s, 7, 1, stem); SetPixelSafe(pixels, s, 8, 1, stem);
            SetPixelSafe(pixels, s, 7, 2, stem); SetPixelSafe(pixels, s, 8, 2, stem);
            SetPixelSafe(pixels, s, 7, 3, stem);
            SetPixelSafe(pixels, s, 6, 1, leaf); SetPixelSafe(pixels, s, 9, 2, leaf);

            // Petals
            SetPixelSafe(pixels, s, 7, 6, petals); SetPixelSafe(pixels, s, 8, 6, petals);
            SetPixelSafe(pixels, s, 6, 5, petals); SetPixelSafe(pixels, s, 9, 5, petals);
            SetPixelSafe(pixels, s, 7, 4, petals); SetPixelSafe(pixels, s, 8, 4, petals);
            SetPixelSafe(pixels, s, 6, 4, petals); SetPixelSafe(pixels, s, 9, 4, petals);
            SetPixelSafe(pixels, s, 7, 3, petals); SetPixelSafe(pixels, s, 8, 3, petals);
            // Center
            SetPixelSafe(pixels, s, 7, 5, center); SetPixelSafe(pixels, s, 8, 5, center);

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.0f), s);
        }

        public static Sprite CreateLanternSprite()
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = Color.clear;

            Color post = new Color(0.30f, 0.25f, 0.22f);
            Color lamp = new Color(0.90f, 0.78f, 0.40f);
            Color glow = new Color(0.95f, 0.88f, 0.55f, 0.6f);
            Color frame = new Color(0.35f, 0.30f, 0.25f);

            SetBlock(pixels, s, 7, 0, 2, 10, post);
            SetBlock(pixels, s, 6, 10, 4, 1, frame);
            SetBlock(pixels, s, 6, 14, 4, 1, frame);
            SetBlock(pixels, s, 6, 11, 1, 3, frame);
            SetBlock(pixels, s, 9, 11, 1, 3, frame);
            SetBlock(pixels, s, 7, 11, 2, 3, lamp);
            // Glow effect
            SetPixelSafe(pixels, s, 5, 12, glow);
            SetPixelSafe(pixels, s, 10, 12, glow);
            SetPixelSafe(pixels, s, 7, 15, new Color(0.90f, 0.80f, 0.50f, 0.4f));
            SetPixelSafe(pixels, s, 8, 15, new Color(0.90f, 0.80f, 0.50f, 0.4f));

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.0f), s);
        }

        public static Sprite CreateFenceSprite(bool isHorizontal = true)
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = Color.clear;

            Color wood = new Color(0.48f, 0.35f, 0.20f);
            Color woodDark = new Color(0.38f, 0.28f, 0.16f);

            if (isHorizontal)
            {
                SetBlock(pixels, s, 0, 4, 16, 1, wood);
                SetBlock(pixels, s, 0, 7, 16, 1, wood);
                SetBlock(pixels, s, 0, 3, 2, 6, woodDark);
                SetBlock(pixels, s, 7, 3, 2, 6, woodDark);
                SetBlock(pixels, s, 14, 3, 2, 6, woodDark);
                SetPixelSafe(pixels, s, 0, 9, woodDark);
                SetPixelSafe(pixels, s, 1, 9, woodDark);
                SetPixelSafe(pixels, s, 7, 9, woodDark);
                SetPixelSafe(pixels, s, 8, 9, woodDark);
                SetPixelSafe(pixels, s, 14, 9, woodDark);
                SetPixelSafe(pixels, s, 15, 9, woodDark);
            }
            else
            {
                SetBlock(pixels, s, 4, 0, 1, 16, wood);
                SetBlock(pixels, s, 7, 0, 1, 16, wood);
                SetBlock(pixels, s, 3, 0, 6, 2, woodDark);
                SetBlock(pixels, s, 3, 7, 6, 2, woodDark);
                SetBlock(pixels, s, 3, 14, 6, 2, woodDark);
            }

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.0f), s);
        }

        public static Sprite CreateMushroomSprite(int variant = 0)
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = Color.clear;

            Color stem = new Color(0.85f, 0.80f, 0.70f);
            Color capBase = (variant % 2 == 0)
                ? new Color(0.75f, 0.25f, 0.20f)
                : new Color(0.60f, 0.45f, 0.25f);
            Color spots = new Color(0.95f, 0.92f, 0.85f);

            SetBlock(pixels, s, 7, 0, 2, 4, stem);
            SetBlock(pixels, s, 5, 4, 6, 3, capBase);
            SetBlock(pixels, s, 6, 7, 4, 1, capBase);
            SetPixelSafe(pixels, s, 6, 6, Color.Lerp(capBase, spots, 0.5f));
            SetPixelSafe(pixels, s, 9, 5, Color.Lerp(capBase, spots, 0.5f));
            SetPixelSafe(pixels, s, 7, 7, Color.Lerp(capBase, Color.black, 0.2f));
            SetPixelSafe(pixels, s, 8, 7, Color.Lerp(capBase, Color.black, 0.2f));

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.0f), s);
        }

        public static Sprite CreateCrossMonumentSprite()
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = Color.clear;

            Color stone = new Color(0.55f, 0.52f, 0.48f);
            Color stoneLight = new Color(0.65f, 0.62f, 0.58f);
            Color stoneDark = new Color(0.42f, 0.40f, 0.38f);
            Color base_ = new Color(0.40f, 0.38f, 0.35f);

            // Base
            SetBlock(pixels, s, 4, 0, 8, 2, base_);
            SetBlock(pixels, s, 5, 2, 6, 1, stoneDark);
            // Vertical
            SetBlock(pixels, s, 6, 3, 4, 12, stone);
            // Arms
            SetBlock(pixels, s, 3, 10, 10, 3, stone);
            // Highlight
            SetBlock(pixels, s, 7, 4, 1, 10, stoneLight);
            SetBlock(pixels, s, 4, 11, 8, 1, stoneLight);
            // Shadow
            SetBlock(pixels, s, 9, 3, 1, 7, stoneDark);
            SetBlock(pixels, s, 3, 10, 3, 1, stoneDark);

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.0f), s);
        }

        public static Sprite CreateSignpostSprite(MapTheme theme = MapTheme.Fields)
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = Color.clear;

            Color wood = new Color(0.45f, 0.32f, 0.18f);
            Color woodDark = new Color(0.35f, 0.25f, 0.14f);
            Color sign = new Color(0.58f, 0.48f, 0.32f);
            Color signLight = new Color(0.65f, 0.55f, 0.38f);

            // Post with shading
            for (int y = 0; y < 14; y++)
            {
                Color pc = (y % 3 == 0) ? woodDark : wood;
                SetPixelSafe(pixels, s, 7, y, pc);
                SetPixelSafe(pixels, s, 8, y, Color.Lerp(pc, woodDark, 0.15f));
            }
            // Sign board with border
            SetBlock(pixels, s, 2, 10, 12, 4, sign);
            SetBlock(pixels, s, 2, 10, 12, 1, woodDark);
            SetBlock(pixels, s, 2, 13, 12, 1, woodDark);
            SetBlock(pixels, s, 2, 10, 1, 4, woodDark);
            SetBlock(pixels, s, 13, 10, 1, 4, woodDark);
            SetBlock(pixels, s, 3, 11, 10, 2, signLight);
            // Text lines
            SetBlock(pixels, s, 4, 12, 8, 1, woodDark);
            SetBlock(pixels, s, 5, 11, 6, 1, Color.Lerp(woodDark, sign, 0.3f));

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.0f), s);
        }

        public static Sprite CreateGravestone()
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = Color.clear;

            Color stone = new Color(0.40f, 0.38f, 0.36f);
            Color dark = new Color(0.28f, 0.26f, 0.25f);
            Color moss = new Color(0.25f, 0.35f, 0.22f);

            SetBlock(pixels, s, 5, 0, 6, 8, stone);
            SetBlock(pixels, s, 6, 8, 4, 2, stone);
            SetPixelSafe(pixels, s, 7, 10, stone);
            SetPixelSafe(pixels, s, 8, 10, stone);
            // Arch top
            SetPixelSafe(pixels, s, 5, 8, Color.clear);
            SetPixelSafe(pixels, s, 10, 8, Color.clear);
            // Cross carving
            SetBlock(pixels, s, 7, 5, 2, 4, dark);
            SetBlock(pixels, s, 6, 7, 4, 1, dark);
            // Moss
            SetPixelSafe(pixels, s, 5, 0, moss);
            SetPixelSafe(pixels, s, 5, 1, moss);
            SetPixelSafe(pixels, s, 10, 0, moss);

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.0f), s);
        }

        public static Sprite CreateTallGrassSprite(MapTheme theme = MapTheme.Fields)
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = Color.clear;

            Color grassBase, grassDark, grassLight, accent;
            GetGrassPalette(theme, out grassBase, out grassDark, out grassLight, out accent);

            var rng = new System.Random(900);
            for (int blade = 0; blade < 5; blade++)
            {
                int bx = 3 + blade * 2 + rng.Next(2);
                int bh = 4 + rng.Next(4);
                Color c = (rng.Next(2) == 0) ? grassBase : grassLight;
                for (int y = 0; y < bh; y++)
                {
                    int sway = (y > bh - 2) ? rng.Next(2) - 1 : 0;
                    SetPixelSafe(pixels, s, bx + sway, y, c);
                    if (y == bh - 1) SetPixelSafe(pixels, s, bx + sway, y, grassLight);
                }
            }

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.0f), s);
        }

        #endregion

        public static Sprite CreateGateSprite(MapTheme theme = MapTheme.Fields)
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = Color.clear;

            Color stone, stoneDark, stoneLight;
            GetWallPalette(theme, out stone, out stoneDark, out stoneLight);

            bool isCelestial = theme == MapTheme.Celestial;
            Color archColor = isCelestial ? new Color(0.90f, 0.82f, 0.50f) : stoneLight;

            // Left pillar
            for (int y = 0; y < 13; y++)
            {
                Color c = (y % 4 == 0) ? stoneDark : stone;
                if (y > 10) c = Color.Lerp(c, stoneLight, 0.15f);
                SetPixelSafe(pixels, s, 2, y, c);
                SetPixelSafe(pixels, s, 3, y, c);
            }
            // Right pillar
            for (int y = 0; y < 13; y++)
            {
                Color c = (y % 4 == 0) ? stoneDark : stone;
                if (y > 10) c = Color.Lerp(c, stoneLight, 0.15f);
                SetPixelSafe(pixels, s, 12, y, c);
                SetPixelSafe(pixels, s, 13, y, c);
            }
            // Arch lintel
            for (int x = 2; x <= 13; x++)
            {
                SetPixelSafe(pixels, s, x, 13, archColor);
                SetPixelSafe(pixels, s, x, 14, archColor);
            }
            // Arch top curve
            SetPixelSafe(pixels, s, 5, 15, archColor);
            SetPixelSafe(pixels, s, 6, 15, archColor);
            SetPixelSafe(pixels, s, 7, 15, archColor);
            SetPixelSafe(pixels, s, 8, 15, archColor);
            SetPixelSafe(pixels, s, 9, 15, archColor);
            SetPixelSafe(pixels, s, 10, 15, archColor);
            // Keystone
            Color keystone = isCelestial ? new Color(1f, 0.92f, 0.55f) : stoneLight;
            SetPixelSafe(pixels, s, 7, 15, keystone);
            SetPixelSafe(pixels, s, 8, 15, keystone);
            // Pillar caps
            for (int x = 1; x <= 4; x++) SetPixelSafe(pixels, s, x, 13, stoneLight);
            for (int x = 11; x <= 14; x++) SetPixelSafe(pixels, s, x, 13, stoneLight);
            // Path through gate
            Color pathCol = new Color(0.55f, 0.45f, 0.35f);
            for (int y = 0; y < 2; y++)
                for (int x = 4; x <= 11; x++)
                    SetPixelSafe(pixels, s, x, y, pathCol);
            // Glow for celestial
            if (isCelestial)
            {
                Color glow = new Color(1f, 0.92f, 0.60f, 0.25f);
                for (int y = 3; y < 12; y++)
                    for (int x = 4; x <= 11; x++)
                        SetPixelSafe(pixels, s, x, y, glow);
            }

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.0f), s);
        }

        #region Helpers

        private static void SetBlock(Color[] pixels, int stride, int x, int y, int w, int h, Color color)
        {
            for (int dy = 0; dy < h; dy++)
            {
                for (int dx = 0; dx < w; dx++)
                {
                    int px = x + dx;
                    int py = y + dy;
                    if (px >= 0 && px < stride && py >= 0 && py < stride)
                        pixels[py * stride + px] = color;
                }
            }
        }

        private static void SetPixelSafe(Color[] pixels, int stride, int x, int y, Color color)
        {
            if (x >= 0 && x < stride && y >= 0 && y < stride)
                pixels[y * stride + x] = color;
        }

        #endregion
    }
}
