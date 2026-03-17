using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.InputSystem;
using TMPro;
using PilgrimsProgress.Core;
using PilgrimsProgress.Localization;

namespace PilgrimsProgress.UI
{
    public class JourneyMapUI : MonoBehaviour
    {
        public static JourneyMapUI Instance { get; private set; }

        private Canvas _canvas;
        private CanvasGroup _canvasGroup;
        private bool _isOpen;

        private static readonly Color BgDark = new Color(0.02f, 0.01f, 0.05f, 0.95f);
        private static readonly Color Gold = new Color(0.90f, 0.78f, 0.45f);
        private static readonly Color GoldDim = new Color(0.60f, 0.50f, 0.30f);
        private static readonly Color TextWhite = new Color(0.92f, 0.90f, 0.85f);
        private static readonly Color Completed = new Color(0.35f, 0.70f, 0.40f);
        private static readonly Color Current = new Color(1f, 0.92f, 0.55f);
        private static readonly Color Locked = new Color(0.30f, 0.28f, 0.32f);

        private void Awake()
        {
            Instance = this;
        }

        public void Show()
        {
            if (_isOpen) return;
            _isOpen = true;
            BuildUI();
            _canvas.enabled = true;
            StartCoroutine(FadeIn());
            KoreanFontSetup.ApplyToAll();
        }

        public void Hide()
        {
            if (!_isOpen) return;
            StartCoroutine(FadeOutAndHide());
        }

        private void Update()
        {
            if (!_isOpen) return;

            var kb = Keyboard.current;
            var mouse = Mouse.current;
            if (kb != null && (kb.escapeKey.wasPressedThisFrame || kb.tabKey.wasPressedThisFrame))
                Hide();
            if (mouse != null && mouse.rightButton.wasPressedThisFrame)
                Hide();
        }

