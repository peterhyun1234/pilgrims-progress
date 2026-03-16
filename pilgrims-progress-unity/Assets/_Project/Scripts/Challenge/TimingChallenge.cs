using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.InputSystem;

namespace PilgrimsProgress.Challenge
{
    /// <summary>
    /// Timing-based QTE — e.g. Apollyon combat.
    /// A marker moves across a bar; player must press when it hits the target zone.
    /// </summary>
    public class TimingChallenge : BaseChallenge
    {
        [Header("Settings")]
        [SerializeField] private int _rounds = 5;
        [SerializeField] private float _markerSpeed = 2f;
        [SerializeField] private float _speedIncrease = 0.3f;
        [SerializeField] private float _targetZoneWidth = 0.2f;
        [SerializeField] private float _targetZoneMin = 0.15f;

        [Header("UI")]
        [SerializeField] private Canvas _canvas;

        private int _currentRound;
        private int _successes;
        private float _markerPosition;
        private float _currentSpeed;
        private float _currentZoneWidth;
        private float _zoneCenter;
        private bool _movingRight = true;
        private bool _waitingForInput;

        private Image _barBg;
        private Image _targetZone;
        private Image _marker;
        private TextMeshProUGUI _roundText;
        private TextMeshProUGUI _resultText;

        protected override void OnInitialize()
        {
            SetupUI();
            _currentSpeed = _markerSpeed;
            _currentZoneWidth = _targetZoneWidth;
            StartNextRound();
        }

        private void Update()
        {
            if (!_waitingForInput) return;

            if (_movingRight)
                _markerPosition += _currentSpeed * Time.deltaTime;
            else
                _markerPosition -= _currentSpeed * Time.deltaTime;

            if (_markerPosition >= 1f) { _markerPosition = 1f; _movingRight = false; }
            if (_markerPosition <= 0f) { _markerPosition = 0f; _movingRight = true; }

            if (_marker != null)
            {
                _marker.rectTransform.anchorMin = new Vector2(_markerPosition - 0.01f, 0);
                _marker.rectTransform.anchorMax = new Vector2(_markerPosition + 0.01f, 1);
            }

            bool pressed = false;
            var kb = Keyboard.current;
            if (kb != null && (kb.spaceKey.wasPressedThisFrame || kb.jKey.wasPressedThisFrame))
                pressed = true;

            if (Touchscreen.current != null)
            {
                foreach (var touch in Touchscreen.current.touches)
                {
                    if (touch.press.wasPressedThisFrame) { pressed = true; break; }
                }
            }

            if (pressed)
            {
                _waitingForInput = false;
                float zoneMin = _zoneCenter - _currentZoneWidth / 2f;
                float zoneMax = _zoneCenter + _currentZoneWidth / 2f;
                bool hit = _markerPosition >= zoneMin && _markerPosition <= zoneMax;

                if (hit)
                {
                    _successes++;
                    if (_resultText != null) { _resultText.text = "HIT!"; _resultText.color = Color.green; }
                }
                else
                {
                    if (_resultText != null) { _resultText.text = "MISS"; _resultText.color = Color.red; }
                }

                StartCoroutine(NextRoundDelay());
            }
        }

        private IEnumerator NextRoundDelay()
        {
            yield return new WaitForSeconds(0.5f);

            _currentRound++;
            _currentSpeed += _speedIncrease;
            _currentZoneWidth = Mathf.Max(_targetZoneMin, _currentZoneWidth - 0.02f);

            if (_currentRound >= _rounds)
            {
                float ratio = _successes / (float)_rounds;
                Complete(ratio >= 0.5f ? QTEResult.Success : QTEResult.Failure);
            }
            else
            {
                StartNextRound();
            }
        }

        private void StartNextRound()
        {
            _zoneCenter = Random.Range(0.25f, 0.75f);
            _markerPosition = 0f;
            _movingRight = true;
            _waitingForInput = true;

            if (_targetZone != null)
            {
                _targetZone.rectTransform.anchorMin = new Vector2(_zoneCenter - _currentZoneWidth / 2f, 0);
                _targetZone.rectTransform.anchorMax = new Vector2(_zoneCenter + _currentZoneWidth / 2f, 1);
            }

            if (_roundText != null)
                _roundText.text = $"{_currentRound + 1} / {_rounds}";
            if (_resultText != null)
                _resultText.text = "";
        }

        private void SetupUI()
        {
            if (_canvas != null) return;

            var canvasGo = new GameObject("TimingChallengeCanvas");
            canvasGo.transform.SetParent(transform);
            _canvas = canvasGo.AddComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _canvas.sortingOrder = 100;
            canvasGo.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasGo.AddComponent<GraphicRaycaster>();

            var panel = CreateRect(canvasGo.transform, "Panel", new Color(0, 0, 0, 0.7f));
            panel.anchorMin = new Vector2(0.1f, 0.35f);
            panel.anchorMax = new Vector2(0.9f, 0.65f);
            panel.sizeDelta = Vector2.zero;

            var barBgRect = CreateRect(panel, "BarBG", new Color(0.15f, 0.15f, 0.15f));
            barBgRect.anchorMin = new Vector2(0.05f, 0.35f);
            barBgRect.anchorMax = new Vector2(0.95f, 0.65f);
            barBgRect.sizeDelta = Vector2.zero;
            _barBg = barBgRect.GetComponent<Image>();

            var zoneRect = CreateRect(barBgRect, "TargetZone", new Color(0.2f, 0.7f, 0.3f, 0.5f));
            _targetZone = zoneRect.GetComponent<Image>();

            var markerRect = CreateRect(barBgRect, "Marker", Color.white);
            _marker = markerRect.GetComponent<Image>();

            var roundGo = new GameObject("RoundText");
            roundGo.transform.SetParent(panel);
            _roundText = roundGo.AddComponent<TextMeshProUGUI>();
            _roundText.fontSize = 20;
            _roundText.alignment = TextAlignmentOptions.Center;
            _roundText.color = Color.white;
            var rr = _roundText.rectTransform;
            rr.anchorMin = new Vector2(0, 0.7f);
            rr.anchorMax = new Vector2(1, 1f);
            rr.sizeDelta = Vector2.zero;
            rr.anchoredPosition = Vector2.zero;

            var resultGo = new GameObject("ResultText");
            resultGo.transform.SetParent(panel);
            _resultText = resultGo.AddComponent<TextMeshProUGUI>();
            _resultText.fontSize = 28;
            _resultText.alignment = TextAlignmentOptions.Center;
            _resultText.fontStyle = FontStyles.Bold;
            var resRect = _resultText.rectTransform;
            resRect.anchorMin = new Vector2(0, 0);
            resRect.anchorMax = new Vector2(1, 0.3f);
            resRect.sizeDelta = Vector2.zero;
            resRect.anchoredPosition = Vector2.zero;
        }

        private RectTransform CreateRect(Transform parent, string name, Color color)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent);
            var img = go.AddComponent<Image>();
            img.color = color;
            var rt = img.rectTransform;
            rt.localScale = Vector3.one;
            rt.anchoredPosition = Vector2.zero;
            return rt;
        }
    }
}
