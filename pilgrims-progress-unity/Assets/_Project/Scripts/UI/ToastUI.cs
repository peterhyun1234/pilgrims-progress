using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.UI
{
    public class ToastUI : MonoBehaviour
    {
        public static ToastUI Instance { get; private set; }

        private CanvasGroup _cg;
        private TextMeshProUGUI _text;
        private Coroutine _activeCoroutine;

        private void Awake()
        {
            Instance = this;
            BuildUI();
        }

        private void BuildUI()
        {
            var canvas = GetComponentInParent<Canvas>();
            if (canvas == null) return;

            var panelGo = new GameObject("ToastPanel");
            panelGo.transform.SetParent(canvas.transform, false);
            _cg = panelGo.AddComponent<CanvasGroup>();
            _cg.alpha = 0f;
            _cg.blocksRaycasts = false;

            var bg = panelGo.AddComponent<Image>();
            bg.color = new Color(0.05f, 0.05f, 0.1f, 0.85f);
            bg.raycastTarget = false;
            var rt = bg.rectTransform;
            rt.anchorMin = new Vector2(0.20f, 0.40f);
            rt.anchorMax = new Vector2(0.80f, 0.48f);
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;

            var textGo = new GameObject("Text");
            textGo.transform.SetParent(panelGo.transform, false);
            _text = textGo.AddComponent<TextMeshProUGUI>();
            _text.fontSize = 18;
            _text.color = new Color(1f, 0.9f, 0.6f);
            _text.alignment = TextAlignmentOptions.Center;
            var textRt = _text.rectTransform;
            textRt.anchorMin = new Vector2(0.05f, 0.1f);
            textRt.anchorMax = new Vector2(0.95f, 0.9f);
            textRt.sizeDelta = Vector2.zero;
        }

        public void Show(string message, float duration = 2.5f)
        {
            if (_text == null || _cg == null) return;
            _text.text = message;

            if (_activeCoroutine != null)
                StopCoroutine(_activeCoroutine);
            _activeCoroutine = StartCoroutine(ShowCoroutine(duration));
        }

        private IEnumerator ShowCoroutine(float duration)
        {
            float t = 0;
            while (t < 0.3f)
            {
                t += Time.deltaTime;
                _cg.alpha = Mathf.Clamp01(t / 0.3f);
                yield return null;
            }

            yield return new WaitForSeconds(duration);

            t = 0;
            while (t < 0.5f)
            {
                t += Time.deltaTime;
                _cg.alpha = 1f - Mathf.Clamp01(t / 0.5f);
                yield return null;
            }
            _cg.alpha = 0f;
        }
    }
}
