using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.InputSystem;
using TMPro;
using PilgrimsProgress.Core;
using PilgrimsProgress.Localization;

namespace PilgrimsProgress.UI
{
    public class PrologueUI : MonoBehaviour
    {
        public event Action OnPrologueComplete;

        private static readonly Color BgDark = new Color(0.02f, 0.01f, 0.05f);
        private static readonly Color Gold = new Color(0.90f, 0.78f, 0.45f);
        private static readonly Color GoldDim = new Color(0.65f, 0.55f, 0.30f);
        private static readonly Color TextWhite = new Color(0.92f, 0.90f, 0.85f);
        private static readonly Color GoalBg = new Color(0.08f, 0.06f, 0.12f, 0.90f);

        private TextMeshProUGUI _mainText;
        private GameObject _goalPanel;
        private Button _startButton;
        private TextMeshProUGUI _tapHint;

        private int _currentPhase;
        private bool _waitingForInput;
        private Coroutine _typewriterCoroutine;

        private void Start()
        {
            BuildUI();
            KoreanFontSetup.ApplyToAll();
            StartCoroutine(RunPrologue());
        }

        private void Update()
        {
            if (!_waitingForInput) return;

            var kb = Keyboard.current;
            var mouse = Mouse.current;
            var touch = Touchscreen.current;

            bool pressed = (kb != null && kb.anyKey.wasPressedThisFrame)
                        || (mouse != null && mouse.leftButton.wasPressedThisFrame)
                        || (touch != null && touch.primaryTouch.press.wasPressedThisFrame);

            if (pressed)
                _waitingForInput = false;
        }

        private void BuildUI()
        {
            var rt = GetComponent<RectTransform>();
            if (rt == null) rt = gameObject.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.sizeDelta = Vector2.zero;

            _mainText = CreateText("MainText",
                new Vector2(0.10f, 0.35f), new Vector2(0.90f, 0.70f),
                36, TextWhite, TextAlignmentOptions.Center);
            _mainText.text = "";
            _mainText.lineSpacing = 20f;

            _tapHint = CreateText("TapHint",
                new Vector2(0.25f, 0.10f), new Vector2(0.75f, 0.18f),
                18, GoldDim, TextAlignmentOptions.Center);
            _tapHint.text = "";
            _tapHint.fontStyle = FontStyles.Italic;

            BuildGoalPanel();
            BuildStartButton();
        }

        private void BuildGoalPanel()
        {
            _goalPanel = new GameObject("GoalPanel");
            _goalPanel.transform.SetParent(transform, false);

            var grt = _goalPanel.AddComponent<RectTransform>();
            grt.anchorMin = new Vector2(0.15f, 0.20f);
            grt.anchorMax = new Vector2(0.85f, 0.80f);
            grt.sizeDelta = Vector2.zero;

            var bg = _goalPanel.AddComponent<Image>();
            bg.color = GoalBg;
            bg.raycastTarget = false;

            var title = CreateText("GoalTitle",
                new Vector2(0.05f, 0.78f), new Vector2(0.95f, 0.95f),
                32, Gold, TextAlignmentOptions.Center, _goalPanel.transform);
            title.fontStyle = FontStyles.Bold;
            title.text = GetLoc("prologue_goal_title");

            var decoLine = new GameObject("DecoLine");
            decoLine.transform.SetParent(_goalPanel.transform, false);
            var dlImg = decoLine.AddComponent<Image>();
            dlImg.color = new Color(Gold.r, Gold.g, Gold.b, 0.4f);
            dlImg.raycastTarget = false;
            var dlRt = dlImg.rectTransform;
            dlRt.anchorMin = new Vector2(0.25f, 0.75f);
            dlRt.anchorMax = new Vector2(0.75f, 0.755f);
            dlRt.sizeDelta = Vector2.zero;

            string[] goalKeys = { "prologue_goal1", "prologue_goal2", "prologue_goal3" };
            string[] icons = { "\u2694", "\u2696", "\u2720" };
            float yTop = 0.62f;
            float yStep = 0.18f;

            for (int i = 0; i < goalKeys.Length; i++)
            {
                float y = yTop - i * yStep;
                var goalText = CreateText($"Goal{i}",
                    new Vector2(0.08f, y - 0.05f), new Vector2(0.92f, y + 0.05f),
                    22, TextWhite, TextAlignmentOptions.Center, _goalPanel.transform);
                goalText.text = $"{icons[i]}  {GetLoc(goalKeys[i])}";
            }

            _goalPanel.SetActive(false);
        }

