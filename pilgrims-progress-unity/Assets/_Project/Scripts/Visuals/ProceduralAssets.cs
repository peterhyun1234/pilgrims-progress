using UnityEngine;
using UnityEngine.Tilemaps;

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

        public static Tile CreateGrassTile(int variant = 0)
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var rng = new System.Random(100 + variant);
            var baseColor = new Color(0.32f, 0.52f, 0.28f);

            for (int y = 0; y < s; y++)
            {
                for (int x = 0; x < s; x++)
                {
                    float noise = (rng.Next(100) - 50) / 800f;
                    var c = new Color(
                        baseColor.r + noise,
                        baseColor.g + noise * 1.5f + (rng.Next(100) - 50) / 1200f,
                        baseColor.b + noise * 0.5f);

                    // Small grass blade details
                    if (rng.Next(100) < 8)
                        c = Color.Lerp(c, new Color(0.25f, 0.60f, 0.22f), 0.4f);

                    // Tiny flower dots
                    if (variant % 3 == 0 && rng.Next(100) < 2)
                        c = Color.Lerp(c, new Color(0.9f, 0.8f, 0.3f), 0.6f);

                    tex.SetPixel(x, y, c);
                }
            }

            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return MakeTile(tex);
        }

        public static Tile CreatePathTile()
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var rng = new System.Random(200);
            var baseColor = new Color(0.60f, 0.50f, 0.35f);

            for (int y = 0; y < s; y++)
            {
                for (int x = 0; x < s; x++)
                {
                    float noise = (rng.Next(100) - 50) / 600f;
                    var c = new Color(
                        baseColor.r + noise,
                        baseColor.g + noise * 0.8f,
                        baseColor.b + noise * 0.5f);

                    // Pebble details
                    if (rng.Next(100) < 5)
                        c = Color.Lerp(c, new Color(0.50f, 0.42f, 0.30f), 0.5f);

                    tex.SetPixel(x, y, c);
                }
            }

            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return MakeTile(tex);
        }

        public static Tile CreateWallTile()
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var rng = new System.Random(300);

            for (int y = 0; y < s; y++)
            {
                for (int x = 0; x < s; x++)
                {
                    // Stone block pattern
                    bool isMortar = (y % 5 == 0) || ((y / 5 % 2 == 0 ? x % 8 : (x + 4) % 8) == 0);
                    var stoneBase = new Color(0.38f, 0.34f, 0.30f);
                    var mortarColor = new Color(0.28f, 0.25f, 0.22f);

                    Color c = isMortar ? mortarColor : stoneBase;
                    float noise = (rng.Next(100) - 50) / 800f;
                    c.r += noise;
                    c.g += noise;
                    c.b += noise;

                    tex.SetPixel(x, y, c);
                }
            }

            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return MakeTile(tex);
        }

        public static Tile CreateWaterTile(int frame = 0)
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var rng = new System.Random(400 + frame);
            var deepColor = new Color(0.15f, 0.25f, 0.50f);
            var lightColor = new Color(0.25f, 0.40f, 0.60f);

            for (int y = 0; y < s; y++)
            {
                for (int x = 0; x < s; x++)
                {
                    float wave = Mathf.Sin((x + frame * 2) * 0.8f + y * 0.3f) * 0.5f + 0.5f;
                    Color c = Color.Lerp(deepColor, lightColor, wave * 0.4f);
                    float noise = (rng.Next(100) - 50) / 1000f;
                    c.r += noise;
                    c.g += noise;
                    c.b += noise;

                    // Sparkle
                    if (rng.Next(100) < 2)
                        c = Color.Lerp(c, new Color(0.5f, 0.6f, 0.8f), 0.4f);

                    tex.SetPixel(x, y, c);
                }
            }

            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return MakeTile(tex);
        }

        public static Tile CreateFlowerTile(Color flowerColor)
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var rng = new System.Random(500);
            var grassBase = new Color(0.30f, 0.50f, 0.26f);

            for (int y = 0; y < s; y++)
            {
                for (int x = 0; x < s; x++)
                {
                    float noise = (rng.Next(100) - 50) / 800f;
                    var c = new Color(grassBase.r + noise, grassBase.g + noise * 1.5f, grassBase.b + noise * 0.5f);

                    if (rng.Next(100) < 10)
                        c = Color.Lerp(c, flowerColor, 0.7f);

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
            var woodColor = new Color(0.45f, 0.32f, 0.18f);
            var plankLine = new Color(0.35f, 0.25f, 0.14f);

            for (int y = 0; y < s; y++)
            {
                for (int x = 0; x < s; x++)
                {
                    bool isPlankEdge = (x % 4 == 0);
                    tex.SetPixel(x, y, isPlankEdge ? plankLine : woodColor);
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

        public static Sprite CreateTreeSprite()
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = Color.clear;

            var trunk = new Color(0.40f, 0.28f, 0.15f);
            var leaves = new Color(0.22f, 0.45f, 0.20f);
            var lightLeaves = new Color(0.30f, 0.55f, 0.25f);

            // Trunk
            SetBlock(pixels, s, 7, 0, 2, 7, trunk);

            // Leaves (triangular shape)
            for (int y = 6; y < 15; y++)
            {
                int width = Mathf.Max(1, (y - 5) * 2);
                int startX = 8 - width / 2;
                for (int x = startX; x < startX + width && x < s; x++)
                {
                    if (x >= 0)
                    {
                        var rng = new System.Random(x * 31 + y * 17);
                        var c = rng.Next(3) == 0 ? lightLeaves : leaves;
                        SetPixelSafe(pixels, s, x, y, c);
                    }
                }
            }

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.0f), s);
        }

        public static Sprite CreateSignpostSprite()
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = Color.clear;

            var wood = new Color(0.45f, 0.32f, 0.18f);
            var sign = new Color(0.55f, 0.45f, 0.30f);

            // Post
            SetBlock(pixels, s, 7, 0, 2, 14, wood);
            // Sign board
            SetBlock(pixels, s, 2, 10, 12, 4, sign);
            // Text hint line
            SetBlock(pixels, s, 4, 12, 8, 1, wood * 0.7f);

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.0f), s);
        }

        #endregion

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
