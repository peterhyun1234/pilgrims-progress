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
        private void Start()
        {
            if (FindFirstObjectByType<MainMenuUI>() != null) return;
            EnsureEventSystem();
            BuildMainMenuUI();
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

            // Background
            var bg = CreateImage(canvasGo.transform, "Background",
                Vector2.zero, Vector2.one, new Color(0.08f, 0.06f, 0.12f));

            // --- Language Select Panel ---
            var langPanel = CreatePanel(canvasGo.transform, "LanguageSelectPanel");

            CreateTMP(langPanel.transform, "LangTitle", 40, Color.white,
                new Vector2(0.2f, 0.65f), new Vector2(0.8f, 0.80f),
                "Select Language / 언어를 선택하세요").fontStyle = FontStyles.Bold;

            var koBtn = CreateButton(langPanel.transform, "KoreanButton",
                new Vector2(0.25f, 0.40f), new Vector2(0.48f, 0.55f),
                new Color(0.20f, 0.25f, 0.40f), out var koLabel);
            koLabel.text = "한국어";
            koLabel.fontSize = 28;

            var enBtn = CreateButton(langPanel.transform, "EnglishButton",
                new Vector2(0.52f, 0.40f), new Vector2(0.75f, 0.55f),
                new Color(0.20f, 0.25f, 0.40f), out var enLabel);
            enLabel.text = "English";
            enLabel.fontSize = 28;

            // --- Main Buttons Panel ---
            var mainPanel = CreatePanel(canvasGo.transform, "MainButtonsPanel");
            mainPanel.SetActive(false);

            // Title
            var titleText = CreateTMP(mainPanel.transform, "Title", 52, new Color(0.90f, 0.82f, 0.60f),
                new Vector2(0.1f, 0.72f), new Vector2(0.9f, 0.90f), "");
            titleText.fontStyle = FontStyles.Bold;

            var subtitleText = CreateTMP(mainPanel.transform, "Subtitle", 22, new Color(0.7f, 0.65f, 0.55f),
                new Vector2(0.2f, 0.64f), new Vector2(0.8f, 0.72f), "");

            // Buttons
            float btnY = 0.55f;
            float btnStep = 0.085f;

            var newGameBtn = CreateButton(mainPanel.transform, "NewGameButton",
                new Vector2(0.30f, btnY - 0.03f), new Vector2(0.70f, btnY + 0.03f),
                new Color(0.25f, 0.45f, 0.30f), out var newGameLabel);
            newGameLabel.fontSize = 24;
            btnY -= btnStep;

            var continueBtn = CreateButton(mainPanel.transform, "ContinueButton",
                new Vector2(0.30f, btnY - 0.03f), new Vector2(0.70f, btnY + 0.03f),
                new Color(0.25f, 0.30f, 0.45f), out var continueLabel);
            continueLabel.fontSize = 24;
            btnY -= btnStep;

            var collectionBtn = CreateButton(mainPanel.transform, "CollectionButton",
                new Vector2(0.30f, btnY - 0.03f), new Vector2(0.70f, btnY + 0.03f),
                new Color(0.30f, 0.28f, 0.35f), out var collectionLabel);
            collectionLabel.fontSize = 24;
            btnY -= btnStep;

            var settingsBtn = CreateButton(mainPanel.transform, "SettingsButton",
                new Vector2(0.30f, btnY - 0.03f), new Vector2(0.70f, btnY + 0.03f),
                new Color(0.30f, 0.28f, 0.35f), out var settingsLabel);
            settingsLabel.fontSize = 24;
            btnY -= btnStep;

            var langBtn = CreateButton(mainPanel.transform, "LanguageButton",
                new Vector2(0.30f, btnY - 0.03f), new Vector2(0.70f, btnY + 0.03f),
                new Color(0.30f, 0.28f, 0.35f), out var langLabel);
            langLabel.fontSize = 24;
            btnY -= btnStep;

            var quitBtn = CreateButton(mainPanel.transform, "QuitButton",
                new Vector2(0.30f, btnY - 0.03f), new Vector2(0.70f, btnY + 0.03f),
                new Color(0.40f, 0.25f, 0.25f), out var quitLabel);
            quitLabel.fontSize = 24;

            // Guest label at bottom
            var guestLabel = CreateTMP(mainPanel.transform, "GuestLabel", 16,
                new Color(0.5f, 0.5f, 0.5f), new Vector2(0.3f, 0.05f), new Vector2(0.7f, 0.10f), "");

            // Settings panel (hidden)
            var settingsPanel = CreatePanel(canvasGo.transform, "SettingsPanel");
            settingsPanel.SetActive(false);

            // --- Wire up MainMenuUI component ---
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
            var rt = tmp.rectTransform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;
            return tmp;
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

            label = CreateTMP(go.transform, "Label", 24, Color.white,
                Vector2.zero, Vector2.one, "");

            return go.AddComponent<Button>();
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
