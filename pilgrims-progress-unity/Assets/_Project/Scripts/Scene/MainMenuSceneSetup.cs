using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem.UI;
using TMPro;
using PilgrimsProgress.Core;
using PilgrimsProgress.UI;

namespace PilgrimsProgress.Scene
{
    public class MainMenuSceneSetup : MonoBehaviour
    {
        private static readonly Color BgDark = new Color(0.04f, 0.03f, 0.08f);
        private static readonly Color BgMid = new Color(0.08f, 0.06f, 0.14f);
        private static readonly Color Gold = new Color(0.90f, 0.78f, 0.45f);
        private static readonly Color GoldDim = new Color(0.65f, 0.55f, 0.30f);
        private static readonly Color BtnDefault = new Color(0.12f, 0.10f, 0.18f, 0.85f);
        private static readonly Color BtnHighlight = new Color(0.18f, 0.15f, 0.28f, 0.95f);
        private static readonly Color BtnNewGame = new Color(0.15f, 0.28f, 0.18f, 0.90f);
        private static readonly Color BtnNewGameHi = new Color(0.22f, 0.40f, 0.25f, 0.95f);
        private static readonly Color BtnQuit = new Color(0.28f, 0.12f, 0.12f, 0.85f);
        private static readonly Color LangBtn = new Color(0.14f, 0.18f, 0.30f, 0.90f);
        private static readonly Color LangBtnHi = new Color(0.20f, 0.25f, 0.42f, 0.95f);
        private static readonly Color TextMuted = new Color(0.55f, 0.50f, 0.45f);

        private void Start()
        {
            if (FindFirstObjectByType<MainMenuUI>() != null) return;
            EnsureEventSystem();
            BuildMainMenuUI();
            KoreanFontSetup.ApplyToAll();

            foreach (var canvas in FindObjectsByType<Canvas>(FindObjectsSortMode.None))
            {
                if (canvas.renderMode == RenderMode.ScreenSpaceOverlay)
                    SafeAreaHandler.EnsureOnCanvas(canvas);
            }
        }

        private void EnsureEventSystem()
        {
            if (FindFirstObjectByType<EventSystem>() != null) return;
            var go = new GameObject("EventSystem");
            go.AddComponent<EventSystem>();
            go.AddComponent<InputSystemUIInputModule>();
        }

