using UnityEngine;
using UnityEngine.Rendering.Universal;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.Player
{
    public class TopDownCamera : MonoBehaviour
    {
        [Header("Follow")]
        [SerializeField] private Transform _target;
        [SerializeField] private float _smoothSpeed = 8f;
        [SerializeField] private Vector3 _offset = new Vector3(0, 0, -10f);

        [Header("Bounds")]
        [SerializeField] private bool _useBounds;
        [SerializeField] private Vector2 _boundsMin;
        [SerializeField] private Vector2 _boundsMax;

        [Header("Zoom")]
        [SerializeField] private float _dialogueZoomSize = 3.5f;
        [SerializeField] private float _defaultZoomSize = 5f;
        [SerializeField] private float _zoomSpeed = 3f;

        public const int PPU = 16;
        private const int RefResX = 320;
        private const int RefResY = 180;

        private Camera _cam;
        private PixelPerfectCamera _pixelPerfect;
        private float _targetSize;
        private Vector3 _dialogueFocusOffset;
        private bool _inDialogue;

        private float _shakeTimer;
        private float _shakeMagnitude;
        private float _shakeFrequency = 25f;
        private Vector3 _shakeOffset;

        private float _impactZoomTimer;
        private float _impactZoomAmount;

        // Cinematic pan
        private bool _cinematicActive;
        private Vector3 _cinematicTarget;
        private float _cinematicSpeed;

        // Letterbox
        private GameObject _letterboxTop;
        private GameObject _letterboxBot;
        private float _letterboxAmount;
        private float _letterboxTarget;

        public static TopDownCamera Instance { get; private set; }
        public PixelPerfectCamera PixelPerfect => _pixelPerfect;
        public Camera Cam => _cam;

        private void Awake()
        {
            Instance = this;
            _cam = GetComponent<Camera>();
            if (_cam != null)
                _targetSize = _cam.orthographicSize;

            SetupPixelPerfect();

            var modeManager = ServiceLocator.Get<GameModeManager>();
            if (modeManager != null)
                modeManager.OnModeChanged += HandleModeChanged;
        }

        private void SetupPixelPerfect()
        {
            _pixelPerfect = GetComponent<PixelPerfectCamera>();
            if (_pixelPerfect == null)
                _pixelPerfect = gameObject.AddComponent<PixelPerfectCamera>();

            _pixelPerfect.assetsPPU = PPU;
            _pixelPerfect.refResolutionX = RefResX;
            _pixelPerfect.refResolutionY = RefResY;
            _pixelPerfect.gridSnapping = PixelPerfectCamera.GridSnapping.PixelSnapping;
            _pixelPerfect.cropFrame = PixelPerfectCamera.CropFrame.Pillarbox;
        }

        private void LateUpdate()
        {
            if (_target == null) return;

            Vector3 desiredPos;
            if (_cinematicActive)
            {
                desiredPos = _cinematicTarget + _offset;
            }
            else if (_inDialogue && _dialogueFocusOffset != Vector3.zero)
            {
                desiredPos = _target.position + _dialogueFocusOffset + _offset;
            }
            else
            {
                desiredPos = _target.position + _offset;
            }

            if (_useBounds && _cam != null)
            {
                float camH = _cam.orthographicSize;
                float camW = camH * _cam.aspect;
                desiredPos.x = Mathf.Clamp(desiredPos.x, _boundsMin.x + camW, _boundsMax.x - camW);
                desiredPos.y = Mathf.Clamp(desiredPos.y, _boundsMin.y + camH, _boundsMax.y - camH);
            }

            float followSpeed = _inDialogue || _cinematicActive ? _smoothSpeed * 0.6f : _smoothSpeed;
            Vector3 smoothed = Vector3.Lerp(transform.position, desiredPos, followSpeed * Time.deltaTime);

            smoothed = SnapToPixelGrid(smoothed);
            transform.position = smoothed;

            if (_shakeTimer > 0)
            {
                _shakeTimer -= Time.deltaTime;
                float decay = _shakeTimer;
                float ox = Mathf.PerlinNoise(Time.time * _shakeFrequency, 0f) * 2f - 1f;
                float oy = Mathf.PerlinNoise(0f, Time.time * _shakeFrequency) * 2f - 1f;
                _shakeOffset = new Vector3(ox, oy, 0) * _shakeMagnitude * decay;
                transform.position += _shakeOffset;
            }

            if (_cam != null)
            {
                float targetZoom = _targetSize;
                if (_impactZoomTimer > 0)
                {
                    _impactZoomTimer -= Time.deltaTime;
                    targetZoom -= _impactZoomAmount * _impactZoomTimer;
                }
                _cam.orthographicSize = Mathf.Lerp(_cam.orthographicSize, targetZoom, _zoomSpeed * Time.deltaTime);

                bool needsZoomControl = Mathf.Abs(_cam.orthographicSize - _defaultZoomSize) > 0.15f
                                        || _impactZoomTimer > 0;
                if (_pixelPerfect != null)
                    _pixelPerfect.enabled = !needsZoomControl;
            }

            UpdateLetterbox();
        }

        public static Vector3 SnapToPixelGrid(Vector3 pos)
        {
            pos.x = Mathf.Round(pos.x * PPU) / (float)PPU;
            pos.y = Mathf.Round(pos.y * PPU) / (float)PPU;
            return pos;
        }

        public void SetTarget(Transform target) => _target = target;

        public void SetBounds(Vector2 min, Vector2 max)
        {
            _useBounds = true;
            _boundsMin = min;
            _boundsMax = max;
        }

        public void Shake(float magnitude = 0.15f, float duration = 0.3f)
        {
            _shakeMagnitude = magnitude;
            _shakeTimer = duration;
        }

        public void ImpactZoom(float amount = 0.5f, float duration = 0.25f)
        {
            _impactZoomAmount = amount;
            _impactZoomTimer = duration;
        }

        public void FocusBetween(Vector3 pointA, Vector3 pointB)
        {
            Vector3 mid = (pointA + pointB) * 0.5f;
            if (_target != null)
                _dialogueFocusOffset = mid - _target.position;
        }

        public void CinematicPan(Vector3 worldTarget, float speed = 4f)
        {
            _cinematicActive = true;
            _cinematicTarget = worldTarget;
            _cinematicSpeed = speed;
        }

        public void EndCinematicPan()
        {
            _cinematicActive = false;
        }

        public void SetLetterbox(float amount)
        {
            _letterboxTarget = Mathf.Clamp01(amount);
            EnsureLetterboxBars();
        }

        private void EnsureLetterboxBars()
        {
            if (_letterboxTop != null) return;

            var canvas = GetLetterboxCanvas();
            if (canvas == null) return;

            _letterboxTop = CreateLetterboxBar(canvas.transform, "LetterboxTop",
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, 1));
            _letterboxBot = CreateLetterboxBar(canvas.transform, "LetterboxBot",
                new Vector2(0, 0), new Vector2(1, 0), new Vector2(0, 0));
        }

        private Canvas GetLetterboxCanvas()
        {
            var existing = GameObject.Find("LetterboxCanvas");
            if (existing != null) return existing.GetComponent<Canvas>();

            var go = new GameObject("LetterboxCanvas");
            var c = go.AddComponent<Canvas>();
            c.renderMode = RenderMode.ScreenSpaceOverlay;
            c.sortingOrder = 100;
            return c;
        }

        private GameObject CreateLetterboxBar(Transform parent, string name,
            Vector2 anchorMin, Vector2 anchorMax, Vector2 pivot)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var img = go.AddComponent<UnityEngine.UI.Image>();
            img.color = Color.black;
            img.raycastTarget = false;
            var rt = img.rectTransform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.pivot = pivot;
            rt.sizeDelta = new Vector2(0, 0);
            return go;
        }

        private void UpdateLetterbox()
        {
            _letterboxAmount = Mathf.Lerp(_letterboxAmount, _letterboxTarget, 4f * Time.deltaTime);
            if (_letterboxTop == null) return;

            float barHeight = Screen.height * 0.12f * _letterboxAmount;
            _letterboxTop.GetComponent<RectTransform>().sizeDelta = new Vector2(0, barHeight);
            _letterboxBot.GetComponent<RectTransform>().sizeDelta = new Vector2(0, barHeight);
        }

        private void HandleModeChanged(GameMode previous, GameMode current)
        {
            if (current == GameMode.Dialogue)
            {
                _inDialogue = true;
                _targetSize = _dialogueZoomSize;

                var modeManager = ServiceLocator.Get<GameModeManager>();
                var focusTarget = modeManager?.GetDialogueFocusTarget();
                if (focusTarget != null && _target != null)
                {
                    Vector3 mid = (_target.position + focusTarget.position) * 0.5f;
                    _dialogueFocusOffset = mid - _target.position;
                }
            }
            else if (current == GameMode.Exploration)
            {
                _inDialogue = false;
                _targetSize = _defaultZoomSize;
                _dialogueFocusOffset = Vector3.zero;
                EndCinematicPan();
                SetLetterbox(0);
            }
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
            var modeManager = ServiceLocator.Get<GameModeManager>();
            if (modeManager != null)
                modeManager.OnModeChanged -= HandleModeChanged;
        }
    }
}