        private void BuildUI()
        {
            if (_canvas != null) Destroy(_canvas.gameObject);

            var canvasGo = new GameObject("JourneyMapCanvas");
            canvasGo.transform.SetParent(transform, false);
            _canvas = canvasGo.AddComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _canvas.sortingOrder = 95;
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();
            _canvasGroup = canvasGo.AddComponent<CanvasGroup>();
            _canvasGroup.alpha = 0;

            // Background
            var bgGo = new GameObject("JourneyBg");
            bgGo.transform.SetParent(canvasGo.transform, false);
            var bgImg = bgGo.AddComponent<Image>();
            bgImg.color = BgDark;
            bgImg.raycastTarget = true;
            Stretch(bgImg.rectTransform);

            // Close button
            var closeBtn = MakeButton(canvasGo.transform, "CloseBtn",
                new Vector2(0.90f, 0.90f), new Vector2(0.97f, 0.97f),
                new Color(0.3f, 0.15f, 0.15f, 0.8f), "\u2715", 20);
            closeBtn.onClick.AddListener(Hide);

            bool isKo = IsKorean();
            var chapterMgr = ChapterManager.Instance;
            int currentCh = chapterMgr != null ? chapterMgr.CurrentChapter : 1;

            // Title
            string titleStr = isKo ? "순례의 여정" : "The Pilgrim's Journey";
            var title = MakeTMP(canvasGo.transform, "JourneyTitle",
                new Vector2(0.1f, 0.88f), new Vector2(0.9f, 0.96f),
                34, Gold, TextAlignmentOptions.Center);
            title.fontStyle = FontStyles.Bold;
            title.text = titleStr;

            MakeImage(canvasGo.transform, "TitleDeco",
                new Vector2(0.30f, 0.875f), new Vector2(0.70f, 0.878f),
                new Color(Gold.r, Gold.g, Gold.b, 0.3f));

            // Progress text
            string progressStr = isKo
                ? $"진행도: {currentCh}/{ChapterManager.TotalChapters}"
                : $"Progress: {currentCh}/{ChapterManager.TotalChapters}";
            MakeTMP(canvasGo.transform, "Progress",
                new Vector2(0.1f, 0.82f), new Vector2(0.9f, 0.88f),
                16, GoldDim, TextAlignmentOptions.Center).text = progressStr;

            float startY = 0.78f;
            float stepY = 0.058f;

            for (int i = 1; i <= ChapterManager.TotalChapters; i++)
            {
                float y = startY - (i - 1) * stepY;
                var data = ChapterDatabase.Get(i);

                bool isCompleted = i < currentCh;
                bool isCurrent = i == currentCh;
                bool isLocked = i > currentCh;

                Color dotColor = isCompleted ? Completed : isCurrent ? Current : Locked;
                string statusIcon = isCompleted ? "\u2713" : isCurrent ? "\u25B6" : "\u25CB";
                Color textColor = isLocked ? new Color(0.4f, 0.38f, 0.35f) : TextWhite;

                // Status dot
                MakeTMP(canvasGo.transform, $"Status_{i}",
                    new Vector2(0.06f, y - 0.02f), new Vector2(0.10f, y + 0.02f),
                    18, dotColor, TextAlignmentOptions.Center).text = statusIcon;

                // Chapter number
                MakeTMP(canvasGo.transform, $"ChNum_{i}",
                    new Vector2(0.11f, y - 0.02f), new Vector2(0.16f, y + 0.02f),
                    14, dotColor, TextAlignmentOptions.Center).text = $"{i}";

                // Chapter name
                string chName = isKo ? data.NameKR : data.NameEN;
                if (isLocked && i > currentCh + 1) chName = "???";
                var nameTmp = MakeTMP(canvasGo.transform, $"ChName_{i}",
                    new Vector2(0.17f, y - 0.02f), new Vector2(0.60f, y + 0.02f),
                    isLocked ? 15 : 17, textColor, TextAlignmentOptions.MidlineLeft);
                if (isCurrent) nameTmp.fontStyle = FontStyles.Bold;
                nameTmp.text = chName;

                // Theme icon
                string themeIcon = GetThemeIcon(data.Theme);
                MakeTMP(canvasGo.transform, $"Theme_{i}",
                    new Vector2(0.61f, y - 0.02f), new Vector2(0.66f, y + 0.02f),
                    14, dotColor, TextAlignmentOptions.Center).text = themeIcon;

                // Objective (for current chapter)
                if (isCurrent)
                {
                    string obj = ChapterIntroUI.GetChapterObjectivePublic(i, isKo);
                    MakeTMP(canvasGo.transform, $"Obj_{i}",
                        new Vector2(0.17f, y - 0.045f), new Vector2(0.90f, y - 0.01f),
                        12, new Color(0.7f, 0.65f, 0.55f), TextAlignmentOptions.MidlineLeft).text = obj;
                }

                // Connecting line
                if (i < ChapterManager.TotalChapters)
                {
                    float lineY = y - stepY * 0.5f;
                    MakeImage(canvasGo.transform, $"Line_{i}",
                        new Vector2(0.08f, lineY - 0.003f), new Vector2(0.08f + 0.003f, lineY + 0.003f),
                        isCompleted ? new Color(Completed.r, Completed.g, Completed.b, 0.5f) : new Color(0.2f, 0.2f, 0.2f, 0.3f));
                }
            }

            // Stats at the bottom
            var stats = Narrative.StatsManager.Instance;
            if (stats != null)
            {
                string faithStr = isKo ? "믿음" : "Faith";
                string courageStr = isKo ? "용기" : "Courage";
                string wisdomStr = isKo ? "지혜" : "Wisdom";
                string burdenStr = isKo ? "짐" : "Burden";
                string statsDisplay = $"{faithStr}: {stats.Stats.Faith}   {courageStr}: {stats.Stats.Courage}   " +
                                      $"{wisdomStr}: {stats.Stats.Wisdom}   {burdenStr}: {stats.Stats.Burden}";
                MakeTMP(canvasGo.transform, "JourneyStats",
                    new Vector2(0.1f, 0.02f), new Vector2(0.9f, 0.08f),
                    14, GoldDim, TextAlignmentOptions.Center).text = statsDisplay;
            }

            // Hint
            string hint = isKo ? "ESC로 닫기" : "ESC to close";
            MakeTMP(canvasGo.transform, "JourneyHint",
                new Vector2(0.7f, 0.02f), new Vector2(0.95f, 0.06f),
                12, new Color(0.5f, 0.5f, 0.5f), TextAlignmentOptions.MidlineRight).text = hint;
        }

