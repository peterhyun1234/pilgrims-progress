using UnityEngine;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.Player
{
    /// <summary>
    /// Simple follow camera for top-down view.
    /// Falls back gracefully if Cinemachine is not available.
    /// </summary>
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

        [Header("Dialogue Focus")]
        [SerializeField] private float _dialogueZoomSize = 3.5f;
        [SerializeField] private float _defaultZoomSize = 5f;
        [SerializeField] private float _zoomSpeed = 3f;

        private Camera _cam;
        private float _targetSize;

        private void Awake()
        {
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

            Vector3 desiredPos = _target.position + _offset;

            if (_useBounds && _cam != null)
            {
                float camH = _cam.orthographicSize;
                float camW = camH * _cam.aspect;
                desiredPos.x = Mathf.Clamp(desiredPos.x, _boundsMin.x + camW, _boundsMax.x - camW);
                desiredPos.y = Mathf.Clamp(desiredPos.y, _boundsMin.y + camH, _boundsMax.y - camH);
            }

            transform.position = Vector3.Lerp(transform.position, desiredPos, _smoothSpeed * Time.deltaTime);

            if (_cam != null)
            {
                _cam.orthographicSize = Mathf.Lerp(_cam.orthographicSize, _targetSize, _zoomSpeed * Time.deltaTime);
            }
        }

        public void SetTarget(Transform target)
        {
            _target = target;
        }

        public void SetBounds(Vector2 min, Vector2 max)
        {
            _useBounds = true;
            _boundsMin = min;
            _boundsMax = max;
        }

        private void HandleModeChanged(GameMode previous, GameMode current)
        {
            if (current == GameMode.Dialogue)
            {
                _targetSize = _dialogueZoomSize;

                var modeManager = ServiceLocator.Get<GameModeManager>();
                var focusTarget = modeManager?.GetDialogueFocusTarget();
                if (focusTarget != null && _target != null)
                {
                    // Midpoint between player and NPC
                }
            }
            else if (current == GameMode.Exploration)
            {
                _targetSize = _defaultZoomSize;
            }
        }

        private void OnDestroy()
        {
            var modeManager = ServiceLocator.Get<GameModeManager>();
            if (modeManager != null)
                modeManager.OnModeChanged -= HandleModeChanged;
        }
    }
}
