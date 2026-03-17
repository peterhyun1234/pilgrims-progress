using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PilgrimsProgress.Core;
using PilgrimsProgress.Localization;

namespace PilgrimsProgress.UI
{
    public class ChapterTransitionUI : MonoBehaviour
    {
        public static ChapterTransitionUI Instance { get; private set; }

        public event Action OnTransitionComplete;

        private Canvas _canvas;
        private CanvasGroup _canvasGroup;
        private Image _bgImage;
        private TextMeshProUGUI _chapterEndText;
        private TextMeshProUGUI _summaryText;
        private TextMeshProUGUI _statsText;
        private TextMeshProUGUI _nextChapterText;
        private TextMeshProUGUI _nextChapterName;
        private TextMeshProUGUI _journeyProgressText;
        private Image[] _journeyDots;
        private TextMeshProUGUI _hintText;

        private static readonly Color BgDark = new Color(0.02f, 0.01f, 0.05f, 0.98f);
        private static readonly Color Gold = new Color(0.90f, 0.78f, 0.45f);
        private static readonly Color GoldDim = new Color(0.60f, 0.50f, 0.30f);
        private static readonly Color TextWhite = new Color(0.92f, 0.90f, 0.85f);

        private void Awake()
        {
            Instance = this;
        }

        public void ShowTransition(int completedChapter, int nextChapter)
        {
            BuildUI(completedChapter, nextChapter);
            gameObject.SetActive(true);
            StartCoroutine(AnimateTransition(completedChapter, nextChapter));
        }

        private void BuildUI(int completedCh, int nextCh)
        {
            if (_canvas != null) Destroy(_canvas.gameObject);

            var canvasGo = new GameObject("TransitionCanvas");
            canvasGo.transform.SetParent(transform, false);
            _canvas = canvasGo.AddComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _canvas.sortingOrder = 90;
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();
            _canvasGroup = canvasGo.AddComponent<CanvasGroup>();
            _canvasGroup.alpha = 0;

            var bgGo = new GameObject("TransBg");
            bgGo.transform.SetParent(canvasGo.transform, false);
            _bgImage = bgGo.AddComponent<Image>();
            _bgImage.color = BgDark;
            _bgImage.raycastTarget = true;
            Stretch(_bgImage.rectTransform);

            bool isKo = IsKorean();
            var completedData = ChapterDatabase.Get(completedCh);

            string endLabel = isKo
                ? $"제 {completedCh} 장 완료"
                : $"Chapter {completedCh} Complete";
            _chapterEndText = MakeTMP(canvasGo.transform, "ChEndText",
                new Vector2(0.1f, 0.78f), new Vector2(0.9f, 0.88f),
                34, Gold, TextAlignmentOptions.Center);
            _chapterEndText.fontStyle = FontStyles.Bold;
            _chapterEndText.text = endLabel;

            string chapterName = isKo ? completedData.NameKR : completedData.NameEN;
            MakeTMP(canvasGo.transform, "ChName",
                new Vector2(0.1f, 0.72f), new Vector2(0.9f, 0.78f),
                20, GoldDim, TextAlignmentOptions.Center).text = chapterName;

            MakeImage(canvasGo.transform, "Deco1",
                new Vector2(0.30f, 0.71f), new Vector2(0.70f, 0.712f),
                new Color(Gold.r, Gold.g, Gold.b, 0.3f));

            _summaryText = MakeTMP(canvasGo.transform, "Summary",
                new Vector2(0.12f, 0.56f), new Vector2(0.88f, 0.70f),
                18, TextWhite, TextAlignmentOptions.Center);
            _summaryText.text = GetChapterSummary(completedCh, isKo);

            var stats = Narrative.StatsManager.Instance;
            string statsStr = "";
            if (stats != null)
            {
                string faithLabel = isKo ? "믿음" : "Faith";
                string courageLabel = isKo ? "용기" : "Courage";
                string wisdomLabel = isKo ? "지혜" : "Wisdom";
                string burdenLabel = isKo ? "짐" : "Burden";
                statsStr = $"{faithLabel}: {stats.Stats.Faith}  |  {courageLabel}: {stats.Stats.Courage}  |  " +
                           $"{wisdomLabel}: {stats.Stats.Wisdom}  |  {burdenLabel}: {stats.Stats.Burden}";
            }
            _statsText = MakeTMP(canvasGo.transform, "Stats",
                new Vector2(0.1f, 0.48f), new Vector2(0.9f, 0.56f),
                16, new Color(0.7f, 0.65f, 0.55f), TextAlignmentOptions.Center);
            _statsText.text = statsStr;

            // Journey progress dots
            BuildJourneyProgress(canvasGo.transform, completedCh);

            if (nextCh <= ChapterManager.TotalChapters)
            {
                var nextData = ChapterDatabase.Get(nextCh);
                string nextLabel = isKo ? "다음 여정" : "Next Journey";
                _nextChapterText = MakeTMP(canvasGo.transform, "NextLabel",
                    new Vector2(0.1f, 0.22f), new Vector2(0.9f, 0.28f),
                    16, GoldDim, TextAlignmentOptions.Center);
                _nextChapterText.text = nextLabel;

                string nextName = isKo ? nextData.NameKR : nextData.NameEN;
                _nextChapterName = MakeTMP(canvasGo.transform, "NextName",
                    new Vector2(0.1f, 0.16f), new Vector2(0.9f, 0.24f),
                    26, Gold, TextAlignmentOptions.Center);
                _nextChapterName.fontStyle = FontStyles.Bold;
                _nextChapterName.text = $"Ch.{nextCh} — {nextName}";
            }

            _hintText = MakeTMP(canvasGo.transform, "TransHint",
                new Vector2(0.2f, 0.04f), new Vector2(0.8f, 0.10f),
                15, new Color(1, 1, 1, 0.4f), TextAlignmentOptions.Center);
            _hintText.fontStyle = FontStyles.Italic;
            _hintText.text = isKo ? "아무 키나 눌러 계속" : "Press any key to continue";

            KoreanFontSetup.ApplyToAll();
        }

