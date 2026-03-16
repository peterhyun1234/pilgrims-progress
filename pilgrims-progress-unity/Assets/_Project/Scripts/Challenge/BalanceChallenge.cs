using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.InputSystem;

namespace PilgrimsProgress.Challenge
{
    /// <summary>
    /// Balance-keeping QTE — Valley of the Shadow of Death.
    /// A balance indicator sways; player must press left/right
    /// to keep it centered for a required duration.
    /// </summary>
    public class BalanceChallenge : BaseChallenge
    {
        [Header("Settings")]
        [SerializeField] private float _duration = 10f;
        [SerializeField] private float _swayForce = 3f;
        [SerializeField] private float _swayIncrease = 0.2f;
        [SerializeField] private float _playerForce = 5f;
        [SerializeField] private float _failThreshold = 1f;

        [Header("UI")]
        [SerializeField] private Canvas _canvas;

        private float _position;
        private float _velocity;
        private float _elapsed;
        private float _currentSway;
        private bool _running;

        private Image _balanceMarker;
        private Image _dangerZoneLeft;
        private Image _dangerZoneRight;
        private Image _timerBar;
        private TextMeshProUGUI _statusText;

        protected override void OnInitialize()
        {
            SetupUI();
            _position = 0f;
            _velocity = 0f;
            _currentSway = _swayForce;
            _running = true;
        }

        private void Update()
        {
            if (!_running) return;

            _elapsed += Time.deltaTime;
            _currentSway = _swayForce + _elapsed * _swayIncrease;

            // Random sway
            _velocity += (Random.Range(-1f, 1f) * _currentSway) * Time.deltaTime;

            // Player input
            var kb = Keyboard.current;
            if (kb != null)
            {
                if (kb.leftArrowKey.isPressed || kb.aKey.isPressed)
                    _velocity -= _playerForce * Time.deltaTime;
                if (kb.rightArrowKey.isPressed || kb.dKey.isPressed)
                    _velocity += _playerForce * Time.deltaTime;
            }

            _velocity *= 0.95f; // damping
            _position += _velocity * Time.deltaTime;

            // Update visuals
            if (_balanceMarker != null)
            {
                float normalizedPos = Mathf.Clamp(_position / _failThreshold, -1f, 1f);
                float anchorX = 0.5f + normalizedPos * 0.4f;
                _balanceMarker.rectTransform.anchorMin = new Vector2(anchorX - 0.02f, 0.1f);
                _balanceMarker.rectTransform.anchorMax = new Vector2(anchorX + 0.02f, 0.9f);

                float danger = Mathf.Abs(normalizedPos);
                _balanceMarker.color = Color.Lerp(Color.white, Color.red, danger);
            }

            if (_timerBar != null)
                _timerBar.fillAmount = _elapsed / _duration;

            if (Mathf.Abs(_position) >= _failThreshold)
            {
                _running = false;
                if (_statusText != null) { _statusText.text = "FELL!"; _statusText.color = Color.red; }
                Invoke(nameof(FailAndEnd), 0.5f);
                return;
            }

            if (_elapsed >= _duration)
            {
                _running = false;
                if (_statusText != null) { _statusText.text = "SAFE!"; _statusText.color = Color.green; }
                Invoke(nameof(SuccessAndEnd), 0.5f);
            }
        }

        private void FailAndEnd() => CompleteFail();
        private void SuccessAndEnd() => CompleteSuccess();

