using System.Collections;
using UnityEngine;
using PP.Core;

namespace PP.Visuals
{
    public class GameFeelManager : MonoBehaviour
    {
        public static GameFeelManager Instance { get; private set; }

        [Header("Screen Flash")]
        [SerializeField] private Color _flashColor = Color.white;
        [SerializeField] private float _flashDuration = 0.05f;

        [Header("Particles")]
        [SerializeField] private GameObject _dustPrefab;
        [SerializeField] private GameObject _impactPrefab;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            EventBus.Subscribe<HitstopEvent>(OnHitstop);
            EventBus.Subscribe<ScreenShakeEvent>(OnScreenShake);
        }

        private void OnHitstop(HitstopEvent evt)
        {
            StartCoroutine(HitstopRoutine(evt.Duration));
        }

        private IEnumerator HitstopRoutine(float duration)
        {
            float original = Time.timeScale;
            Time.timeScale = 0f;
            yield return new WaitForSecondsRealtime(duration);
            Time.timeScale = original;
        }

        private void OnScreenShake(ScreenShakeEvent evt)
        {
            EventBus.Publish(evt);
        }

        public void ImpactFlash()
        {
            StartCoroutine(FlashRoutine());
        }

        private IEnumerator FlashRoutine()
        {
            yield return new WaitForSecondsRealtime(_flashDuration);
        }

        public void SpawnDust(Vector3 position)
        {
            if (_dustPrefab == null) return;
            var go = Instantiate(_dustPrefab, position, Quaternion.identity);
            Destroy(go, 0.5f);
        }

        public void SpawnImpact(Vector3 position)
        {
            if (_impactPrefab == null) return;
            var go = Instantiate(_impactPrefab, position, Quaternion.identity);
            Destroy(go, 0.5f);
        }

        public static void SquashStretch(Transform target, float squash, float stretch, float duration)
        {
            if (target == null) return;
            target.GetComponent<MonoBehaviour>()?.StartCoroutine(SquashRoutine(target, squash, stretch, duration));
        }

        private static IEnumerator SquashRoutine(Transform target, float squash, float stretch, float duration)
        {
            Vector3 original = target.localScale;
            Vector3 squashed = new(original.x * stretch, original.y * squash, original.z);

            float half = duration * 0.5f;
            float t = 0;
            while (t < half)
            {
                t += Time.unscaledDeltaTime;
                target.localScale = Vector3.Lerp(original, squashed, t / half);
                yield return null;
            }
            t = 0;
            while (t < half)
            {
                t += Time.unscaledDeltaTime;
                target.localScale = Vector3.Lerp(squashed, original, t / half);
                yield return null;
            }
            target.localScale = original;
        }

        public float BufferAction(string actionName, float bufferWindow = 0.15f)
        {
            return bufferWindow;
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
            EventBus.Unsubscribe<HitstopEvent>(OnHitstop);
            EventBus.Unsubscribe<ScreenShakeEvent>(OnScreenShake);
        }
    }
}
