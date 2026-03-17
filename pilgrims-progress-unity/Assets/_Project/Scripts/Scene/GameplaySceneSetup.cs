using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem.UI;
using UnityEngine.Tilemaps;
using UnityEngine.Rendering.Universal;
using TMPro;
using PilgrimsProgress.Core;
using PilgrimsProgress.Player;
using PilgrimsProgress.Narrative;
using PilgrimsProgress.UI;
using PilgrimsProgress.Visuals;

namespace PilgrimsProgress.Scene
{
    public class GameplaySceneSetup : MonoBehaviour
    {
        private ChapterData _chapterData;

        private void Start()
        {
            if (FindFirstObjectByType<PlayerController>() != null) return;
            EnsureEventSystem();

            var chapterMgr = ChapterManager.Instance;
            if (chapterMgr == null && ServiceLocator.TryGet<ChapterManager>(out var cm))
                chapterMgr = cm;

            int chapter = chapterMgr != null ? chapterMgr.CurrentChapter : 1;
            _chapterData = ChapterDatabase.Get(chapter);

            BuildGameplayScene();
            KoreanFontSetup.ApplyToAll();
        }

        private void EnsureEventSystem()
        {
            if (FindFirstObjectByType<EventSystem>() != null) return;

            var go = new GameObject("EventSystem");
            go.AddComponent<EventSystem>();
            go.AddComponent<InputSystemUIInputModule>();
        }

        private void BuildGameplayScene()
        {
            BuildTilemap();
            var player = BuildPlayer();
            SetupCamera(player.transform);
            InitializeNPCOrder();
            SpawnNPCs();
            SpawnEnvironment();
            SpawnCollectibles();
            SpawnChapterExit();
            BuildDialogueUI();
            BuildExplorationHUD();
            BuildChapterIntro();
            BuildObjectiveArrow(player.transform);
            LoadInkStory();
            BuildToastUI();
            BuildPauseMenu();
            BuildJourneyMap();

            ThemeLighting.ApplyLitMaterialToAll();
            ApplySafeAreaToCanvases();

            var envAnimGo = new GameObject("EnvironmentAnimator");
            var envAnim = envAnimGo.AddComponent<Visuals.EnvironmentAnimator>();
            envAnim.Initialize(_chapterData.Theme);

            var parallaxGo = new GameObject("ParallaxBackground");
            var parallax = parallaxGo.AddComponent<Visuals.ParallaxBackground>();
            parallax.Initialize(_chapterData.Theme);

            var gm = GameManager.Instance;
            if (gm != null && gm.CurrentState != GameState.Gameplay)
                gm.SetState(GameState.Gameplay);
        }

        private void InitializeNPCOrder()
        {
            var orderMgr = FindFirstObjectByType<NPCOrderManager>();
            if (orderMgr == null)
            {
                var go = new GameObject("NPCOrderManager");
                orderMgr = go.AddComponent<NPCOrderManager>();
            }
            orderMgr.Initialize(_chapterData.NPCs);
        }

        private void BuildObjectiveArrow(Transform player)
        {
            var canvasGo = GameObject.Find("HUDCanvas");
            if (canvasGo == null) return;

            var arrow = canvasGo.AddComponent<ObjectiveArrow>();
            arrow.Initialize(player);
        }

        private void BuildChapterIntro()
        {
            var canvasGo = new GameObject("ChapterIntroCanvas");
            var canvas = canvasGo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 50;
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();

            var introUI = canvasGo.AddComponent<ChapterIntroUI>();
            introUI.Show(_chapterData);
        }

        private void BuildTilemap()
        {
            var gridGo = new GameObject("Grid");
            gridGo.AddComponent<Grid>();

            var groundGo = new GameObject("Ground");
            groundGo.transform.SetParent(gridGo.transform);
            var groundMap = groundGo.AddComponent<Tilemap>();
            groundGo.AddComponent<TilemapRenderer>().sortingOrder = 0;

            var wallGo = new GameObject("Walls");
            wallGo.transform.SetParent(gridGo.transform);
            var wallMap = wallGo.AddComponent<Tilemap>();
            var wallRenderer = wallGo.AddComponent<TilemapRenderer>();
            wallRenderer.sortingOrder = 1;

            var tileGen = gridGo.AddComponent<PlaceholderTileGenerator>();
            SetField(tileGen, "_groundTilemap", groundMap);
            SetField(tileGen, "_wallTilemap", wallMap);
            SetField(tileGen, "_width", _chapterData.MapWidth);
            SetField(tileGen, "_height", _chapterData.MapHeight);
            SetField(tileGen, "_theme", _chapterData.Theme);
        }

