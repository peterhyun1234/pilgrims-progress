using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.InputSystem;

namespace PilgrimsProgress.Challenge
{
    /// <summary>
    /// Button-mashing QTE — e.g. escaping the Slough of Despond.
    /// Player must press Space/tap repeatedly to fill a progress bar
    /// before time runs out.
    /// </summary>
    public class MashChallenge : BaseChallenge
    {
        [Header("Settings")]
        [SerializeField] private float _timeLimit = 8f;
        [SerializeField] private float _targetPresses = 30f;
        [SerializeField] private float _decayRate = 2f;

        [Header("UI")]
        [SerializeField] private Image _progressBar;
        [SerializeField] private Image _timerBar;
        [SerializeField] private TextMeshProUGUI _instructionText;
        [SerializeField] private Canvas _canvas;

        private float _progress;
        private float _elapsed;
        private bool _running;

        protected override void OnInitialize()
        {
            SetupUI();
            _running = true;
        }

        private void Update()
        {
            if (!_running) return;

            _elapsed += Time.deltaTime;
            _progress -= _decayRate * Time.deltaTime;
            _progress = Mathf.Max(0f, _progress);

            var kb = Keyboard.current;
            if (kb != null && kb.spaceKey.wasPressedThisFrame)
            {
                _progress += 100f / _targetPresses;
            }

            if (Touchscreen.current != null)
            {
                foreach (var touch in Touchscreen.current.touches)
                {
                    if (touch.press.wasPressedThisFrame)
                    {
                        _progress += 100f / _targetPresses;
                        break;
                    }
                }
            }

            _progress = Mathf.Clamp(_progress, 0f, 100f);

            if (_progressBar != null)
                _progressBar.fillAmount = _progress / 100f;
            if (_timerBar != null)
                _timerBar.fillAmount = 1f - (_elapsed / _timeLimit);

            if (_progress >= 100f)
            {
                _running = false;
                CompleteSuccess();
                return;
            }

            if (_elapsed >= _timeLimit)
            {
                _running = false;
                CompleteFail();
            }
        }

        private void SetupUI()
        {
            if (_canvas != null) return;

            var canvasGo = new GameObject("MashChallengeCanvas");
            canvasGo.transform.SetParent(transform);
            _canvas = canvasGo.AddComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _canvas.sortingOrder = 100;
            canvasGo.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasGo.AddComponent<GraphicRaycaster>();

            var bg = CreateUIImage(canvasGo.transform, "BG",
                new Vector2(0.5f, 0.5f), new Vector2(400, 120),
                new Color(0, 0, 0, 0.7f));
            bg.rectTransform.anchoredPosition = new Vector2(0, -100);

            var progressBg = CreateUIImage(bg.transform, "ProgressBG",
                new Vector2(0.5f, 0.7f), new Vector2(350, 30),
                new Color(0.2f, 0.2f, 0.2f));

            _progressBar = CreateUIImage(progressBg.transform, "ProgressFill",
                new Vector2(0f, 0.5f), new Vector2(350, 30),
                new Color(0.2f, 0.8f, 0.3f));
            _progressBar.type = Image.Type.Filled;
            _progressBar.fillMethod = Image.FillMethod.Horizontal;
            _progressBar.fillAmount = 0f;
            _progressBar.rectTransform.anchorMin = new Vector2(0, 0);
            _progressBar.rectTransform.anchorMax = new Vector2(1, 1);
            _progressBar.rectTransform.sizeDelta = Vector2.zero;
            _progressBar.rectTransform.anchoredPosition = Vector2.zero;

            var timerBg = CreateUIImage(bg.transform, "TimerBG",
                new Vector2(0.5f, 0.3f), new Vector2(350, 15),
                new Color(0.2f, 0.2f, 0.2f));

            _timerBar = CreateUIImage(timerBg.transform, "TimerFill",
                new Vector2(0f, 0.5f), new Vector2(350, 15),
                new Color(0.9f, 0.3f, 0.2f));
            _timerBar.type = Image.Type.Filled;
            _timerBar.fillMethod = Image.FillMethod.Horizontal;
            _timerBar.fillAmount = 1f;
            _timerBar.rectTransform.anchorMin = new Vector2(0, 0);
            _timerBar.rectTransform.anchorMax = new Vector2(1, 1);
            _timerBar.rectTransform.sizeDelta = Vector2.zero;
            _timerBar.rectTransform.anchoredPosition = Vector2.zero;

            var textGo = new GameObject("Instruction");
            textGo.transform.SetParent(bg.transform);
            _instructionText = textGo.AddComponent<TextMeshProUGUI>();
            _instructionText.text = "SPACE / TAP!";
            _instructionText.fontSize = 24;
            _instructionText.alignment = TextAlignmentOptions.Center;
            _instructionText.color = Color.white;
            var textRect = _instructionText.rectTransform;
            textRect.anchorMin = new Vector2(0, 0);
            textRect.anchorMax = new Vector2(1, 0.5f);
            textRect.sizeDelta = Vector2.zero;
            textRect.anchoredPosition = Vector2.zero;
        }

        private Image CreateUIImage(Transform parent, string name, Vector2 anchor, Vector2 size, Color color)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent);
            var img = go.AddComponent<Image>();
            img.color = color;
            var rect = img.rectTransform;
            rect.anchorMin = anchor;
            rect.anchorMax = anchor;
            rect.sizeDelta = size;
            rect.anchoredPosition = Vector2.zero;
            rect.localScale = Vector3.one;
            return img;
        }
    }
}