        private static string GetThemeIcon(MapTheme theme)
        {
            return theme switch
            {
                MapTheme.City => "\u2302",       // house
                MapTheme.Fields => "\u2698",      // flower
                MapTheme.Village => "\u2616",     // village
                MapTheme.Gate => "\u2609",        // gate/sun
                MapTheme.Interior => "\u2610",    // interior
                MapTheme.Hill => "\u25B2",        // triangle/hill
                MapTheme.DarkValley => "\u25CF",  // dark circle
                MapTheme.Market => "\u2606",      // star
                MapTheme.Castle => "\u2656",      // rook/castle
                MapTheme.Celestial => "\u2727",   // sparkle
                _ => "\u2022"                     // bullet
            };
        }

        private IEnumerator FadeIn()
        {
            float t = 0;
            while (t < 0.2f)
            {
                t += Time.unscaledDeltaTime;
                _canvasGroup.alpha = Mathf.Clamp01(t / 0.2f);
                yield return null;
            }
            _canvasGroup.alpha = 1;
        }

        private IEnumerator FadeOutAndHide()
        {
            float t = 0;
            while (t < 0.15f)
            {
                t += Time.unscaledDeltaTime;
                _canvasGroup.alpha = 1 - Mathf.Clamp01(t / 0.15f);
                yield return null;
            }
            _canvasGroup.alpha = 0;
            _canvas.enabled = false;
            _isOpen = false;
            Destroy(_canvas.gameObject);
            _canvas = null;
        }

        #region UI Helpers

        private TextMeshProUGUI MakeTMP(Transform parent, string name,
            Vector2 ancMin, Vector2 ancMax, int size, Color color, TextAlignmentOptions align)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var tmp = go.AddComponent<TextMeshProUGUI>();
            tmp.fontSize = size;
            tmp.color = color;
            tmp.alignment = align;
            tmp.enableWordWrapping = true;
            var rt = tmp.rectTransform;
            rt.anchorMin = ancMin;
            rt.anchorMax = ancMax;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;
            return tmp;
        }

        private Image MakeImage(Transform parent, string name,
            Vector2 ancMin, Vector2 ancMax, Color color)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var img = go.AddComponent<Image>();
            img.color = color;
            img.raycastTarget = false;
            var rt = img.rectTransform;
            rt.anchorMin = ancMin;
            rt.anchorMax = ancMax;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;
            return img;
        }

        private Button MakeButton(Transform parent, string name,
            Vector2 ancMin, Vector2 ancMax, Color bgColor, string label, int fontSize)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var img = go.AddComponent<Image>();
            img.color = bgColor;
            var rt = img.rectTransform;
            rt.anchorMin = ancMin;
            rt.anchorMax = ancMax;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;

            var tmp = MakeTMP(go.transform, "Label", Vector2.zero, Vector2.one,
                fontSize, Color.white, TextAlignmentOptions.Center);
            tmp.text = label;

            var btn = go.AddComponent<Button>();
            btn.targetGraphic = img;
            return btn;
        }

        private void Stretch(RectTransform rt)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;
        }

        private bool IsKorean()
        {
            return ServiceLocator.TryGet<LocalizationManager>(out var lm) && lm.CurrentLanguage == "ko";
        }

        #endregion

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }
    }
}