        private GameObject BuildPlayer()
        {
            var playerGo = new GameObject("Player");
            playerGo.transform.position = _chapterData.PlayerSpawn;
            playerGo.layer = LayerMask.NameToLayer("Default");

            var sr = playerGo.AddComponent<SpriteRenderer>();
            sr.sortingOrder = 10;

            var rb = playerGo.AddComponent<Rigidbody2D>();
            rb.gravityScale = 0f;
            rb.freezeRotation = true;
            rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;

            var col = playerGo.AddComponent<BoxCollider2D>();
            col.size = new Vector2(0.8f, 0.8f);

            playerGo.AddComponent<PlaceholderPlayerSetup>();
            playerGo.AddComponent<PlayerAnimator>();
            playerGo.AddComponent<PlayerStatVisuals>();
            playerGo.AddComponent<PlayerInputHandler>();
            playerGo.AddComponent<PlayerController>();

            return playerGo;
        }

        private void SetupCamera(Transform playerTransform)
        {
            var cam = Camera.main;
            if (cam == null)
            {
                var camGo = new GameObject("MainCamera");
                camGo.tag = "MainCamera";
                cam = camGo.AddComponent<Camera>();
                cam.orthographic = true;
                cam.orthographicSize = 5f;
                cam.backgroundColor = new Color(0.05f, 0.05f, 0.1f);
                camGo.AddComponent<AudioListener>();
            }

            var topDown = cam.gameObject.GetComponent<TopDownCamera>();
            if (topDown == null)
                topDown = cam.gameObject.AddComponent<TopDownCamera>();

            topDown.SetTarget(playerTransform);
            float halfW = _chapterData.MapWidth / 2f;
            float halfH = _chapterData.MapHeight / 2f;
            topDown.SetBounds(new Vector2(-halfW, -halfH), new Vector2(halfW, halfH));
        }

        private void SpawnNPCs()
        {
            if (_chapterData.NPCs == null) return;

            foreach (var npc in _chapterData.NPCs)
            {
                SpawnNPC(npc.Name, npc.NpcId, npc.InkKnot, npc.Position);
            }
        }

        private void SpawnNPC(string name, string npcId, string inkKnot, Vector3 position)
        {
            var npcGo = new GameObject($"NPC_{name}");
            npcGo.transform.position = position;
            npcGo.layer = LayerMask.NameToLayer("Default");

            var sr = npcGo.AddComponent<SpriteRenderer>();
            sr.sortingOrder = 10;

            var setup = npcGo.AddComponent<Interaction.PlaceholderNPCSetup>();
            setup.SetNpcId(npcId);

            var interactable = npcGo.AddComponent<Interaction.NPCInteractable>();
            SetField(interactable, "_npcId", npcId);
            SetField(interactable, "_inkKnotName", inkKnot);
            SetField(interactable, "_displayNameKey", $"npc_{npcId}");
            SetField(interactable, "_spriteRenderer", sr);

            var personality = Visuals.NPCBehavior.GetPersonalityForNPC(npcId);
            var behavior = npcGo.AddComponent<Visuals.NPCBehavior>();
            behavior.Initialize(npcId, personality);
        }

