using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using PP.Core;

namespace PP.Visuals
{
    public class ScreenEffects : MonoBehaviour
    {
        public static ScreenEffects Instance { get; private set; }

        [Header("Flash")]
        [SerializeField] private Image _flashOverlay;

        [Header("Letterbox")]
        [SerializeField] private RectTransform _letterboxTop;
        [SerializeField] private RectTransform _letterboxBottom;
        [SerializeField] private float _letterboxHeight = 60f;

        [Header("Tint")]
        [SerializeField] private Image _tintOverlay;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;

            if (_flashOverlay != null)
            {
                _flashOverlay.color = Color.clear;
                _flashOverlay.raycastTarget = false;
            }
            if (_tintOverlay != null)
            {
                _tintOverlay.color = Color.clear;
                _tintOverlay.raycastTarget = false;
            }

            ServiceLocator.RegisterTransient(this);
        }

        public void Flash(Color color, float duration = 0.08f)
        {
            StartCoroutine(FlashRoutine(color, duration));
        }

        private IEnumerator FlashRoutine(Color color, float duration)
        {
            if (_flashOverlay == null) yield break;
            _flashOverlay.color = color;
            float t = 0;
            while (t < duration)
            {
                t += Time.unscaledDeltaTime;
                float a = Mathf.Lerp(1, 0, t / duration);
                _flashOverlay.color = new Color(color.r, color.g, color.b, a);
                yield return null;
            }
            _flashOverlay.color = Color.clear;
        }

        public void ShowLetterbox(float duration = 0.3f)
        {
            StartCoroutine(LetterboxRoutine(true, duration));
        }

        public void HideLetterbox(float duration = 0.3f)
        {
            StartCoroutine(LetterboxRoutine(false, duration));
        }

        private IEnumerator LetterboxRoutine(bool show, float duration)
        {
            if (_letterboxTop == null || _letterboxBottom == null) yield break;

            float from = show ? 0 : _letterboxHeight;
            float to = show ? _letterboxHeight : 0;
            float t = 0;

            while (t < duration)
            {
                t += Time.unscaledDeltaTime;
                float h = Mathf.Lerp(from, to, Mathf.SmoothStep(0, 1, t / duration));
                _letterboxTop.sizeDelta = new Vector2(0, h);
                _letterboxBottom.sizeDelta = new Vector2(0, h);
                yield return null;
            }

            _letterboxTop.sizeDelta = new Vector2(0, to);
            _letterboxBottom.sizeDelta = new Vector2(0, to);
        }

        public void SetTint(Color color, float fadeDuration = 0.5f)
        {
            StartCoroutine(TintRoutine(color, fadeDuration));
        }

        public void ClearTint(float fadeDuration = 0.3f)
        {
            SetTint(Color.clear, fadeDuration);
        }

        private IEnumerator TintRoutine(Color target, float duration)
        {
            if (_tintOverlay == null) yield break;
            Color start = _tintOverlay.color;
            float t = 0;
            while (t < duration)
            {
                t += Time.unscaledDeltaTime;
                _tintOverlay.color = Color.Lerp(start, target, t / duration);
                yield return null;
            }
            _tintOverlay.color = target;
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }
    }
}