        private void BuildStartButton()
        {
            var btnGo = new GameObject("StartButton");
            btnGo.transform.SetParent(transform, false);

            var btnImg = btnGo.AddComponent<Image>();
            btnImg.color = new Color(0.15f, 0.28f, 0.18f, 0.90f);

            var btnRt = btnImg.rectTransform;
            btnRt.anchorMin = new Vector2(0.30f, 0.08f);
            btnRt.anchorMax = new Vector2(0.70f, 0.16f);
            btnRt.sizeDelta = Vector2.zero;

            var label = CreateText("StartLabel",
                Vector2.zero, Vector2.one,
                24, Gold, TextAlignmentOptions.Center, btnGo.transform);
            label.text = GetLoc("prologue_start");
            label.fontStyle = FontStyles.Bold;

            _startButton = btnGo.AddComponent<Button>();
            _startButton.targetGraphic = btnImg;
            _startButton.onClick.AddListener(() => OnPrologueComplete?.Invoke());
            btnGo.SetActive(false);
        }

        private IEnumerator RunPrologue()
        {
            yield return new WaitForSeconds(0.5f);

            yield return ShowTextAndWait(GetLoc("prologue_line1"), 0.06f);
            yield return new WaitForSeconds(0.3f);

            string dreamText =
                $"{GetLoc("prologue_line2")}\n" +
                $"{GetLoc("prologue_line3")}\n" +
                $"{GetLoc("prologue_line4")}\n" +
                $"{GetLoc("prologue_line5")}";
            yield return ShowTextAndWait(dreamText, 0.04f);
            yield return new WaitForSeconds(0.3f);

            string contextText =
                $"{GetLoc("prologue_city")}\n" +
                $"{GetLoc("prologue_judgment")}\n\n" +
                $"{GetLoc("prologue_burden")}\n" +
                $"{GetLoc("prologue_only_place")}";
            yield return ShowTextAndWait(contextText, 0.04f);
            yield return new WaitForSeconds(0.3f);

            if (_mainText != null) _mainText.text = "";
            if (_tapHint != null) _tapHint.text = "";
            _goalPanel.SetActive(true);
            _startButton.gameObject.SetActive(true);
        }

        private IEnumerator ShowTextAndWait(string text, float charDelay)
        {
            if (_mainText == null) yield break;

            _mainText.text = "";
            _tapHint.text = "";

            foreach (char c in text)
            {
                _mainText.text += c;
                yield return new WaitForSeconds(charDelay);
            }

            var loc = GetLoc("prologue_tap");
            if (_tapHint != null) _tapHint.text = loc;

            _waitingForInput = true;
            yield return new WaitUntil(() => !_waitingForInput);
        }

        private TextMeshProUGUI CreateText(string name,
            Vector2 anchorMin, Vector2 anchorMax,
            int fontSize, Color color, TextAlignmentOptions alignment,
            Transform parent = null)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent ?? transform, false);
            var tmp = go.AddComponent<TextMeshProUGUI>();
            tmp.fontSize = fontSize;
            tmp.color = color;
            tmp.alignment = alignment;
            tmp.enableWordWrapping = true;
            tmp.overflowMode = TextOverflowModes.Overflow;
            var rt = tmp.rectTransform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;
            return tmp;
        }

        private string GetLoc(string key)
        {
            if (ServiceLocator.TryGet<LocalizationManager>(out var lm))
                return lm.Get(key);
            return $"[{key}]";
        }
    }
}
