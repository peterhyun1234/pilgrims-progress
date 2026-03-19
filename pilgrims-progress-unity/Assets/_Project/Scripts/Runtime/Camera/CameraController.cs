using System.Collections;
using UnityEngine;
using PP.Core;

namespace PP.GameCamera
{
    public class CameraController : MonoBehaviour
    {
        public static CameraController Instance { get; private set; }

        [Header("Follow")]
        [SerializeField] private Transform _target;
        [SerializeField] private float _followSpeed = 6f;
        [SerializeField] private Vector2 _offset = new(0, 0.5f);

        [Header("Bounds")]
        [SerializeField] private bool _useBounds;
        [SerializeField] private Vector2 _boundsMin = new(-50, -50);
        [SerializeField] private Vector2 _boundsMax = new(50, 50);

        [Header("Pixel Perfect")]
        [SerializeField] private int _pixelsPerUnit = 16;

        [Header("Zoom")]
        [SerializeField] private float _defaultZoom = 5f;

        private UnityEngine.Camera _cam;
        private Vector3 _fixedPos;
        private Vector3 _prevFixedPos;
        private float _targetZoom;
        private float _zoomSpeed = 3f;

        private float _shakeTimer;
        private float _shakeIntensity;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;

            _cam = GetComponent<UnityEngine.Camera>();
            _fixedPos = transform.position;
            _prevFixedPos = _fixedPos;
            _targetZoom = _defaultZoom;

            ServiceLocator.RegisterTransient(this);
            EventBus.Subscribe<ScreenShakeEvent>(OnShake);
        }

        public void SetTarget(Transform target) => _target = target;

        private void FixedUpdate()
        {
            if (_target == null) return;

            _prevFixedPos = _fixedPos;
            Vector3 desired = (Vector3)_offset + _target.position;
            desired.z = transform.position.z;

            if (_useBounds)
                desired = ClampToBounds(desired);

            _fixedPos = Vector3.Lerp(_fixedPos, desired, _followSpeed * Time.fixedDeltaTime);
        }

        private void LateUpdate()
        {
            if (_target == null) return;

            float alpha = Mathf.Clamp01((Time.time - Time.fixedTime) / Time.fixedDeltaTime);
            Vector3 pos = Vector3.Lerp(_prevFixedPos, _fixedPos, alpha);

            pos = SnapToPixelGrid(pos);

            if (_shakeTimer > 0)
            {
                _shakeTimer -= Time.unscaledDeltaTime;
                Vector2 shake = Random.insideUnitCircle * _shakeIntensity;
                pos += (Vector3)shake;
            }

            transform.position = pos;

            if (_cam != null && !Mathf.Approximately(_cam.orthographicSize, _targetZoom))
                _cam.orthographicSize = Mathf.Lerp(_cam.orthographicSize, _targetZoom, _zoomSpeed * Time.deltaTime);
        }

        public Vector3 SnapToPixelGrid(Vector3 pos)
        {
            float ppu = _pixelsPerUnit;
            pos.x = Mathf.Round(pos.x * ppu) / ppu;
            pos.y = Mathf.Round(pos.y * ppu) / ppu;
            return pos;
        }

        private Vector3 ClampToBounds(Vector3 pos)
        {
            if (_cam == null) return pos;
            float halfH = _cam.orthographicSize;
            float halfW = halfH * _cam.aspect;
            pos.x = Mathf.Clamp(pos.x, _boundsMin.x + halfW, _boundsMax.x - halfW);
            pos.y = Mathf.Clamp(pos.y, _boundsMin.y + halfH, _boundsMax.y - halfH);
            return pos;
        }

        #region Effects

        public void Shake(float intensity, float duration)
        {
            _shakeIntensity = intensity;
            _shakeTimer = duration;
        }

        public void SetZoom(float zoom, float speed = 3f)
        {
            _targetZoom = zoom;
            _zoomSpeed = speed;
        }

        public void ResetZoom() => _targetZoom = _defaultZoom;

        public void FocusOn(Vector3 position, float duration = 1f)
        {
            StartCoroutine(FocusRoutine(position, duration));
        }

        private IEnumerator FocusRoutine(Vector3 position, float duration)
        {
            var original = _target;
            _target = null;

            Vector3 start = _fixedPos;
            Vector3 end = new(position.x + _offset.x, position.y + _offset.y, transform.position.z);
            float t = 0;

            while (t < duration)
            {
                t += Time.deltaTime;
                _fixedPos = Vector3.Lerp(start, end, Mathf.SmoothStep(0, 1, t / duration));
                _prevFixedPos = _fixedPos;
                yield return null;
            }

            yield return new WaitForSeconds(0.5f);
            _target = original;
        }

        private void OnShake(ScreenShakeEvent evt)
        {
            Shake(evt.Intensity, evt.Duration);
        }

        #endregion

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
            ServiceLocator.Unregister<CameraController>();
            EventBus.Unsubscribe<ScreenShakeEvent>(OnShake);
        }
    }
}
