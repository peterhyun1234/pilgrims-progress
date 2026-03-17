using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.InputSystem;
using TMPro;
using PilgrimsProgress.Core;
using PilgrimsProgress.Localization;
using PilgrimsProgress.Narrative;

namespace PilgrimsProgress.UI
{
    public class EpilogueEndingUI : MonoBehaviour
    {
        private Canvas _canvas;
        private CanvasGroup _canvasGroup;
        private TextMeshProUGUI _mainText;

        private static readonly Color BgDark = new Color(0.01f, 0.01f, 0.03f);
        private static readonly Color Gold = new Color(0.90f, 0.78f, 0.45f);
        private static readonly Color TextWhite = new Color(0.92f, 0.90f, 0.85f);

        public void Show()
        {
            BuildUI();
            StartCoroutine(RunEnding());
        }

        private void BuildUI()
        {
            var canvasGo = new GameObject("EpilogueCanvas");
            canvasGo.transform.SetParent(transform, false);
            _canvas = canvasGo.AddComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _canvas.sortingOrder = 105;
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();
            _canvasGroup = canvasGo.AddComponent<CanvasGroup>();
            _canvasGroup.alpha = 0;

            var bgGo = new GameObject("EpBg");
            bgGo.transform.SetParent(canvasGo.transform, false);
            var bgImg = bgGo.AddComponent<Image>();
            bgImg.color = BgDark;
            bgImg.raycastTarget = true;
            Stretch(bgImg.rectTransform);

            _mainText = MakeTMP(canvasGo.transform, "EpText",
                new Vector2(0.10f, 0.25f), new Vector2(0.90f, 0.75f),
                26, TextWhite, TextAlignmentOptions.Center);
            _mainText.lineSpacing = 25f;

            KoreanFontSetup.ApplyToAll();
        }

        private IEnumerator RunEnding()
        {
            bool isKo = IsKorean();
            var stats = StatsManager.Instance;
            string playerName = GameManager.Instance != null ? GameManager.Instance.PlayerName : "Christian";

            // Fade in
            yield return FadeTo(1, 1.5f);

            // Final journey summary
            yield return ShowTextAndWait(isKo
                ? $"{playerName}의 순례가 끝났습니다."
                : $"The pilgrimage of {playerName} is complete.", 0.05f);

            yield return new WaitForSecondsRealtime(1f);

            yield return ShowTextAndWait(isKo
                ? "멸망의 도시에서 시작하여\n낙심의 늪을 건너고, 유혹을 물리치고\n좁은 문을 통과하고, 십자가에서 짐을 벗고\n어둠의 골짜기를 지나\n마침내 천상의 도시에 이르렀습니다."
                : "From the City of Destruction\nacross the Slough of Despond, past temptation,\nthrough the Wicket Gate, freed at the Cross,\nthrough the Valley of Shadow,\nand at last to the Celestial City.", 0.04f);

            yield return new WaitForSecondsRealtime(1f);

            // Stats summary
            if (stats != null)
            {
                string faithLabel = isKo ? "믿음" : "Faith";
                string courageLabel = isKo ? "용기" : "Courage";
                string wisdomLabel = isKo ? "지혜" : "Wisdom";

                yield return ShowTextAndWait(isKo
                    ? $"여정의 결과:\n\n{faithLabel}: {stats.Stats.Faith}\n{courageLabel}: {stats.Stats.Courage}\n{wisdomLabel}: {stats.Stats.Wisdom}"
                    : $"Journey Results:\n\n{faithLabel}: {stats.Stats.Faith}\n{courageLabel}: {stats.Stats.Courage}\n{wisdomLabel}: {stats.Stats.Wisdom}", 0.03f);

                yield return new WaitForSecondsRealtime(1.5f);
            }

            // Closing verse
            string verse = isKo
                ? "\"내가 선한 싸움을 싸우고\n달려갈 길을 마치고\n믿음을 지켰으니\"\n\n— 디모데후서 4:7, 새번역"
                : "\"I have fought the good fight,\nI have finished the race,\nI have kept the faith.\"\n\n— 2 Timothy 4:7, NIV";
            _mainText.color = Gold;
            _mainText.fontStyle = FontStyles.Italic;
            yield return ShowTextAndWait(verse, 0.05f);

            yield return new WaitForSecondsRealtime(2f);

            // Final message
            _mainText.fontStyle = FontStyles.Normal;
            _mainText.color = TextWhite;
            yield return ShowTextAndWait(isKo
                ? "당신의 순례는 끝났지만\n신앙의 여정은 계속됩니다.\n\n감사합니다."
                : "Your pilgrimage is over,\nbut the journey of faith continues.\n\nThank you.", 0.05f);

            yield return new WaitForSecondsRealtime(2f);

            // Fade to credits
            yield return FadeTo(0, 1f);

            var creditsGo = new GameObject("Credits");
            creditsGo.AddComponent<CreditsUI>().Show();
            Destroy(gameObject);
        }

        private IEnumerator ShowTextAndWait(string text, float charDelay)
        {
            _mainText.text = "";

            for (int i = 0; i < text.Length; i++)
            {
                _mainText.text += text[i];

                var kb = Keyboard.current;
                if (kb != null && kb.anyKey.wasPressedThisFrame)
                {
                    _mainText.text = text;
                    break;
                }

                yield return new WaitForSecondsRealtime(charDelay);
            }

            bool waiting = true;
            while (waiting)
            {
                var kb = Keyboard.current;
                var mouse = Mouse.current;
                if ((kb != null && kb.anyKey.wasPressedThisFrame) ||
                    (mouse != null && mouse.leftButton.wasPressedThisFrame))
                    waiting = false;
                yield return null;
            }
        }

        private IEnumerator FadeTo(float target, float duration)
        {
            float start = _canvasGroup.alpha;
            float t = 0;
            while (t < duration)
            {
                t += Time.unscaledDeltaTime;
                _canvasGroup.alpha = Mathf.Lerp(start, target, t / duration);
                yield return null;
            }
            _canvasGroup.alpha = target;
        }

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