        private void BuildJourneyProgress(Transform parent, int completedChapter)
        {
            var container = new GameObject("JourneyDots");
            container.transform.SetParent(parent, false);
            var crt = container.AddComponent<RectTransform>();
            crt.anchorMin = new Vector2(0.1f, 0.32f);
            crt.anchorMax = new Vector2(0.9f, 0.40f);
            crt.sizeDelta = Vector2.zero;

            _journeyDots = new Image[ChapterManager.TotalChapters];
            float totalWidth = 0.9f;
            float dotWidth = totalWidth / ChapterManager.TotalChapters;

            for (int i = 0; i < ChapterManager.TotalChapters; i++)
            {
                float x = i * dotWidth + dotWidth * 0.1f;
                float xEnd = x + dotWidth * 0.6f;

                var dotGo = new GameObject($"Dot_{i + 1}");
                dotGo.transform.SetParent(container.transform, false);
                var dotImg = dotGo.AddComponent<Image>();

                bool completed = (i + 1) <= completedChapter;
                bool current = (i + 1) == completedChapter;

                dotImg.color = completed ? Gold : new Color(0.3f, 0.3f, 0.3f, 0.5f);
                if (current) dotImg.color = new Color(1f, 0.92f, 0.55f);

                var drt = dotImg.rectTransform;
                drt.anchorMin = new Vector2(x, 0.3f);
                drt.anchorMax = new Vector2(xEnd, 0.7f);
                drt.sizeDelta = Vector2.zero;

                _journeyDots[i] = dotImg;

                // Chapter number label below
                var numGo = new GameObject($"Num_{i + 1}");
                numGo.transform.SetParent(container.transform, false);
                var numTmp = numGo.AddComponent<TextMeshProUGUI>();
                numTmp.text = $"{i + 1}";
                numTmp.fontSize = 11;
                numTmp.color = completed ? TextWhite : new Color(0.4f, 0.4f, 0.4f);
                numTmp.alignment = TextAlignmentOptions.Center;
                var nrt = numTmp.rectTransform;
                float midX = (x + xEnd) / 2f;
                nrt.anchorMin = new Vector2(midX - dotWidth * 0.3f, -0.3f);
                nrt.anchorMax = new Vector2(midX + dotWidth * 0.3f, 0.2f);
                nrt.sizeDelta = Vector2.zero;
            }

            // Connecting lines
            for (int i = 0; i < ChapterManager.TotalChapters - 1; i++)
            {
                float x1 = i * dotWidth + dotWidth * 0.7f + dotWidth * 0.1f;
                float x2 = (i + 1) * dotWidth + dotWidth * 0.1f;

                var lineGo = new GameObject($"Line_{i}");
                lineGo.transform.SetParent(container.transform, false);
                var lineImg = lineGo.AddComponent<Image>();
                bool done = (i + 1) <= completedChapter;
                lineImg.color = done ? new Color(Gold.r, Gold.g, Gold.b, 0.5f) : new Color(0.25f, 0.25f, 0.25f, 0.3f);
                lineImg.raycastTarget = false;
                var lrt = lineImg.rectTransform;
                lrt.anchorMin = new Vector2(x1, 0.45f);
                lrt.anchorMax = new Vector2(x2, 0.55f);
                lrt.sizeDelta = Vector2.zero;
            }
        }

