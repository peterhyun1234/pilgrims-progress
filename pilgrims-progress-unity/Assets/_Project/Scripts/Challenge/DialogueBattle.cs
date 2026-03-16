using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.InputSystem;

namespace PilgrimsProgress.Challenge
{
    /// <summary>
    /// Dialogue-based challenge for Vanity Fair.
    /// Presents a series of temptation arguments; player selects
    /// the correct Biblical counter-argument within a time limit.
    /// </summary>
    public class DialogueBattle : BaseChallenge
    {
        [Header("Settings")]
        [SerializeField] private float _timePerQuestion = 10f;

        [Header("UI")]
        [SerializeField] private Canvas _canvas;

        private readonly List<DialogueQuestion> _questions = new List<DialogueQuestion>
        {
            new DialogueQuestion
            {
                Prompt_Ko = "\"이 세상의 모든 것을 줄 수 있다!\"",
                Prompt_En = "\"I can give you everything in this world!\"",
                Choices_Ko = new[] { "좋아, 받겠습니다", "사람이 빵으로만 살 수 없다", "더 좋은 거래를 원합니다" },
                Choices_En = new[] { "Yes, I'll take it", "Man shall not live on bread alone", "I want a better deal" },
                CorrectIndex = 1
            },
            new DialogueQuestion
            {
                Prompt_Ko = "\"여기서 존경받으며 편하게 살 수 있다!\"",
                Prompt_En = "\"You can live comfortably and be respected here!\"",
                Choices_Ko = new[] { "그것도 나쁘지 않다", "여기 머물겠습니다", "나의 시민권은 하늘에 있습니다" },
                Choices_En = new[] { "That's not bad", "I'll stay here", "My citizenship is in heaven" },
                CorrectIndex = 2
            },
            new DialogueQuestion
            {
                Prompt_Ko = "\"너의 짐을 여기서 내려놓을 수 있다!\"",
                Prompt_En = "\"You can put down your burden here!\"",
                Choices_Ko = new[] { "정말요? 여기서요?", "오직 십자가에서만 내려놓을 수 있습니다", "짐이 무겁긴 합니다" },
                Choices_En = new[] { "Really? Here?", "Only at the Cross can it be removed", "It is heavy indeed" },
                CorrectIndex = 1
            }
        };

        private int _currentQuestion;
        private int _score;
        private float _timer;
        private bool _waitingForAnswer;

        private TextMeshProUGUI _promptText;
        private Button[] _choiceButtons;
        private TextMeshProUGUI[] _choiceTexts;
        private TextMeshProUGUI _timerText;
        private TextMeshProUGUI _scoreText;
        private TextMeshProUGUI _feedbackText;

        protected override void OnInitialize()
        {
            SetupUI();
            ShowQuestion();
        }

        private void Update()
        {
            if (!_waitingForAnswer) return;

            _timer -= Time.deltaTime;
            if (_timerText != null) _timerText.text = Mathf.CeilToInt(_timer).ToString();

            if (_timer <= 0)
            {
                _waitingForAnswer = false;
                ShowFeedback(false);
                StartCoroutine(NextQuestionDelay());
            }
        }

        private void ShowQuestion()
        {
            if (_currentQuestion >= _questions.Count)
            {
                float ratio = _score / (float)_questions.Count;
                Complete(ratio >= 0.5f ? QTEResult.Success : QTEResult.Failure);
                return;
            }

            var q = _questions[_currentQuestion];
            bool isKo = Core.GameManager.Instance != null && Core.GameManager.Instance.CurrentLanguage == "ko";

            if (_promptText != null)
                _promptText.text = isKo ? q.Prompt_Ko : q.Prompt_En;

            var choices = isKo ? q.Choices_Ko : q.Choices_En;
            for (int i = 0; i < _choiceButtons.Length; i++)
            {
                if (i < choices.Length)
                {
                    _choiceButtons[i].gameObject.SetActive(true);
                    _choiceTexts[i].text = choices[i];
                    int idx = i;
                    _choiceButtons[i].onClick.RemoveAllListeners();
                    _choiceButtons[i].onClick.AddListener(() => OnChoiceSelected(idx));
                }
                else
                {
                    _choiceButtons[i].gameObject.SetActive(false);
                }
            }

            _timer = _timePerQuestion;
            _waitingForAnswer = true;
            if (_feedbackText != null) _feedbackText.text = "";
            if (_scoreText != null) _scoreText.text = $"{_score} / {_currentQuestion}";
        }

