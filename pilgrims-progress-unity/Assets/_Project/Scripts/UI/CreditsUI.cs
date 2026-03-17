using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.InputSystem;
using TMPro;
using PilgrimsProgress.Core;
using PilgrimsProgress.Localization;

namespace PilgrimsProgress.UI
{
    public class CreditsUI : MonoBehaviour
    {
        private Canvas _canvas;
        private CanvasGroup _canvasGroup;
        private RectTransform _scrollContent;

        private static readonly Color BgDark = new Color(0.01f, 0.01f, 0.03f);
        private static readonly Color Gold = new Color(0.90f, 0.78f, 0.45f);
        private static readonly Color TextWhite = new Color(0.92f, 0.90f, 0.85f);
        private static readonly Color TextDim = new Color(0.6f, 0.55f, 0.50f);

        public void Show()
        {
            BuildUI();
            StartCoroutine(ScrollCredits());
        }

        private void BuildUI()
        {
            var canvasGo = new GameObject("CreditsCanvas");
            canvasGo.transform.SetParent(transform, false);
            _canvas = canvasGo.AddComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _canvas.sortingOrder = 110;
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();
            _canvasGroup = canvasGo.AddComponent<CanvasGroup>();

            var bgGo = new GameObject("CreditsBg");
            bgGo.transform.SetParent(canvasGo.transform, false);
            var bgImg = bgGo.AddComponent<Image>();
            bgImg.color = BgDark;
            bgImg.raycastTarget = true;
            Stretch(bgImg.rectTransform);

            // Scrolling container
            var contentGo = new GameObject("CreditsContent");
            contentGo.transform.SetParent(canvasGo.transform, false);
            _scrollContent = contentGo.AddComponent<RectTransform>();
            _scrollContent.anchorMin = new Vector2(0.1f, 0);
            _scrollContent.anchorMax = new Vector2(0.9f, 0);
            _scrollContent.sizeDelta = new Vector2(0, 2000);
            _scrollContent.anchoredPosition = new Vector2(0, -600);

            bool isKo = IsKorean();
            float y = 1900;

            y = AddCreditLine(contentGo.transform, y, isKo ? "천로역정" : "The Pilgrim's Progress", 48, Gold, FontStyles.Bold);
            y = AddCreditLine(contentGo.transform, y, isKo ? "순례자의 여정" : "A Journey of Faith", 24, TextDim, FontStyles.Italic);
            y -= 80;

            y = AddCreditLine(contentGo.transform, y, isKo ? "원작" : "Original Work", 18, TextDim);
            y = AddCreditLine(contentGo.transform, y, "John Bunyan (1678)", 28, TextWhite, FontStyles.Bold);
            y -= 60;

            y = AddCreditLine(contentGo.transform, y, isKo ? "게임 개발" : "Game Development", 18, TextDim);
            y = AddCreditLine(contentGo.transform, y, isKo ? "독립 개발자" : "Indie Developer", 26, TextWhite);
            y -= 60;

            y = AddCreditLine(contentGo.transform, y, isKo ? "게임 엔진" : "Game Engine", 18, TextDim);
            y = AddCreditLine(contentGo.transform, y, "Unity", 26, TextWhite);
            y -= 60;

            y = AddCreditLine(contentGo.transform, y, isKo ? "내러티브 엔진" : "Narrative Engine", 18, TextDim);
            y = AddCreditLine(contentGo.transform, y, "Ink by Inkle", 26, TextWhite);
            y -= 60;

            y = AddCreditLine(contentGo.transform, y, isKo ? "AI 개발 지원" : "AI Development Assistant", 18, TextDim);
            y = AddCreditLine(contentGo.transform, y, "Cursor AI", 26, TextWhite);
            y -= 80;

            y = AddCreditLine(contentGo.transform, y, "\u2500\u2500\u2500  \u2727  \u2500\u2500\u2500", 20, new Color(Gold.r, Gold.g, Gold.b, 0.4f));
            y -= 40;

            y = AddCreditLine(contentGo.transform, y, isKo ? "성경 번역" : "Bible Translations", 18, TextDim);
            y = AddCreditLine(contentGo.transform, y, isKo ? "새번역 (대한성서공회)" : "NIV (Biblica)", 22, TextWhite);
            y -= 80;

            y = AddCreditLine(contentGo.transform, y, "\u2500\u2500\u2500  \u2727  \u2500\u2500\u2500", 20, new Color(Gold.r, Gold.g, Gold.b, 0.4f));
            y -= 40;

            string verse = isKo
                ? "\"내가 선한 싸움을 싸우고 달려갈 길을 마치고\n믿음을 지켰으니\"\n— 디모데후서 4:7, 새번역"
                : "\"I have fought the good fight, I have finished the race,\nI have kept the faith.\"\n— 2 Timothy 4:7, NIV";
            y = AddCreditLine(contentGo.transform, y, verse, 22, Gold, FontStyles.Italic);
            y -= 100;

            string dedication = isKo
                ? "이 게임은 천로역정의 메시지를 통해\n믿음의 여정을 걷는 모든 이에게 바칩니다."
                : "This game is dedicated to all who walk\nthe journey of faith.";
            y = AddCreditLine(contentGo.transform, y, dedication, 20, TextWhite);
            y -= 100;

            y = AddCreditLine(contentGo.transform, y,
                isKo ? "플레이해 주셔서 감사합니다" : "Thank you for playing", 30, Gold, FontStyles.Bold);
            y -= 60;

            // Skip hint
            var skipGo = new GameObject("SkipHint");
            skipGo.transform.SetParent(canvasGo.transform, false);
            var skipTmp = skipGo.AddComponent<TextMeshProUGUI>();
            skipTmp.text = isKo ? "아무 키나 눌러 건너뛰기" : "Press any key to skip";
            skipTmp.fontSize = 14;
            skipTmp.color = new Color(0.5f, 0.5f, 0.5f, 0.5f);
            skipTmp.alignment = TextAlignmentOptions.BottomRight;
            var skipRt = skipTmp.rectTransform;
            skipRt.anchorMin = new Vector2(0.7f, 0.02f);
            skipRt.anchorMax = new Vector2(0.96f, 0.06f);
            skipRt.sizeDelta = Vector2.zero;

            _scrollContent.sizeDelta = new Vector2(0, 2000 - y + 400);

            KoreanFontSetup.ApplyToAll();
        }

