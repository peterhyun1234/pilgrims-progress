using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace PilgrimsProgress.Visuals
{
    public class ScreenFlash : MonoBehaviour
    {
        public static ScreenFlash Instance { get; private set; }

        private Image _flashImage;

        private void Awake()
        {
            Instance = this;

            var go = new GameObject("FlashOverlay");
            go.transform.SetParent(transform, false);
            _flashImage = go.AddComponent<Image>();
            _flashImage.color = Color.clear;
            _flashImage.raycastTarget = false;
            var rt = _flashImage.rectTransform;
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.sizeDelta = Vector2.zero;
        }

        public void Flash(Color color, float duration = 0.3f)
        {
            StartCoroutine(FlashCoroutine(color, duration));
        }

        public void FlashBuff() => Flash(new Color(1f, 0.9f, 0.4f, 0.25f), 0.3f);
        public void FlashDebuff() => Flash(new Color(0.8f, 0.1f, 0.1f, 0.3f), 0.4f);
        public void FlashHeal() => Flash(new Color(0.3f, 1f, 0.4f, 0.2f), 0.3f);
        public void FlashHoly() => Flash(new Color(1f, 1f, 0.8f, 0.35f), 0.5f);

        private IEnumerator FlashCoroutine(Color color, float duration)
        {
            _flashImage.color = color;
            float t = 0;
            while (t < duration)
            {
                t += Time.deltaTime;
                float alpha = color.a * (1f - t / duration);
                _flashImage.color = new Color(color.r, color.g, color.b, alpha);
                yield return null;
            }
            _flashImage.color = Color.clear;
        }
    }
}