        private void OnChoiceSelected(int index)
        {
            if (!_waitingForAnswer) return;
            _waitingForAnswer = false;

            bool correct = index == _questions[_currentQuestion].CorrectIndex;
            if (correct) _score++;

            ShowFeedback(correct);
            StartCoroutine(NextQuestionDelay());
        }

        private void ShowFeedback(bool correct)
        {
            if (_feedbackText == null) return;
            _feedbackText.text = correct ? "O" : "X";
            _feedbackText.color = correct ? Color.green : Color.red;
        }

        private IEnumerator NextQuestionDelay()
        {
            yield return new WaitForSeconds(1f);
            _currentQuestion++;
            ShowQuestion();
        }

        private void SetupUI()
        {
            if (_canvas != null) return;

            var canvasGo = new GameObject("DialogueBattleCanvas");
            canvasGo.transform.SetParent(transform);
            _canvas = canvasGo.AddComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _canvas.sortingOrder = 100;
            canvasGo.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasGo.AddComponent<GraphicRaycaster>();

            var panelGo = new GameObject("Panel");
            panelGo.transform.SetParent(canvasGo.transform);
            var panelImg = panelGo.AddComponent<Image>();
            panelImg.color = new Color(0.1f, 0.05f, 0.15f, 0.9f);
            var pr = panelImg.rectTransform;
            pr.anchorMin = new Vector2(0.05f, 0.1f);
            pr.anchorMax = new Vector2(0.95f, 0.9f);
            pr.sizeDelta = Vector2.zero;

            _promptText = CreateTMP(panelGo.transform, "Prompt", 22, Color.white,
                new Vector2(0.05f, 0.65f), new Vector2(0.95f, 0.95f));

            _choiceButtons = new Button[3];
            _choiceTexts = new TextMeshProUGUI[3];
            for (int i = 0; i < 3; i++)
            {
                float y0 = 0.45f - i * 0.15f;
                float y1 = y0 + 0.12f;

                var btnGo = new GameObject($"Choice_{i}");
                btnGo.transform.SetParent(panelGo.transform);
                var btnImg = btnGo.AddComponent<Image>();
                btnImg.color = new Color(0.2f, 0.2f, 0.3f);
                var br = btnImg.rectTransform;
                br.anchorMin = new Vector2(0.1f, y0);
                br.anchorMax = new Vector2(0.9f, y1);
                br.sizeDelta = Vector2.zero;
                br.localScale = Vector3.one;

                _choiceButtons[i] = btnGo.AddComponent<Button>();

                _choiceTexts[i] = CreateTMP(btnGo.transform, "Text", 18, Color.white,
                    Vector2.zero, Vector2.one);
            }

            _timerText = CreateTMP(panelGo.transform, "Timer", 28, Color.yellow,
                new Vector2(0.85f, 0.85f), new Vector2(0.95f, 0.95f));

            _scoreText = CreateTMP(panelGo.transform, "Score", 16, Color.gray,
                new Vector2(0.05f, 0.02f), new Vector2(0.3f, 0.1f));

            _feedbackText = CreateTMP(panelGo.transform, "Feedback", 60, Color.white,
                new Vector2(0.35f, 0.2f), new Vector2(0.65f, 0.6f));
        }

        private TextMeshProUGUI CreateTMP(Transform parent, string name, int size, Color color,
            Vector2 anchorMin, Vector2 anchorMax)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent);
            var tmp = go.AddComponent<TextMeshProUGUI>();
            tmp.fontSize = size;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = color;
            var rt = tmp.rectTransform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;
            rt.localScale = Vector3.one;
            return tmp;
        }

        private class DialogueQuestion
        {
            public string Prompt_Ko;
            public string Prompt_En;
            public string[] Choices_Ko;
            public string[] Choices_En;
            public int CorrectIndex;
        }
    }
}
