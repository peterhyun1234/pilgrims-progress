using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem.UI;
using UnityEngine.Tilemaps;
using TMPro;
using PilgrimsProgress.Core;
using PilgrimsProgress.Player;
using PilgrimsProgress.Narrative;
using PilgrimsProgress.UI;

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
            SpawnNPCs();
            SpawnEnvironment();
            SpawnChapterExit();
            BuildDialogueUI();
            BuildExplorationHUD();
            LoadInkStory();

            var gm = GameManager.Instance;
            if (gm != null && gm.CurrentState != GameState.Gameplay)
                gm.SetState(GameState.Gameplay);
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
            playerGo.AddComponent<PlayerController>();

            return playerGo;
        }

        private void SetupCamera(Transform playerTransform)
        {
            var cam = Camera.main;
            if (cam == null) return;

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
        }

        private void SpawnEnvironment()
        {
            var treeSprite = Visuals.ProceduralAssets.CreateTreeSprite();
            var rng = new System.Random(_chapterData.ChapterNumber * 42);

            int halfW = _chapterData.MapWidth / 2 - 3;
            int halfH = _chapterData.MapHeight / 2 - 3;
            int treeCount = Mathf.Clamp(_chapterData.MapWidth / 4, 4, 15);

            for (int i = 0; i < treeCount; i++)
            {
                float x = rng.Next(-halfW, halfW);
                float y = rng.Next(-halfH, halfH);

                bool tooCloseToSpawn = Vector2.Distance(
                    new Vector2(x, y),
                    (Vector2)_chapterData.PlayerSpawn) < 3f;
                bool tooCloseToExit = Vector2.Distance(
                    new Vector2(x, y),
                    (Vector2)_chapterData.ExitPosition) < 3f;

                if (tooCloseToSpawn || tooCloseToExit) continue;

                var treeGo = new GameObject("Tree");
                treeGo.transform.position = new Vector3(x, y, 0);
                var sr = treeGo.AddComponent<SpriteRenderer>();
                sr.sprite = treeSprite;
                sr.sortingOrder = 5;
            }

            var signSprite = Visuals.ProceduralAssets.CreateSignpostSprite();
            var signGo = new GameObject("Signpost");
            signGo.transform.position = _chapterData.PlayerSpawn + new Vector3(2, 1, 0);
            var signSr = signGo.AddComponent<SpriteRenderer>();
            signSr.sprite = signSprite;
            signSr.sortingOrder = 5;
        }

        private void SpawnChapterExit()
        {
            if (_chapterData.ChapterNumber >= ChapterManager.TotalChapters) return;

            var exitGo = new GameObject("ChapterExit");
            exitGo.transform.position = _chapterData.ExitPosition;

            var sr = exitGo.AddComponent<SpriteRenderer>();
            sr.sprite = Visuals.ProceduralAssets.CreateSignpostSprite();
            sr.sortingOrder = 6;
            sr.color = new Color(0.9f, 0.78f, 0.45f);

            exitGo.AddComponent<Interaction.ChapterExitInteractable>();
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

            string locationDisplay = _chapterData != null
                ? $"Ch.{_chapterData.ChapterNumber} {_chapterData.NameKR}"
                : "";
            var locationName = CreateTMP(canvasGo.transform, "LocationName", 18,
                Color.white,
                new Vector2(0.30f, 0.93f), new Vector2(0.70f, 0.98f), locationDisplay);

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
