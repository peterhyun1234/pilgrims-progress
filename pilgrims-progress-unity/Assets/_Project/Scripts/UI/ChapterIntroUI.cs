using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.UI
{
    public class ChapterIntroUI : MonoBehaviour
    {
        private CanvasGroup _cg;
        private TextMeshProUGUI _chapterNum;
        private TextMeshProUGUI _chapterName;
        private TextMeshProUGUI _objectiveText;
        private TextMeshProUGUI _controlsHint;

        public void Show(ChapterData data)
        {
            BuildUI(data);
            StartCoroutine(AnimateIntro());
        }

        private void BuildUI(ChapterData data)
        {
            _cg = gameObject.AddComponent<CanvasGroup>();
            _cg.alpha = 0f;
            _cg.blocksRaycasts = true;

            var bg = new GameObject("IntroBg");
            bg.transform.SetParent(transform, false);
            var bgImg = bg.AddComponent<Image>();
            bgImg.color = new Color(0.02f, 0.02f, 0.05f, 0.92f);
            var bgRt = bgImg.rectTransform;
            bgRt.anchorMin = Vector2.zero;
            bgRt.anchorMax = Vector2.one;
            bgRt.sizeDelta = Vector2.zero;

            var lm = ServiceLocator.TryGet<Localization.LocalizationManager>(out var l) ? l : null;
            bool isKo = lm != null && lm.CurrentLanguage == "ko";

            _chapterNum = CreateTMP(transform, "ChapterNum", 20,
                new Color(0.7f, 0.6f, 0.4f),
                new Vector2(0.1f, 0.62f), new Vector2(0.9f, 0.68f),
                isKo ? $"제 {data.ChapterNumber} 장" : $"Chapter {data.ChapterNumber}");

            string name = isKo ? data.NameKR : data.NameEN;
            _chapterName = CreateTMP(transform, "ChapterName", 36,
                new Color(1f, 0.9f, 0.6f),
                new Vector2(0.1f, 0.50f), new Vector2(0.9f, 0.62f), name);
            _chapterName.fontStyle = FontStyles.Bold;

            string objectiveStr = GetChapterObjective(data.ChapterNumber, isKo);
            _objectiveText = CreateTMP(transform, "Objective", 18,
                new Color(0.8f, 0.8f, 0.8f),
                new Vector2(0.15f, 0.36f), new Vector2(0.85f, 0.48f), objectiveStr);

            string controls = isKo
                ? "이동: 방향키/WASD  |  대화: E/Space  |  취소: Escape"
                : "Move: Arrow/WASD  |  Talk: E/Space  |  Cancel: Escape";
            _controlsHint = CreateTMP(transform, "Controls", 14,
                new Color(0.6f, 0.6f, 0.6f),
                new Vector2(0.1f, 0.26f), new Vector2(0.9f, 0.32f), controls);

            string tapHint = isKo ? "아무 키나 눌러 시작" : "Press any key to begin";
            CreateTMP(transform, "TapHint", 16,
                new Color(1f, 1f, 1f, 0.5f),
                new Vector2(0.3f, 0.18f), new Vector2(0.7f, 0.24f), tapHint);
        }

        private IEnumerator AnimateIntro()
        {
            float fade = 0f;
            while (fade < 1f)
            {
                fade += Time.unscaledDeltaTime * 2f;
                _cg.alpha = Mathf.Clamp01(fade);
                yield return null;
            }

            yield return new WaitForSecondsRealtime(0.5f);

            bool waiting = true;
            while (waiting)
            {
                var kb = UnityEngine.InputSystem.Keyboard.current;
                var mouse = UnityEngine.InputSystem.Mouse.current;
                if ((kb != null && kb.anyKey.wasPressedThisFrame) ||
                    (mouse != null && mouse.leftButton.wasPressedThisFrame))
                    waiting = false;
                yield return null;
            }

            float fadeOut = 1f;
            while (fadeOut > 0f)
            {
                fadeOut -= Time.unscaledDeltaTime * 3f;
                _cg.alpha = Mathf.Clamp01(fadeOut);
                yield return null;
            }

            _cg.blocksRaycasts = false;
            Destroy(gameObject, 0.1f);
        }

        public static string GetChapterObjectivePublic(int chapter, bool isKo)
        {
            return GetChapterObjective(chapter, isKo);
        }

        private static string GetChapterObjective(int chapter, bool isKo)
        {
            if (isKo)
            {
                return chapter switch
                {
                    1 => "목표: 전도자를 만나 순례의 길을 시작하라",
                    2 => "목표: 낙심의 늪을 건너 도움을 찾으라",
                    3 => "목표: 세상지혜씨의 유혹을 분별하라",
                    4 => "목표: 좁은 문을 두드려 선의를 만나라",
                    5 => "목표: 해석자의 집에서 진리의 그림들을 보라",
                    6 => "목표: 십자가에서 짐을 내려놓으라",
                    7 => "목표: 어려움의 언덕을 오르고 아름다운 궁전에 머무르라",
                    8 => "목표: 아폴리온과의 전투를 견뎌내라",
                    9 => "목표: 사망의 골짜기를 통과하라",
                    10 => "목표: 허영의 시장을 통과하고 동행을 얻으라",
                    11 => "목표: 절망 거인을 이기고 기쁨의 산에 오르라",
                    12 => "목표: 마지막 강을 건너 천상의 도시에 도달하라",
                    _ => ""
                };
            }

            return chapter switch
            {
                1 => "Objective: Meet Evangelist and begin your pilgrimage",
                2 => "Objective: Cross the Slough of Despond and find Help",
                3 => "Objective: Discern Mr. Worldly Wiseman's deception",
                4 => "Objective: Knock on the Wicket Gate and meet Good-will",
                5 => "Objective: See the pictures of truth in the Interpreter's House",
                6 => "Objective: Lay down your burden at the Cross",
                7 => "Objective: Climb the Hill of Difficulty and stay at Palace Beautiful",
                8 => "Objective: Endure the battle against Apollyon",
                9 => "Objective: Walk through the Valley of the Shadow of Death",
                10 => "Objective: Pass through Vanity Fair and gain a companion",
                11 => "Objective: Overcome Giant Despair and reach the Delectable Mountains",
                12 => "Objective: Cross the final river and reach the Celestial City",
                _ => ""
            };
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
    }
}