        private void SpawnEnvironment()
        {
            var theme = _chapterData.Theme;
            var rng = new System.Random(_chapterData.ChapterNumber * 42);

            int halfW = _chapterData.MapWidth / 2 - 3;
            int halfH = _chapterData.MapHeight / 2 - 3;

            var envParent = new GameObject("Environment");

            // Pre-create sprite variants
            Sprite[] treeSprites = new Sprite[4];
            for (int i = 0; i < 4; i++)
                treeSprites[i] = Visuals.ProceduralAssets.CreateTreeSprite(i, theme);

            Sprite[] rockSprites = new Sprite[3];
            for (int i = 0; i < 3; i++)
                rockSprites[i] = Visuals.ProceduralAssets.CreateRockSprite(i, theme);

            Sprite[] bushSprites = new Sprite[3];
            for (int i = 0; i < 3; i++)
                bushSprites[i] = Visuals.ProceduralAssets.CreateBushSprite(i, theme);

            Sprite[] flowerSprites = new Sprite[4];
            for (int i = 0; i < 4; i++)
                flowerSprites[i] = Visuals.ProceduralAssets.CreateFlowerPropSprite(i);

            var tallGrass = Visuals.ProceduralAssets.CreateTallGrassSprite(theme);

            int treeCount = GetTreeCount(theme);
            int rockCount = GetRockCount(theme);
            int bushCount = GetBushCount(theme);
            int flowerCount = GetFlowerCount(theme);
            int grassCount = GetTallGrassCount(theme);

            SpawnProps(envParent.transform, "Tree", treeSprites, treeCount, rng, halfW, halfH, 5);
            SpawnProps(envParent.transform, "Rock", rockSprites, rockCount, rng, halfW, halfH, 4);
            SpawnProps(envParent.transform, "Bush", bushSprites, bushCount, rng, halfW, halfH, 3);
            SpawnProps(envParent.transform, "Flower", flowerSprites, flowerCount, rng, halfW, halfH, 3);
            SpawnProps(envParent.transform, "TallGrass", new[] { tallGrass }, grassCount, rng, halfW, halfH, 2);

            // Theme-specific props
            if (theme == MapTheme.City || theme == MapTheme.Market)
            {
                var lantern = Visuals.ProceduralAssets.CreateLanternSprite();
                SpawnProps(envParent.transform, "Lantern", new[] { lantern },
                    Mathf.Max(4, _chapterData.MapWidth / 6), rng, halfW, halfH, 6);

                var fence = Visuals.ProceduralAssets.CreateFenceSprite();
                SpawnProps(envParent.transform, "Fence", new[] { fence }, 3, rng, halfW, halfH, 3);
            }

            if (theme == MapTheme.DarkValley)
            {
                var grave = Visuals.ProceduralAssets.CreateGravestone();
                SpawnProps(envParent.transform, "Grave", new[] { grave }, 4, rng, halfW, halfH, 4);

                var mushroom0 = Visuals.ProceduralAssets.CreateMushroomSprite(0);
                var mushroom1 = Visuals.ProceduralAssets.CreateMushroomSprite(1);
                SpawnProps(envParent.transform, "Mushroom", new[] { mushroom0, mushroom1 }, 6, rng, halfW, halfH, 3);
            }

            if (theme == MapTheme.Hill || theme == MapTheme.Celestial)
            {
                var cross = Visuals.ProceduralAssets.CreateCrossMonumentSprite();
                SpawnSingle(envParent.transform, "CrossMonument", cross,
                    _chapterData.ExitPosition + new Vector3(-3, 2, 0), 6);
            }

            // Signpost near spawn
            var signSprite = Visuals.ProceduralAssets.CreateSignpostSprite(theme);
            SpawnSingle(envParent.transform, "Signpost", signSprite,
                _chapterData.PlayerSpawn + new Vector3(2, 1, 0), 5);

            // Atmosphere overlay
            SpawnAtmosphere(theme);
        }

        private void SpawnProps(Transform parent, string baseName, Sprite[] sprites,
            int count, System.Random rng, int halfW, int halfH, int sortOrder)
        {
            for (int i = 0; i < count; i++)
            {
                float x = rng.Next(-halfW * 10, halfW * 10) / 10f;
                float y = rng.Next(-halfH * 10, halfH * 10) / 10f;

                if (IsTooCloseToKey(x, y)) continue;
                if (IsOnPath(x, y)) continue;

                var go = new GameObject($"{baseName}_{i}");
                go.transform.SetParent(parent, false);
                go.transform.position = new Vector3(x, y, 0);
                var sr = go.AddComponent<SpriteRenderer>();
                sr.sprite = sprites[rng.Next(sprites.Length)];
                sr.sortingOrder = sortOrder;

                if (baseName == "TallGrass" || baseName == "Flower")
                    sr.color = new Color(1f, 1f, 1f, 0.85f + (float)rng.NextDouble() * 0.15f);
            }
        }

        private void SpawnSingle(Transform parent, string name, Sprite sprite, Vector3 pos, int sortOrder)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            go.transform.position = pos;
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = sprite;
            sr.sortingOrder = sortOrder;
        }

        private bool IsTooCloseToKey(float x, float y)
        {
            var pos2D = new Vector2(x, y);
            if (Vector2.Distance(pos2D, (Vector2)_chapterData.PlayerSpawn) < 3f) return true;
            if (Vector2.Distance(pos2D, (Vector2)_chapterData.ExitPosition) < 3f) return true;
            if (_chapterData.NPCs != null)
            {
                foreach (var npc in _chapterData.NPCs)
                {
                    if (Vector2.Distance(pos2D, (Vector2)npc.Position) < 2f) return true;
                }
            }
            return false;
        }

