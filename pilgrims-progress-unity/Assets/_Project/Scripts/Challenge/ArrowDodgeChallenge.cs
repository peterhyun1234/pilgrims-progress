using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.InputSystem;

namespace PilgrimsProgress.Challenge
{
    /// <summary>
    /// Directional dodge QTE — arrows fly from random directions,
    /// player must press the opposite direction to dodge.
    /// Used for Apollyon's arrow attack.
    /// </summary>
    public class ArrowDodgeChallenge : BaseChallenge
    {
        [Header("Settings")]
        [SerializeField] private int _totalArrows = 8;
        [SerializeField] private float _arrowInterval = 1.2f;
        [SerializeField] private float _reactionWindow = 0.6f;
        [SerializeField] private float _intervalDecrease = 0.05f;

        [Header("UI")]
        [SerializeField] private Canvas _canvas;

        private int _arrowIndex;
        private int _dodged;
        private int _currentDirection; // 0=Up, 1=Right, 2=Down, 3=Left
        private bool _waitingForDodge;
        private float _reactionTimer;
        private TextMeshProUGUI _directionText;
        private TextMeshProUGUI _scoreText;
        private TextMeshProUGUI _feedbackText;
        private Image _bgPanel;

        private readonly string[] _dirArrows = { "↓", "←", "↑", "→" }; // opposite of attack direction
        private readonly string[] _dirNames = { "↑", "→", "↓", "←" }; // attack from

        protected override void OnInitialize()
        {
            SetupUI();
            StartCoroutine(RunArrows());
        }

        private IEnumerator RunArrows()
        {
            yield return new WaitForSeconds(0.5f);

            for (_arrowIndex = 0; _arrowIndex < _totalArrows; _arrowIndex++)
            {
                _currentDirection = Random.Range(0, 4);
                _waitingForDodge = true;
                _reactionTimer = _reactionWindow;

                if (_directionText != null)
                    _directionText.text = $"DODGE {_dirArrows[_currentDirection]}";
                if (_feedbackText != null)
                    _feedbackText.text = "";

                float interval = Mathf.Max(0.6f, _arrowInterval - _arrowIndex * _intervalDecrease);

                while (_waitingForDodge && _reactionTimer > 0)
                {
                    _reactionTimer -= Time.deltaTime;
                    CheckInput();
                    yield return null;
                }

                if (_waitingForDodge)
                {
                    if (_feedbackText != null) { _feedbackText.text = "HIT!"; _feedbackText.color = Color.red; }
                    _waitingForDodge = false;
                }

                UpdateScore();
                yield return new WaitForSeconds(interval - _reactionWindow);
            }

            yield return new WaitForSeconds(0.5f);
            float ratio = _dodged / (float)_totalArrows;
            Complete(ratio >= 0.5f ? QTEResult.Success : QTEResult.Failure);
        }

        private void CheckInput()
        {
            var kb = Keyboard.current;
            if (kb == null) return;

            int pressedDir = -1;
            if (kb.upArrowKey.wasPressedThisFrame || kb.wKey.wasPressedThisFrame) pressedDir = 0;
            else if (kb.rightArrowKey.wasPressedThisFrame || kb.dKey.wasPressedThisFrame) pressedDir = 1;
            else if (kb.downArrowKey.wasPressedThisFrame || kb.sKey.wasPressedThisFrame) pressedDir = 2;
            else if (kb.leftArrowKey.wasPressedThisFrame || kb.aKey.wasPressedThisFrame) pressedDir = 3;

            if (pressedDir < 0) return;

            _waitingForDodge = false;

            // Correct dodge = opposite direction of the arrow
            int correctDodge = (_currentDirection + 2) % 4;
            if (pressedDir == correctDodge)
            {
                _dodged++;
                if (_feedbackText != null) { _feedbackText.text = "DODGED!"; _feedbackText.color = Color.green; }
            }
            else
            {
                if (_feedbackText != null) { _feedbackText.text = "HIT!"; _feedbackText.color = Color.red; }
            }
        }

        private void UpdateScore()
        {
            if (_scoreText != null)
                _scoreText.text = $"{_dodged} / {_arrowIndex + 1}";
        }

        private void SetupUI()
        {
            if (_canvas != null) return;

            var canvasGo = new GameObject("ArrowDodgeCanvas");
            canvasGo.transform.SetParent(transform);
            _canvas = canvasGo.AddComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _canvas.sortingOrder = 100;
            canvasGo.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasGo.AddComponent<GraphicRaycaster>();

            var panelGo = new GameObject("Panel");
            panelGo.transform.SetParent(canvasGo.transform);
            _bgPanel = panelGo.AddComponent<Image>();
            _bgPanel.color = new Color(0, 0, 0, 0.75f);
            var panelRect = _bgPanel.rectTransform;
            panelRect.anchorMin = new Vector2(0.2f, 0.25f);
            panelRect.anchorMax = new Vector2(0.8f, 0.75f);
            panelRect.sizeDelta = Vector2.zero;

            _directionText = CreateText(panelGo.transform, "Direction", 48, Color.white,
                new Vector2(0, 0.5f), new Vector2(1, 0.9f));

            _feedbackText = CreateText(panelGo.transform, "Feedback", 28, Color.white,
                new Vector2(0, 0.2f), new Vector2(1, 0.5f));

            _scoreText = CreateText(panelGo.transform, "Score", 20, Color.gray,
                new Vector2(0, 0), new Vector2(1, 0.2f));
            _scoreText.text = "0 / 0";
        }

        private TextMeshProUGUI CreateText(Transform parent, string name, int size, Color color,
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
    }
}
