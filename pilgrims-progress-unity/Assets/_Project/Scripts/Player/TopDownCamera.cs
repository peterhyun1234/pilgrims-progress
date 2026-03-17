using UnityEngine;
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

        private Camera _cam;
        private float _targetSize;
        private Vector3 _dialogueFocusOffset;
        private bool _inDialogue;

        // Shake state
        private float _shakeTimer;
        private float _shakeMagnitude;
        private float _shakeFrequency = 25f;
        private Vector3 _shakeOffset;

        // Impact zoom
        private float _impactZoomTimer;
        private float _impactZoomAmount;

        public static TopDownCamera Instance { get; private set; }

        private void Awake()
        {
            Instance = this;
            _cam = GetComponent<Camera>();
            if (_cam != null)
                _targetSize = _cam.orthographicSize;

            var modeManager = ServiceLocator.Get<GameModeManager>();
            if (modeManager != null)
                modeManager.OnModeChanged += HandleModeChanged;
        }

        private void LateUpdate()
        {
            if (_target == null) return;

            Vector3 desiredPos;
            if (_inDialogue && _dialogueFocusOffset != Vector3.zero)
                desiredPos = _target.position + _dialogueFocusOffset + _offset;
            else
                desiredPos = _target.position + _offset;

            if (_useBounds && _cam != null)
            {
                float camH = _cam.orthographicSize;
                float camW = camH * _cam.aspect;
                desiredPos.x = Mathf.Clamp(desiredPos.x, _boundsMin.x + camW, _boundsMax.x - camW);
                desiredPos.y = Mathf.Clamp(desiredPos.y, _boundsMin.y + camH, _boundsMax.y - camH);
            }

            float followSpeed = _inDialogue ? _smoothSpeed * 0.6f : _smoothSpeed;
            transform.position = Vector3.Lerp(transform.position, desiredPos, followSpeed * Time.deltaTime);

            // Shake
            if (_shakeTimer > 0)
            {
                _shakeTimer -= Time.deltaTime;
                float decay = _shakeTimer;
                float ox = Mathf.PerlinNoise(Time.time * _shakeFrequency, 0f) * 2f - 1f;
                float oy = Mathf.PerlinNoise(0f, Time.time * _shakeFrequency) * 2f - 1f;
                _shakeOffset = new Vector3(ox, oy, 0) * _shakeMagnitude * decay;
                transform.position += _shakeOffset;
            }

            // Zoom
            if (_cam != null)
            {
                float targetZoom = _targetSize;
                if (_impactZoomTimer > 0)
                {
                    _impactZoomTimer -= Time.deltaTime;
                    float progress = _impactZoomTimer; // linear decay
                    targetZoom -= _impactZoomAmount * progress;
                }
                _cam.orthographicSize = Mathf.Lerp(_cam.orthographicSize, targetZoom, _zoomSpeed * Time.deltaTime);
            }
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