        private bool IsOnPath(float x, float y)
        {
            return Mathf.Abs(y) <= 1.5f && Mathf.Abs(x) < _chapterData.MapWidth / 2f - 2;
        }

        private int GetTreeCount(MapTheme theme)
        {
            switch (theme)
            {
                case MapTheme.Interior: return 0;
                case MapTheme.City: return 4;
                case MapTheme.Market: return 3;
                case MapTheme.DarkValley: return 10;
                case MapTheme.Celestial: return 8;
                default: return Mathf.Clamp(_chapterData.MapWidth / 3, 6, 18);
            }
        }

        private int GetRockCount(MapTheme theme)
        {
            switch (theme)
            {
                case MapTheme.Interior: return 0;
                case MapTheme.DarkValley: return 8;
                case MapTheme.Hill: return 10;
                case MapTheme.Castle: return 6;
                default: return 4;
            }
        }

        private int GetBushCount(MapTheme theme)
        {
            switch (theme)
            {
                case MapTheme.Interior: return 0;
                case MapTheme.DarkValley: return 5;
                case MapTheme.Celestial: return 8;
                default: return 6;
            }
        }

        private int GetFlowerCount(MapTheme theme)
        {
            switch (theme)
            {
                case MapTheme.Interior: return 0;
                case MapTheme.DarkValley: return 1;
                case MapTheme.Celestial: return 15;
                case MapTheme.Hill: return 12;
                default: return 6;
            }
        }

        private int GetTallGrassCount(MapTheme theme)
        {
            switch (theme)
            {
                case MapTheme.Interior: return 0;
                case MapTheme.City: return 2;
                case MapTheme.Celestial: return 10;
                default: return 8;
            }
        }

        private void SpawnAtmosphere(MapTheme theme)
        {
            var cam = Camera.main;
            if (cam == null) return;

            var profile = ThemeLighting.GetProfile(theme);
            cam.backgroundColor = profile.CameraBackground;

            var lightingRoot = new GameObject("Lighting");
            ThemeLighting.CreateGlobalLight(lightingRoot.transform, profile);

            if (profile.PlayerTorch)
            {
                var player = FindFirstObjectByType<PlayerController>();
                if (player != null)
                    ThemeLighting.CreatePlayerTorch(player.transform, profile);
            }

            if (theme == MapTheme.DarkValley)
            {
                var fogGo = new GameObject("FogOverlay");
                fogGo.transform.SetParent(cam.transform);
                fogGo.transform.localPosition = new Vector3(0, 0, 5);
                var sr = fogGo.AddComponent<SpriteRenderer>();
                sr.sprite = CreateFogSprite();
                sr.sortingOrder = 90;
                sr.color = new Color(0.15f, 0.12f, 0.18f, 0.15f);
                sr.transform.localScale = new Vector3(20, 12, 1);
                sr.material = new Material(Shader.Find("Sprites/Default"));
            }
            else if (theme == MapTheme.Celestial)
            {
                var glowGo = new GameObject("CelestialGlow");
                glowGo.transform.SetParent(cam.transform);
                glowGo.transform.localPosition = new Vector3(0, 0, 5);
                var sr = glowGo.AddComponent<SpriteRenderer>();
                sr.sprite = CreateGlowSprite();
                sr.sortingOrder = 90;
                sr.color = new Color(1f, 0.95f, 0.75f, 0.06f);
                sr.transform.localScale = new Vector3(20, 12, 1);
            }

            AddLightsToProps(theme);
        }

        private void AddLightsToProps(MapTheme theme)
        {
            foreach (var lantern in GameObject.FindObjectsByType<SpriteRenderer>(FindObjectsSortMode.None))
            {
                if (lantern.gameObject.name.StartsWith("Lantern"))
                    ThemeLighting.CreateLanternLight(lantern.transform);
            }
        }