        private IEnumerator AnimateTransition(int completedCh, int nextCh)
        {
            float t = 0;
            while (t < 0.8f)
            {
                t += Time.unscaledDeltaTime;
                _canvasGroup.alpha = Mathf.Clamp01(t / 0.8f);
                yield return null;
            }
            _canvasGroup.alpha = 1;

            yield return new WaitForSecondsRealtime(0.3f);

            if (_journeyDots != null)
            {
                for (int i = 0; i < _journeyDots.Length; i++)
                {
                    if (_journeyDots[i] == null) continue;
                    var dot = _journeyDots[i];
                    var origScale = dot.rectTransform.localScale;
                    dot.rectTransform.localScale = Vector3.zero;

                    float elapsed = 0f;
                    while (elapsed < 0.12f)
                    {
                        elapsed += Time.unscaledDeltaTime;
                        float progress = Mathf.Clamp01(elapsed / 0.12f);
                        float eased = 1f + 0.2f * Mathf.Sin(progress * Mathf.PI);
                        dot.rectTransform.localScale = origScale * eased * progress;
                        yield return null;
                    }
                    dot.rectTransform.localScale = origScale;
                }
            }

            yield return new WaitForSecondsRealtime(0.3f);

            bool waiting = true;
            while (waiting)
            {
                var kb = UnityEngine.InputSystem.Keyboard.current;
                var mouse = UnityEngine.InputSystem.Mouse.current;
                var touch = UnityEngine.InputSystem.Touchscreen.current;
                if ((kb != null && kb.anyKey.wasPressedThisFrame) ||
                    (mouse != null && mouse.leftButton.wasPressedThisFrame) ||
                    (touch != null && touch.primaryTouch.press.wasPressedThisFrame))
                    waiting = false;
                yield return null;
            }

            t = 0;
            while (t < 0.5f)
            {
                t += Time.unscaledDeltaTime;
                _canvasGroup.alpha = 1 - Mathf.Clamp01(t / 0.5f);
                yield return null;
            }

            OnTransitionComplete?.Invoke();
            Destroy(_canvas.gameObject);
        }

        private static string GetChapterSummary(int chapter, bool isKo)
        {
            if (isKo)
            {
                return chapter switch
                {
                    1 => "전도자를 만나 멸망의 도시를 떠났다.\n순례의 여정이 시작되었다.",
                    2 => "낙심의 늪에서 빠졌으나, 도움의 손길로 건너왔다.",
                    3 => "세상지혜씨의 유혹을 받았으나, 전도자의 경고로 바른 길을 찾았다.",
                    4 => "좁은 문을 두드려 선의의 환영을 받았다.",
                    5 => "해석자의 집에서 진리의 그림들을 보고 깨달음을 얻었다.",
                    6 => "십자가 아래에서 짐이 풀려 떨어졌다!\n세 빛나는 자들에게 새 옷과 두루마리를 받았다.",
                    7 => "어려움의 언덕을 올라 아름다운 궁전에서 쉬고 무장을 갖추었다.",
                    8 => "아폴리온과의 전투를 견뎌냈다.",
                    9 => "사망의 골짜기를 통과하였다.",
                    10 => "허영의 시장을 지나 소망을 동행으로 얻었다.",
                    11 => "절망 거인을 이기고 기쁨의 산에 올랐다.",
                    12 => "마지막 강을 건너 천상의 도시에 도달하였다!",
                    _ => ""
                };
            }

            return chapter switch
            {
                1 => "Met Evangelist and fled the City of Destruction.\nThe pilgrimage has begun.",
                2 => "Fell into the Slough of Despond, but Help pulled you out.",
                3 => "Faced Mr. Worldly Wiseman's deception, but found the right path again.",
                4 => "Knocked on the Wicket Gate and was welcomed by Good-will.",
                5 => "Saw pictures of truth in the Interpreter's House and gained understanding.",
                6 => "At the Cross, the burden fell away!\nReceived new garments and a sealed scroll from the Shining Ones.",
                7 => "Climbed the Hill of Difficulty and rested at Palace Beautiful, armed for the road.",
                8 => "Endured the battle against Apollyon.",
                9 => "Walked through the Valley of the Shadow of Death.",
                10 => "Passed through Vanity Fair and gained Hopeful as a companion.",
                11 => "Overcame Giant Despair and reached the Delectable Mountains.",
                12 => "Crossed the final river and reached the Celestial City!",
                _ => ""
            };
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