        private void BuildMainMenuUI()
        {
            var canvasGo = new GameObject("MainMenuCanvas");
            var canvas = canvasGo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 10;
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();

            var bgImage = BuildBackground(canvasGo.transform);

            // --- Language Select Panel ---
            var langPanel = CreatePanel(canvasGo.transform, "LanguageSelectPanel");

            var langDecoTop = CreateImage(langPanel.transform, "LangDecoTop",
                new Vector2(0.35f, 0.82f), new Vector2(0.65f, 0.822f), Gold);
            langDecoTop.color = new Color(Gold.r, Gold.g, Gold.b, 0.4f);

            CreateTMP(langPanel.transform, "LangTitle", 42, Gold,
                new Vector2(0.15f, 0.62f), new Vector2(0.85f, 0.78f),
                "Select Language / \uC5B8\uC5B4\uB97C \uC120\uD0DD\uD558\uC138\uC694").fontStyle = FontStyles.Bold;

            var koBtn = CreateStyledButton(langPanel.transform, "KoreanButton",
                new Vector2(0.28f, 0.42f), new Vector2(0.48f, 0.56f),
                LangBtn, LangBtnHi, out var koLabel);
            koLabel.text = "\uD55C\uAD6D\uC5B4";
            koLabel.fontSize = 30;
            koLabel.fontStyle = FontStyles.Bold;

            var enBtn = CreateStyledButton(langPanel.transform, "EnglishButton",
                new Vector2(0.52f, 0.42f), new Vector2(0.72f, 0.56f),
                LangBtn, LangBtnHi, out var enLabel);
            enLabel.text = "English";
            enLabel.fontSize = 30;
            enLabel.fontStyle = FontStyles.Bold;

            // --- Main Buttons Panel ---
            var mainPanel = CreatePanel(canvasGo.transform, "MainButtonsPanel");
            mainPanel.SetActive(false);

            var decoTop = CreateImage(mainPanel.transform, "DecoTop",
                new Vector2(0.30f, 0.91f), new Vector2(0.70f, 0.912f), Gold);
            decoTop.color = new Color(Gold.r, Gold.g, Gold.b, 0.5f);

            var titleText = CreateTMP(mainPanel.transform, "Title", 56, Gold,
                new Vector2(0.05f, 0.78f), new Vector2(0.95f, 0.90f), "");
            titleText.fontStyle = FontStyles.Bold;

            var subtitleText = CreateTMP(mainPanel.transform, "Subtitle", 20, GoldDim,
                new Vector2(0.15f, 0.72f), new Vector2(0.85f, 0.78f), "");
            subtitleText.fontStyle = FontStyles.Italic;

            var decoBot = CreateImage(mainPanel.transform, "DecoBot",
                new Vector2(0.35f, 0.715f), new Vector2(0.65f, 0.717f), Gold);
            decoBot.color = new Color(Gold.r, Gold.g, Gold.b, 0.3f);

            float btnY = 0.61f;
            float btnStep = 0.085f;
            float btnLeft = 0.32f;
            float btnRight = 0.68f;
            float btnHalf = 0.035f;

            var newGameBtn = CreateStyledButton(mainPanel.transform, "NewGameButton",
                new Vector2(btnLeft, btnY - btnHalf), new Vector2(btnRight, btnY + btnHalf),
                BtnNewGame, BtnNewGameHi, out var newGameLabel);
            newGameLabel.fontSize = 26;
            newGameLabel.fontStyle = FontStyles.Bold;
            btnY -= btnStep;

            var continueBtn = CreateStyledButton(mainPanel.transform, "ContinueButton",
                new Vector2(btnLeft, btnY - btnHalf), new Vector2(btnRight, btnY + btnHalf),
                BtnDefault, BtnHighlight, out var continueLabel);
            continueLabel.fontSize = 24;
            btnY -= btnStep;

            var collectionBtn = CreateStyledButton(mainPanel.transform, "CollectionButton",
                new Vector2(btnLeft, btnY - btnHalf), new Vector2(btnRight, btnY + btnHalf),
                BtnDefault, BtnHighlight, out var collectionLabel);
            collectionLabel.fontSize = 24;
            btnY -= btnStep;

            var settingsBtn = CreateStyledButton(mainPanel.transform, "SettingsButton",
                new Vector2(btnLeft, btnY - btnHalf), new Vector2(btnRight, btnY + btnHalf),
                BtnDefault, BtnHighlight, out var settingsLabel);
            settingsLabel.fontSize = 24;
            btnY -= btnStep;

            var langBtn = CreateStyledButton(mainPanel.transform, "LanguageButton",
                new Vector2(btnLeft, btnY - btnHalf), new Vector2(btnRight, btnY + btnHalf),
                BtnDefault, BtnHighlight, out var langLabel);
            langLabel.fontSize = 24;
            btnY -= btnStep;

            var quitBtn = CreateStyledButton(mainPanel.transform, "QuitButton",
                new Vector2(btnLeft, btnY - btnHalf), new Vector2(btnRight, btnY + btnHalf),
                BtnQuit, BtnHighlight, out var quitLabel);
            quitLabel.fontSize = 24;

            var guestLabel = CreateTMP(mainPanel.transform, "GuestLabel", 15,
                TextMuted, new Vector2(0.25f, 0.06f), new Vector2(0.75f, 0.11f), "");

            var versionText = CreateTMP(canvasGo.transform, "VersionText", 12,
                new Color(0.4f, 0.38f, 0.35f, 0.6f),
                new Vector2(0.78f, 0.01f), new Vector2(0.99f, 0.04f),
                "v0.9.0");
            versionText.alignment = TextAlignmentOptions.BottomRight;

            var settingsPanel = CreatePanel(canvasGo.transform, "SettingsPanel");
            settingsPanel.SetActive(false);

            // --- Wire up MainMenuUI ---
            var menuUI = canvasGo.AddComponent<MainMenuUI>();
            SetPrivateField(menuUI, "_titleText", titleText);
            SetPrivateField(menuUI, "_subtitleText", subtitleText);
            SetPrivateField(menuUI, "_newGameButton", newGameBtn);
            SetPrivateField(menuUI, "_continueButton", continueBtn);
            SetPrivateField(menuUI, "_collectionButton", collectionBtn);
            SetPrivateField(menuUI, "_settingsButton", settingsBtn);
            SetPrivateField(menuUI, "_languageButton", langBtn);
            SetPrivateField(menuUI, "_quitButton", quitBtn);
            SetPrivateField(menuUI, "_newGameLabel", newGameLabel);
            SetPrivateField(menuUI, "_continueLabel", continueLabel);
            SetPrivateField(menuUI, "_collectionLabel", collectionLabel);
            SetPrivateField(menuUI, "_settingsLabel", settingsLabel);
            SetPrivateField(menuUI, "_languageLabel", langLabel);
            SetPrivateField(menuUI, "_quitLabel", quitLabel);
            SetPrivateField(menuUI, "_languageSelectPanel", langPanel);
            SetPrivateField(menuUI, "_settingsPanel", settingsPanel);
            SetPrivateField(menuUI, "_mainButtonsPanel", mainPanel);
            SetPrivateField(menuUI, "_koreanButton", koBtn);
            SetPrivateField(menuUI, "_englishButton", enBtn);
            SetPrivateField(menuUI, "_guestLabel", guestLabel);

            // --- Title Screen Animator ---
            var animator = canvasGo.AddComponent<TitleScreenAnimator>();
            var buttons = new List<Button>
            {
                newGameBtn, continueBtn, collectionBtn,
                settingsBtn, langBtn, quitBtn
            };
            animator.Initialize(
                canvasGo.GetComponent<RectTransform>(),
                titleText, subtitleText, buttons, bgImage);
        }