        private static Sprite CreateFogSprite()
        {
            int w = 64, h = 64;
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            var rng = new System.Random(999);
            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    float nx = (float)x / w;
                    float ny = (float)y / h;
                    float p = Mathf.PerlinNoise(nx * 4f, ny * 4f);
                    float p2 = Mathf.PerlinNoise(nx * 8f + 5f, ny * 8f + 5f);
                    float a = (p * 0.6f + p2 * 0.4f) * 0.5f;
                    float edge = Mathf.Min(nx, 1 - nx, ny, 1 - ny) * 4f;
                    a *= Mathf.Clamp01(edge);
                    tex.SetPixel(x, y, new Color(1, 1, 1, a));
                }
            }
            tex.Apply();
            tex.filterMode = FilterMode.Bilinear;
            return Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), 16f);
        }

        private static Sprite CreateGlowSprite()
        {
            int w = 64, h = 64;
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            float cx = w / 2f, cy = h / 2f;
            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    float dx = (x - cx) / cx;
                    float dy = (y - cy) / cy;
                    float dist = Mathf.Sqrt(dx * dx + dy * dy);
                    float a = Mathf.Max(0, 1f - dist) * 0.3f;
                    tex.SetPixel(x, y, new Color(1, 1, 1, a));
                }
            }
            tex.Apply();
            tex.filterMode = FilterMode.Bilinear;
            return Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), 16f);
        }

        private void SpawnCollectibles()
        {
            Interaction.CollectibleSpawner.SpawnForChapter(_chapterData);
        }

        private void SpawnChapterExit()
        {
            var exitGo = new GameObject("ChapterExit");
            exitGo.transform.position = _chapterData.ExitPosition;

            var sr = exitGo.AddComponent<SpriteRenderer>();
            bool isFinal = _chapterData.ChapterNumber >= ChapterManager.TotalChapters;
            sr.sprite = isFinal
                ? ProceduralAssets.CreateGateSprite(MapTheme.Celestial)
                : ProceduralAssets.CreateGateSprite(_chapterData.Theme);
            sr.sortingOrder = 6;

            exitGo.AddComponent<Interaction.ChapterExitInteractable>();

            ThemeLighting.CreateExitGlow(exitGo.transform, _chapterData.Theme);
        }

        private void BuildDialogueUI()
        {
            var canvasGo = new GameObject("DialogueCanvas");
            var canvas = canvasGo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 20;
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();

            var panelSprite = Visuals.ProceduralAssets.CreatePanelSprite();

            var panelGo = new GameObject("DialoguePanel");
            panelGo.transform.SetParent(canvasGo.transform, false);
            var panelImg = panelGo.AddComponent<Image>();
            panelImg.sprite = panelSprite;
            panelImg.type = Image.Type.Sliced;
            panelImg.color = Color.white;
            var panelRt = panelImg.rectTransform;
            panelRt.anchorMin = new Vector2(0.04f, 0.02f);
            panelRt.anchorMax = new Vector2(0.96f, 0.30f);
            panelRt.sizeDelta = Vector2.zero;
            panelRt.anchoredPosition = Vector2.zero;

            var speakerPlate = new GameObject("SpeakerPlate");
            speakerPlate.transform.SetParent(panelGo.transform, false);
            var plateImg = speakerPlate.AddComponent<Image>();
            plateImg.color = new Color(0.12f, 0.10f, 0.18f, 0.95f);
            var plateRt = plateImg.rectTransform;
            plateRt.anchorMin = new Vector2(0.02f, 0.84f);
            plateRt.anchorMax = new Vector2(0.28f, 1.06f);
            plateRt.sizeDelta = Vector2.zero;
            plateRt.anchoredPosition = Vector2.zero;

            var speakerName = CreateTMP(speakerPlate.transform, "SpeakerName", 20,
                new Color(0.90f, 0.78f, 0.45f), Vector2.zero, Vector2.one, "");
            speakerName.fontStyle = FontStyles.Bold;

            var dialogueText = CreateTMP(panelGo.transform, "DialogueText", 22,
                Color.white, new Vector2(0.04f, 0.10f), new Vector2(0.96f, 0.78f), "");
            dialogueText.alignment = TextAlignmentOptions.TopLeft;

            var continueGo = new GameObject("ContinueIndicator");
            continueGo.transform.SetParent(panelGo.transform, false);
            var contTmp = continueGo.AddComponent<TextMeshProUGUI>();
            contTmp.text = "\u25BC";
            contTmp.fontSize = 18;
            contTmp.color = new Color(1, 1, 1, 0.5f);
            contTmp.alignment = TextAlignmentOptions.BottomRight;
            var contRt = contTmp.rectTransform;
            contRt.anchorMin = new Vector2(0.90f, 0.02f);
            contRt.anchorMax = new Vector2(0.98f, 0.15f);
            contRt.sizeDelta = Vector2.zero;
            contRt.anchoredPosition = Vector2.zero;

            var continueBtnGo = new GameObject("ContinueButton");
            continueBtnGo.transform.SetParent(panelGo.transform, false);
            var cbImg = continueBtnGo.AddComponent<Image>();
            cbImg.color = Color.clear;
            var cbRt = cbImg.rectTransform;
            cbRt.anchorMin = Vector2.zero;
            cbRt.anchorMax = Vector2.one;
            cbRt.sizeDelta = Vector2.zero;
            cbRt.anchoredPosition = Vector2.zero;
            var continueBtn = continueBtnGo.AddComponent<Button>();

            var choiceContainer = new GameObject("ChoiceContainer");
            choiceContainer.transform.SetParent(canvasGo.transform, false);
            var choiceRt = choiceContainer.AddComponent<RectTransform>();
            choiceRt.anchorMin = new Vector2(0.20f, 0.32f);
            choiceRt.anchorMax = new Vector2(0.80f, 0.65f);
            choiceRt.sizeDelta = Vector2.zero;
            choiceRt.anchoredPosition = Vector2.zero;

            var choiceButtons = new Button[4];
            var choiceTexts = new TextMeshProUGUI[4];
            for (int i = 0; i < 4; i++)
            {
                float cy = 1f - (i * 0.26f);
                var cBtn = CreateButton(choiceContainer.transform, $"Choice{i}",
                    new Vector2(0, cy - 0.22f), new Vector2(1, cy),
                    new Color(0.10f, 0.12f, 0.22f, 0.90f), out var cLabel);
                cLabel.fontSize = 20;
                cLabel.color = new Color(0.90f, 0.85f, 0.70f);
                cLabel.alignment = TextAlignmentOptions.MidlineLeft;
                choiceButtons[i] = cBtn;
                choiceTexts[i] = cLabel;
            }
            choiceContainer.SetActive(false);

            var locText = CreateTMP(canvasGo.transform, "LocationText", 16,
                new Color(0.7f, 0.65f, 0.55f),
                new Vector2(0.35f, 0.92f), new Vector2(0.65f, 0.98f), "");

            var dialogueUI = canvasGo.AddComponent<DialogueUI>();
            SetField(dialogueUI, "_dialoguePanel", panelGo);
            SetField(dialogueUI, "_speakerNameText", speakerName);
            SetField(dialogueUI, "_dialogueText", dialogueText);
            SetField(dialogueUI, "_speakerPlate", speakerPlate);
            SetField(dialogueUI, "_dialogueBoxImage", panelImg);
            SetField(dialogueUI, "_continueButton", continueBtn);
            SetField(dialogueUI, "_continueIndicator", continueGo);
            SetField(dialogueUI, "_choiceContainer", choiceContainer);
            SetField(dialogueUI, "_choiceButtons", choiceButtons);
            SetField(dialogueUI, "_choiceTexts", choiceTexts);
            SetField(dialogueUI, "_locationText", locText);
        }

        private void BuildExplorationHUD()
        {
            var canvasGo = new GameObject("HUDCanvas");
            var canvas = canvasGo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 15;
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();

            var cg = canvasGo.AddComponent<CanvasGroup>();

            float barW = 0.12f;
            float barH = 0.012f;
            float startY = 0.95f;
            float step = 0.035f;

            var faithLabel = CreateTMP(canvasGo.transform, "FaithLabel", 14,
                new Color(0.9f, 0.8f, 0.4f),
                new Vector2(0.02f, startY - 0.005f), new Vector2(0.07f, startY + 0.015f), "Faith");
            faithLabel.alignment = TextAlignmentOptions.MidlineLeft;

            var faithBarBg = CreateImage(canvasGo.transform, "FaithBarBg",
                new Vector2(0.075f, startY), new Vector2(0.075f + barW, startY + barH),
                new Color(0.2f, 0.2f, 0.2f));
            var faithBar = CreateImage(faithBarBg.transform, "FaithBar",
                Vector2.zero, new Vector2(0.3f, 1f), new Color(0.9f, 0.8f, 0.3f));
            faithBar.type = Image.Type.Filled;
            faithBar.fillMethod = Image.FillMethod.Horizontal;

            startY -= step;
            var courageLabel = CreateTMP(canvasGo.transform, "CourageLabel", 14,
                new Color(0.4f, 0.7f, 0.9f),
                new Vector2(0.02f, startY - 0.005f), new Vector2(0.07f, startY + 0.015f), "Courage");
            courageLabel.alignment = TextAlignmentOptions.MidlineLeft;

            var courageBarBg = CreateImage(canvasGo.transform, "CourageBarBg",
                new Vector2(0.075f, startY), new Vector2(0.075f + barW, startY + barH),
                new Color(0.2f, 0.2f, 0.2f));
            var courageBar = CreateImage(courageBarBg.transform, "CourageBar",
                Vector2.zero, new Vector2(0.2f, 1f), new Color(0.3f, 0.6f, 0.9f));
            courageBar.type = Image.Type.Filled;
            courageBar.fillMethod = Image.FillMethod.Horizontal;

            startY -= step;
            var wisdomLabel = CreateTMP(canvasGo.transform, "WisdomLabel", 14,
                new Color(0.5f, 0.9f, 0.5f),
                new Vector2(0.02f, startY - 0.005f), new Vector2(0.07f, startY + 0.015f), "Wisdom");
            wisdomLabel.alignment = TextAlignmentOptions.MidlineLeft;

            var wisdomBarBg = CreateImage(canvasGo.transform, "WisdomBarBg",
                new Vector2(0.075f, startY), new Vector2(0.075f + barW, startY + barH),
                new Color(0.2f, 0.2f, 0.2f));
            var wisdomBar = CreateImage(wisdomBarBg.transform, "WisdomBar",
                Vector2.zero, new Vector2(0.2f, 1f), new Color(0.4f, 0.8f, 0.4f));
            wisdomBar.type = Image.Type.Filled;
            wisdomBar.fillMethod = Image.FillMethod.Horizontal;

            var burdenText = CreateTMP(canvasGo.transform, "BurdenText", 16,
                new Color(0.8f, 0.6f, 0.3f),
                new Vector2(0.88f, 0.93f), new Vector2(0.98f, 0.97f), "80");
            burdenText.alignment = TextAlignmentOptions.MidlineRight;

            var lm = ServiceLocator.TryGet<Localization.LocalizationManager>(out var locMgr) ? locMgr : null;
            bool isKo = lm != null && lm.CurrentLanguage == "ko";

            string locationDisplay = _chapterData != null
                ? $"Ch.{_chapterData.ChapterNumber} {(isKo ? _chapterData.NameKR : _chapterData.NameEN)}"
                : "";
            var locationName = CreateTMP(canvasGo.transform, "LocationName", 18,
                Color.white,
                new Vector2(0.30f, 0.93f), new Vector2(0.70f, 0.98f), locationDisplay);

            canvasGo.AddComponent<ObjectiveHUDText>().Initialize(_chapterData);

            BuildMiniJourneyBar(canvasGo.transform);

            var hud = canvasGo.AddComponent<ExplorationHUD>();
            SetField(hud, "_faithBar", faithBar);
            SetField(hud, "_courageBar", courageBar);
            SetField(hud, "_wisdomBar", wisdomBar);
            SetField(hud, "_faithLabel", faithLabel);
            SetField(hud, "_courageLabel", courageLabel);
            SetField(hud, "_wisdomLabel", wisdomLabel);
            SetField(hud, "_burdenText", burdenText);
            SetField(hud, "_locationName", locationName);
            SetField(hud, "_canvasGroup", cg);
        }

        private void BuildToastUI()
        {
            var canvasGo = GameObject.Find("HUDCanvas");
            if (canvasGo == null) return;
            canvasGo.AddComponent<ToastUI>();
            canvasGo.AddComponent<BuffIconDisplay>();
            canvasGo.AddComponent<Visuals.ScreenFlash>();

            var fxGo = new GameObject("DialogueEffectsManager");
            var fxMgr = fxGo.AddComponent<DialogueEffectsManager>();
            fxMgr.Initialize();
        }

        private void BuildMiniJourneyBar(Transform parent)
        {
            int current = _chapterData.ChapterNumber;
            int total = ChapterManager.TotalChapters;

            var container = new GameObject("MiniJourney");
            container.transform.SetParent(parent, false);
            var crt = container.AddComponent<RectTransform>();
            crt.anchorMin = new Vector2(0.35f, 0.975f);
            crt.anchorMax = new Vector2(0.65f, 0.99f);
            crt.sizeDelta = Vector2.zero;

            float dotWidth = 1.0f / total;
            for (int i = 0; i < total; i++)
            {
                float x = i * dotWidth + dotWidth * 0.1f;
                float xEnd = x + dotWidth * 0.7f;

                var dotGo = new GameObject($"Dot{i + 1}");
                dotGo.transform.SetParent(container.transform, false);
                var dotImg = dotGo.AddComponent<Image>();

                bool completed = (i + 1) < current;
                bool isCurrent = (i + 1) == current;

                Color dotColor;
                if (completed) dotColor = new Color(0.35f, 0.70f, 0.40f, 0.7f);
                else if (isCurrent) dotColor = new Color(1f, 0.92f, 0.55f, 0.9f);
                else dotColor = new Color(0.3f, 0.3f, 0.3f, 0.3f);

                dotImg.color = dotColor;
                dotImg.raycastTarget = false;
                var drt = dotImg.rectTransform;
                drt.anchorMin = new Vector2(x, 0.1f);
                drt.anchorMax = new Vector2(xEnd, 0.9f);
                drt.sizeDelta = Vector2.zero;
            }

            // Tab hint
            var lm = ServiceLocator.TryGet<Localization.LocalizationManager>(out var locMgr) ? locMgr : null;
            bool isKo = lm != null && lm.CurrentLanguage == "ko";
            string tabHint = isKo ? "[TAB] 여정 지도" : "[TAB] Journey Map";
            var hintGo = new GameObject("TabHint");
            hintGo.transform.SetParent(parent, false);
            var hintTmp = hintGo.AddComponent<TextMeshProUGUI>();
            hintTmp.text = tabHint;
            hintTmp.fontSize = 11;
            hintTmp.color = new Color(0.5f, 0.5f, 0.5f, 0.5f);
            hintTmp.alignment = TextAlignmentOptions.MidlineRight;
            hintTmp.raycastTarget = false;
            var hrt = hintTmp.rectTransform;
            hrt.anchorMin = new Vector2(0.65f, 0.975f);
            hrt.anchorMax = new Vector2(0.80f, 0.995f);
            hrt.sizeDelta = Vector2.zero;
            hrt.anchoredPosition = Vector2.zero;
        }

        private void BuildPauseMenu()
        {
            var pauseGo = new GameObject("PauseMenu");
            pauseGo.AddComponent<PauseMenuUI>();
        }

        private void BuildJourneyMap()
        {
            var journeyGo = new GameObject("JourneyMap");
            journeyGo.AddComponent<JourneyMapUI>();
        }

        private void LoadInkStory()
        {
            var inkJson = Resources.Load<TextAsset>("InkStory");
            if (inkJson == null)
            {
                Debug.LogWarning("[GameplaySetup] InkStory not found in Resources.");
            }

            if (inkJson != null)
            {
                var inkService = ServiceLocator.Get<InkService>();
                if (inkService != null)
                {
                    inkService.LoadStory(inkJson);
                    Debug.Log("[GameplaySetup] Ink story loaded successfully.");
                }
            }

            var ctrlGo = new GameObject("DialogueController");
            ctrlGo.AddComponent<DialogueController>();
        }

        private TextMeshProUGUI CreateTMP(Transform parent, string name, int size,
            Color color, Vector2 anchorMin, Vector2 anchorMax, string text)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var tmp = go.AddComponent<TextMeshProUGUI>();
            tmp.fontSize = size;
            tmp.color = color;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.text = text;
            var rt = tmp.rectTransform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;
            return tmp;
        }

        private Image CreateImage(Transform parent, string name,
            Vector2 anchorMin, Vector2 anchorMax, Color color)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var img = go.AddComponent<Image>();
            img.color = color;
            var rt = img.rectTransform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;
            return img;
        }

        private Button CreateButton(Transform parent, string name,
            Vector2 anchorMin, Vector2 anchorMax, Color bgColor,
            out TextMeshProUGUI label)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var img = go.AddComponent<Image>();
            img.color = bgColor;
            var rt = img.rectTransform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;

            label = CreateTMP(go.transform, "Label", 20, Color.white,
                Vector2.zero, Vector2.one, "");

            return go.AddComponent<Button>();
        }

        private void ApplySafeAreaToCanvases()
        {
            foreach (var canvas in FindObjectsByType<Canvas>(FindObjectsSortMode.None))
            {
                if (canvas.renderMode == RenderMode.ScreenSpaceOverlay)
                    UI.SafeAreaHandler.EnsureOnCanvas(canvas);
            }
        }

        private static void SetField(object target, string fieldName, object value)
        {
            var field = target.GetType().GetField(fieldName,
                System.Reflection.BindingFlags.NonPublic |
                System.Reflection.BindingFlags.Instance);
            if (field != null)
                field.SetValue(target, value);
        }
    }
}
