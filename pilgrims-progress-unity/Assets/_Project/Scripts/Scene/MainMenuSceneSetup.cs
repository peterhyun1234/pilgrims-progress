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

            BuildBackground(canvasGo.transform);

            // --- Language Select Panel ---
            var langPanel = CreatePanel(canvasGo.transform, "LanguageSelectPanel");

            var langDecoTop = CreateImage(langPanel.transform, "LangDecoTop",
                new Vector2(0.35f, 0.82f), new Vector2(0.65f, 0.822f), Gold);
            langDecoTop.color = new Color(Gold.r, Gold.g, Gold.b, 0.4f);

            CreateTMP(langPanel.transform, "LangTitle", 42, Gold,
                new Vector2(0.15f, 0.62f), new Vector2(0.85f, 0.78f),
                "Select Language / 언어를 선택하세요").fontStyle = FontStyles.Bold;

            var koBtn = CreateStyledButton(langPanel.transform, "KoreanButton",
                new Vector2(0.28f, 0.42f), new Vector2(0.48f, 0.56f),
                LangBtn, LangBtnHi, out var koLabel);
            koLabel.text = "한국어";
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

            // Decorative line above title
            var decoTop = CreateImage(mainPanel.transform, "DecoTop",
                new Vector2(0.30f, 0.91f), new Vector2(0.70f, 0.912f), Gold);
            decoTop.color = new Color(Gold.r, Gold.g, Gold.b, 0.5f);

            var titleText = CreateTMP(mainPanel.transform, "Title", 56, Gold,
                new Vector2(0.05f, 0.78f), new Vector2(0.95f, 0.90f), "");
            titleText.fontStyle = FontStyles.Bold;

            var subtitleText = CreateTMP(mainPanel.transform, "Subtitle", 20, GoldDim,
                new Vector2(0.15f, 0.72f), new Vector2(0.85f, 0.78f), "");
            subtitleText.fontStyle = FontStyles.Italic;

            // Decorative line below subtitle
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

            // Settings panel (hidden)
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
        }

        private void BuildBackground(Transform parent)
        {
            // Multi-layer gradient background
            var tex = CreateGradientTexture(512, 512);
            var sprite = Sprite.Create(tex, new Rect(0, 0, tex.width, tex.height),
                new Vector2(0.5f, 0.5f));

            var bgGo = new GameObject("Background");
            bgGo.transform.SetParent(parent, false);
            var bgImg = bgGo.AddComponent<Image>();
            bgImg.sprite = sprite;
            bgImg.type = Image.Type.Simple;
            bgImg.preserveAspect = false;
            var bgRt = bgImg.rectTransform;
            bgRt.anchorMin = Vector2.zero;
            bgRt.anchorMax = Vector2.one;
            bgRt.sizeDelta = Vector2.zero;

            // Vignette overlay
            var vigTex = CreateVignetteTexture(256, 256);
            var vigSprite = Sprite.Create(vigTex, new Rect(0, 0, vigTex.width, vigTex.height),
                new Vector2(0.5f, 0.5f));

            var vigGo = new GameObject("Vignette");
            vigGo.transform.SetParent(parent, false);
            var vigImg = vigGo.AddComponent<Image>();
            vigImg.sprite = vigSprite;
            vigImg.type = Image.Type.Simple;
            vigImg.preserveAspect = false;
            vigImg.raycastTarget = false;
            var vigRt = vigImg.rectTransform;
            vigRt.anchorMin = Vector2.zero;
            vigRt.anchorMax = Vector2.one;
            vigRt.sizeDelta = Vector2.zero;

            // Subtle light ray from top-right
            var lightGo = new GameObject("LightRay");
            lightGo.transform.SetParent(parent, false);
            var lightImg = lightGo.AddComponent<Image>();
            lightImg.color = new Color(0.95f, 0.85f, 0.55f, 0.04f);
            lightImg.raycastTarget = false;
            var lightRt = lightImg.rectTransform;
            lightRt.anchorMin = new Vector2(0.4f, 0.3f);
            lightRt.anchorMax = new Vector2(1.0f, 1.0f);
            lightRt.sizeDelta = Vector2.zero;
            lightRt.localRotation = Quaternion.Euler(0, 0, -15f);
        }

        private Texture2D CreateGradientTexture(int w, int h)
        {
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            var topColor = new Color(0.06f, 0.04f, 0.12f);
            var midColor = new Color(0.10f, 0.07f, 0.18f);
            var botColor = new Color(0.03f, 0.02f, 0.06f);

            // Golden accent in upper-right
            var accentColor = new Color(0.18f, 0.12f, 0.06f);

            for (int y = 0; y < h; y++)
            {
                float t = (float)y / h;
                Color baseColor;
                if (t < 0.4f)
                    baseColor = Color.Lerp(botColor, midColor, t / 0.4f);
                else
                    baseColor = Color.Lerp(midColor, topColor, (t - 0.4f) / 0.6f);

                for (int x = 0; x < w; x++)
                {
                    float u = (float)x / w;
                    // Subtle radial accent in upper-right
                    float dx = u - 0.85f;
                    float dy = t - 0.75f;
                    float dist = Mathf.Sqrt(dx * dx + dy * dy);
                    float accentStrength = Mathf.Max(0, 1f - dist * 2.5f) * 0.3f;

                    Color c = Color.Lerp(baseColor, accentColor, accentStrength);
                    c.a = 1f;
                    tex.SetPixel(x, y, c);
                }
            }
            tex.Apply();
            return tex;
        }

        private Texture2D CreateVignetteTexture(int w, int h)
        {
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    float u = (float)x / w * 2f - 1f;
                    float v = (float)y / h * 2f - 1f;
                    float dist = Mathf.Sqrt(u * u + v * v);
                    float alpha = Mathf.Clamp01((dist - 0.5f) * 1.2f) * 0.7f;
                    tex.SetPixel(x, y, new Color(0, 0, 0, alpha));
                }
            }
            tex.Apply();
            return tex;
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
