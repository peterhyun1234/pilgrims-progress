using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace PilgrimsProgress.Scene
{
    public class TransitionController : MonoBehaviour
    {
        private Canvas _canvas;
        private Image _overlay;
        private float _fadeDuration = 0.5f;

        private void Awake()
        {
            DontDestroyOnLoad(gameObject);
            Core.ServiceLocator.Register(this);
            CreateOverlay();
        }

        private void CreateOverlay()
        {
            var go = new GameObject("[TransitionOverlay]");
            go.transform.SetParent(transform);
            _canvas = go.AddComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _canvas.sortingOrder = 9999;
            go.AddComponent<CanvasScaler>();
            go.AddComponent<GraphicRaycaster>();
            DontDestroyOnLoad(go);

            var imgGo = new GameObject("Overlay");
            imgGo.transform.SetParent(go.transform, false);
            _overlay = imgGo.AddComponent<Image>();
            _overlay.color = new Color(0, 0, 0, 0);
            _overlay.raycastTarget = true;

            var rt = _overlay.rectTransform;
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            _canvas.gameObject.SetActive(false);
        }

        public Coroutine FadeOut(float duration = -1f)
        {
            return StartCoroutine(Fade(0f, 1f, duration > 0 ? duration : _fadeDuration));
        }

        public Coroutine FadeIn(float duration = -1f)
        {
            return StartCoroutine(Fade(1f, 0f, duration > 0 ? duration : _fadeDuration));
        }

        private IEnumerator Fade(float from, float to, float duration)
        {
            _canvas.gameObject.SetActive(true);
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                float alpha = Mathf.Lerp(from, to, t);
                _overlay.color = new Color(0, 0, 0, alpha);
                yield return null;
            }

            _overlay.color = new Color(0, 0, 0, to);

            if (to <= 0f)
            {
                _canvas.gameObject.SetActive(false);
            }
        }

        public void SetFadeDuration(float duration)
        {
            _fadeDuration = duration;
        }
    }
}