        private float AddCreditLine(Transform parent, float y, string text, int fontSize, Color color,
            FontStyles style = FontStyles.Normal)
        {
            var go = new GameObject("CreditLine");
            go.transform.SetParent(parent, false);
            var tmp = go.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = fontSize;
            tmp.color = color;
            tmp.fontStyle = style;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.enableWordWrapping = true;
            var rt = tmp.rectTransform;
            rt.anchorMin = new Vector2(0, 0);
            rt.anchorMax = new Vector2(1, 0);
            rt.pivot = new Vector2(0.5f, 1);
            rt.anchoredPosition = new Vector2(0, y);
            rt.sizeDelta = new Vector2(0, fontSize * 3f);
            return y - fontSize * 2.5f;
        }

        private IEnumerator ScrollCredits()
        {
            _canvasGroup.alpha = 0;
            float t = 0;
            while (t < 1f)
            {
                t += Time.unscaledDeltaTime;
                _canvasGroup.alpha = Mathf.Clamp01(t);
                yield return null;
            }

            float scrollSpeed = 50f;
            float maxY = _scrollContent.sizeDelta.y + 800;

            while (_scrollContent.anchoredPosition.y < maxY)
            {
                var kb = Keyboard.current;
                if (kb != null && kb.anyKey.wasPressedThisFrame)
                    break;

                _scrollContent.anchoredPosition += Vector2.up * (scrollSpeed * Time.unscaledDeltaTime);

                if (kb != null && (kb.downArrowKey.isPressed || kb.spaceKey.isPressed))
                    _scrollContent.anchoredPosition += Vector2.up * (scrollSpeed * 3 * Time.unscaledDeltaTime);

                yield return null;
            }

            t = 0;
            while (t < 0.5f)
            {
                t += Time.unscaledDeltaTime;
                _canvasGroup.alpha = 1 - Mathf.Clamp01(t / 0.5f);
                yield return null;
            }

            UnityEngine.SceneManagement.SceneManager.LoadScene("MainMenu");
        }

        private void Stretch(RectTransform rt)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.sizeDelta = Vector2.zero;
        }

        private bool IsKorean()
        {
            return ServiceLocator.TryGet<LocalizationManager>(out var lm) && lm.CurrentLanguage == "ko";
        }
    }
}