        private Image BuildBackground(Transform parent)
        {
            var bgTex = Visuals.ProceduralAssets.CreateMenuBackground(480, 270);
            var bgSprite = Sprite.Create(bgTex, new Rect(0, 0, bgTex.width, bgTex.height),
                new Vector2(0.5f, 0.5f));

            var bgGo = new GameObject("Background");
            bgGo.transform.SetParent(parent, false);
            var bgImg = bgGo.AddComponent<Image>();
            bgImg.sprite = bgSprite;
            bgImg.type = Image.Type.Simple;
            bgImg.preserveAspect = false;
            bgImg.raycastTarget = false;
            var bgRt = bgImg.rectTransform;
            bgRt.anchorMin = Vector2.zero;
            bgRt.anchorMax = Vector2.one;
            bgRt.sizeDelta = new Vector2(30f, 20f);

            BuildVignette(parent);

            return bgImg;
        }

        private void BuildVignette(Transform parent)
        {
            var vigGo = new GameObject("Vignette");
            vigGo.transform.SetParent(parent, false);
            var vigImg = vigGo.AddComponent<Image>();
            vigImg.raycastTarget = false;

            int size = 64;
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            float cx = size / 2f, cy = size / 2f;
            float maxDist = Mathf.Sqrt(cx * cx + cy * cy);
            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    float dx = x - cx, dy = y - cy;
                    float dist = Mathf.Sqrt(dx * dx + dy * dy) / maxDist;
                    float alpha = Mathf.Clamp01(dist * dist * 0.8f);
                    tex.SetPixel(x, y, new Color(0f, 0f, 0f, alpha));
                }
            }
            tex.Apply();
            tex.filterMode = FilterMode.Bilinear;
            vigImg.sprite = Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f));
            vigImg.type = Image.Type.Simple;
            vigImg.preserveAspect = false;

            var rt = vigImg.rectTransform;
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.sizeDelta = Vector2.zero;
        }

        private GameObject CreatePanel(Transform parent, string name)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;
            return go;
        }

        private Image CreateImage(Transform parent, string name,
            Vector2 anchorMin, Vector2 anchorMax, Color color)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var img = go.AddComponent<Image>();
            img.color = color;
            img.raycastTarget = false;
            var rt = img.rectTransform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;
            return img;
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
            tmp.enableWordWrapping = true;
            tmp.overflowMode = TextOverflowModes.Ellipsis;
            var rt = tmp.rectTransform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;
            return tmp;
        }

        private Button CreateStyledButton(Transform parent, string name,
            Vector2 anchorMin, Vector2 anchorMax,
            Color normalColor, Color highlightColor,
            out TextMeshProUGUI label)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var img = go.AddComponent<Image>();
            img.color = normalColor;
            var rt = img.rectTransform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;

            label = CreateTMP(go.transform, "Label", 24, Color.white,
                Vector2.zero, Vector2.one, "");

            var btn = go.AddComponent<Button>();
            var colors = btn.colors;
            colors.normalColor = Color.white;
            colors.highlightedColor = new Color(1.2f, 1.2f, 1.2f);
            colors.pressedColor = new Color(0.8f, 0.8f, 0.8f);
            colors.selectedColor = Color.white;
            colors.fadeDuration = 0.1f;
            btn.colors = colors;

            // Button hover: tint the Image color through ColorBlock
            img.color = normalColor;
            btn.targetGraphic = img;

            return btn;
        }

        private static void SetPrivateField(object target, string fieldName, object value)
        {
            var field = target.GetType().GetField(fieldName,
                System.Reflection.BindingFlags.NonPublic |
                System.Reflection.BindingFlags.Instance);
            if (field != null)
                field.SetValue(target, value);
        }
    }
}