        private void SetupUI()
        {
            if (_canvas != null) return;

            var canvasGo = new GameObject("BalanceChallengeCanvas");
            canvasGo.transform.SetParent(transform);
            _canvas = canvasGo.AddComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _canvas.sortingOrder = 100;
            canvasGo.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasGo.AddComponent<GraphicRaycaster>();

            var panelGo = new GameObject("Panel");
            panelGo.transform.SetParent(canvasGo.transform);
            var panelImg = panelGo.AddComponent<Image>();
            panelImg.color = new Color(0, 0, 0, 0.75f);
            var pr = panelImg.rectTransform;
            pr.anchorMin = new Vector2(0.1f, 0.3f);
            pr.anchorMax = new Vector2(0.9f, 0.7f);
            pr.sizeDelta = Vector2.zero;

            // Balance bar background
            var barBg = new GameObject("BarBG");
            barBg.transform.SetParent(panelGo.transform);
            var barImg = barBg.AddComponent<Image>();
            barImg.color = new Color(0.15f, 0.15f, 0.15f);
            var barRect = barImg.rectTransform;
            barRect.anchorMin = new Vector2(0.05f, 0.35f);
            barRect.anchorMax = new Vector2(0.95f, 0.65f);
            barRect.sizeDelta = Vector2.zero;

            // Center line
            var center = new GameObject("Center");
            center.transform.SetParent(barBg.transform);
            var centerImg = center.AddComponent<Image>();
            centerImg.color = new Color(1, 1, 1, 0.3f);
            var cr = centerImg.rectTransform;
            cr.anchorMin = new Vector2(0.495f, 0);
            cr.anchorMax = new Vector2(0.505f, 1);
            cr.sizeDelta = Vector2.zero;

            // Danger zones
            var dzl = new GameObject("DangerLeft");
            dzl.transform.SetParent(barBg.transform);
            _dangerZoneLeft = dzl.AddComponent<Image>();
            _dangerZoneLeft.color = new Color(1, 0, 0, 0.3f);
            _dangerZoneLeft.rectTransform.anchorMin = new Vector2(0, 0);
            _dangerZoneLeft.rectTransform.anchorMax = new Vector2(0.1f, 1);
            _dangerZoneLeft.rectTransform.sizeDelta = Vector2.zero;

            var dzr = new GameObject("DangerRight");
            dzr.transform.SetParent(barBg.transform);
            _dangerZoneRight = dzr.AddComponent<Image>();
            _dangerZoneRight.color = new Color(1, 0, 0, 0.3f);
            _dangerZoneRight.rectTransform.anchorMin = new Vector2(0.9f, 0);
            _dangerZoneRight.rectTransform.anchorMax = new Vector2(1, 1);
            _dangerZoneRight.rectTransform.sizeDelta = Vector2.zero;

            // Balance marker
            var markerGo = new GameObject("Marker");
            markerGo.transform.SetParent(barBg.transform);
            _balanceMarker = markerGo.AddComponent<Image>();
            _balanceMarker.color = Color.white;
            _balanceMarker.rectTransform.anchorMin = new Vector2(0.48f, 0.1f);
            _balanceMarker.rectTransform.anchorMax = new Vector2(0.52f, 0.9f);
            _balanceMarker.rectTransform.sizeDelta = Vector2.zero;

            // Timer bar
            var timerBg = new GameObject("TimerBG");
            timerBg.transform.SetParent(panelGo.transform);
            var timerBgImg = timerBg.AddComponent<Image>();
            timerBgImg.color = new Color(0.2f, 0.2f, 0.2f);
            var tbr = timerBgImg.rectTransform;
            tbr.anchorMin = new Vector2(0.05f, 0.2f);
            tbr.anchorMax = new Vector2(0.95f, 0.28f);
            tbr.sizeDelta = Vector2.zero;

            var timerFill = new GameObject("TimerFill");
            timerFill.transform.SetParent(timerBg.transform);
            _timerBar = timerFill.AddComponent<Image>();
            _timerBar.color = new Color(0.3f, 0.7f, 0.9f);
            _timerBar.type = Image.Type.Filled;
            _timerBar.fillMethod = Image.FillMethod.Horizontal;
            _timerBar.fillAmount = 0f;
            _timerBar.rectTransform.anchorMin = Vector2.zero;
            _timerBar.rectTransform.anchorMax = Vector2.one;
            _timerBar.rectTransform.sizeDelta = Vector2.zero;

            // Status text
            var statusGo = new GameObject("StatusText");
            statusGo.transform.SetParent(panelGo.transform);
            _statusText = statusGo.AddComponent<TextMeshProUGUI>();
            _statusText.fontSize = 24;
            _statusText.alignment = TextAlignmentOptions.Center;
            _statusText.color = Color.white;
            _statusText.text = "← BALANCE →";
            var str = _statusText.rectTransform;
            str.anchorMin = new Vector2(0, 0.7f);
            str.anchorMax = new Vector2(1, 1);
            str.sizeDelta = Vector2.zero;
            str.anchoredPosition = Vector2.zero;
            str.localScale = Vector3.one;
        }
    }
}
