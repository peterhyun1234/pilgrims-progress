using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace PilgrimsProgress.UI
{
    public class TitleScreenAnimator : MonoBehaviour
    {
        private static readonly Color ParticleGold = new Color(0.95f, 0.82f, 0.45f);
        private static readonly Color ParticleWhite = new Color(0.85f, 0.88f, 0.95f);

        private const int MaxParticles = 30;
        private const float ParticleSpawnInterval = 0.25f;

        private RectTransform _canvasRect;
        private readonly List<ParticleMote> _motes = new List<ParticleMote>();
        private float _spawnTimer;

        private TextMeshProUGUI _titleText;
        private TextMeshProUGUI _subtitleText;
        private readonly List<CanvasGroup> _buttonGroups = new List<CanvasGroup>();
        private Image _bgImage;
        private RectTransform _bgRect;
        private CanvasGroup _particleContainer;

        private float _bgDriftPhase;

        private struct ParticleMote
        {
            public RectTransform Rect;
            public Image Img;
            public float Life;
            public float MaxLife;
            public float Speed;
            public float SwayFreq;
            public float SwayAmp;
            public float StartX;
        }

        public void Initialize(
            RectTransform canvasRect,
            TextMeshProUGUI titleText,
            TextMeshProUGUI subtitleText,
            List<Button> buttons,
            Image bgImage)
        {
            _canvasRect = canvasRect;
            _titleText = titleText;
            _subtitleText = subtitleText;
            _bgImage = bgImage;
            _bgRect = bgImage?.rectTransform;

            foreach (var btn in buttons)
            {
                if (btn == null) continue;
                var cg = btn.gameObject.GetComponent<CanvasGroup>();
                if (cg == null) cg = btn.gameObject.AddComponent<CanvasGroup>();
                _buttonGroups.Add(cg);
            }

            var containerGo = new GameObject("ParticleContainer");
            containerGo.transform.SetParent(_canvasRect, false);
            containerGo.transform.SetAsFirstSibling();
            containerGo.transform.SetSiblingIndex(1);
            var crt = containerGo.AddComponent<RectTransform>();
            crt.anchorMin = Vector2.zero;
            crt.anchorMax = Vector2.one;
            crt.sizeDelta = Vector2.zero;
            _particleContainer = containerGo.AddComponent<CanvasGroup>();
            _particleContainer.blocksRaycasts = false;
            _particleContainer.interactable = false;

            StartCoroutine(IntroSequence());
        }

        private IEnumerator IntroSequence()
        {
            if (_titleText != null)
            {
                _titleText.alpha = 0f;
                _titleText.transform.localScale = Vector3.one * 0.85f;
            }
            if (_subtitleText != null)
                _subtitleText.alpha = 0f;

            foreach (var cg in _buttonGroups)
            {
                cg.alpha = 0f;
                cg.transform.localPosition += Vector3.right * 40f;
            }

            yield return new WaitForSeconds(0.3f);

            if (_titleText != null)
            {
                float elapsed = 0f;
                float duration = 0.8f;
                while (elapsed < duration)
                {
                    elapsed += Time.deltaTime;
                    float t = Mathf.Clamp01(elapsed / duration);
                    float ease = EaseOutBack(t);
                    _titleText.alpha = t;
                    _titleText.transform.localScale = Vector3.one * Mathf.Lerp(0.85f, 1f, ease);
                    yield return null;
                }
                _titleText.alpha = 1f;
                _titleText.transform.localScale = Vector3.one;
            }

            yield return new WaitForSeconds(0.15f);

            if (_subtitleText != null)
            {
                float elapsed = 0f;
                float duration = 0.5f;
                while (elapsed < duration)
                {
                    elapsed += Time.deltaTime;
                    float t = Mathf.Clamp01(elapsed / duration);
                    _subtitleText.alpha = t;
                    yield return null;
                }
                _subtitleText.alpha = 1f;
            }

            yield return new WaitForSeconds(0.1f);

            for (int i = 0; i < _buttonGroups.Count; i++)
            {
                StartCoroutine(AnimateButtonIn(_buttonGroups[i], i * 0.07f));
            }
        }

        private IEnumerator AnimateButtonIn(CanvasGroup cg, float delay)
        {
            yield return new WaitForSeconds(delay);

            Vector3 startPos = cg.transform.localPosition;
            Vector3 targetPos = startPos - Vector3.right * 40f;
            float elapsed = 0f;
            float duration = 0.35f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                float ease = EaseOutCubic(t);
                cg.alpha = t;
                cg.transform.localPosition = Vector3.Lerp(startPos, targetPos, ease);
                yield return null;
            }

            cg.alpha = 1f;
            cg.transform.localPosition = targetPos;
        }

        private void Update()
        {
            UpdateParticles();
            UpdateBackgroundDrift();
            UpdateTitlePulse();
        }

        private void UpdateParticles()
        {
            _spawnTimer += Time.deltaTime;
            if (_spawnTimer >= ParticleSpawnInterval && _motes.Count < MaxParticles)
            {
                _spawnTimer = 0f;
                SpawnMote();
            }

            for (int i = _motes.Count - 1; i >= 0; i--)
            {
                var m = _motes[i];
                m.Life += Time.deltaTime;

                if (m.Life >= m.MaxLife || m.Rect == null)
                {
                    if (m.Rect != null) Destroy(m.Rect.gameObject);
                    _motes.RemoveAt(i);
                    continue;
                }

                float lifeT = m.Life / m.MaxLife;
                float alpha = lifeT < 0.2f ? lifeT / 0.2f
                    : lifeT > 0.7f ? (1f - lifeT) / 0.3f
                    : 1f;
                alpha *= 0.6f;

                var c = m.Img.color;
                c.a = alpha;
                m.Img.color = c;

                float canvasH = _canvasRect != null ? _canvasRect.rect.height : 1080f;
                float yOffset = m.Speed * m.Life;
                float xSway = Mathf.Sin(m.Life * m.SwayFreq) * m.SwayAmp;
                m.Rect.anchoredPosition = new Vector2(m.StartX + xSway, yOffset - canvasH * 0.1f);

                float scaleT = 1f + Mathf.Sin(m.Life * 2f) * 0.15f;
                m.Rect.localScale = Vector3.one * scaleT;

                _motes[i] = m;
            }
        }

        private void SpawnMote()
        {
            if (_particleContainer == null) return;

            var go = new GameObject("Mote");
            go.transform.SetParent(_particleContainer.transform, false);
            var rt = go.AddComponent<RectTransform>();
            rt.sizeDelta = new Vector2(3f, 3f);

            var img = go.AddComponent<Image>();
            bool isGold = Random.value > 0.35f;
            var baseColor = isGold ? ParticleGold : ParticleWhite;
            baseColor.a = 0f;
            img.color = baseColor;
            img.raycastTarget = false;

            float canvasW = _canvasRect != null ? _canvasRect.rect.width : 1920f;
            float canvasH = _canvasRect != null ? _canvasRect.rect.height : 1080f;

            float startX = Random.Range(-canvasW * 0.5f, canvasW * 0.5f);

            var mote = new ParticleMote
            {
                Rect = rt,
                Img = img,
                Life = 0f,
                MaxLife = Random.Range(4f, 9f),
                Speed = Random.Range(15f, 45f),
                SwayFreq = Random.Range(0.5f, 2f),
                SwayAmp = Random.Range(10f, 40f),
                StartX = startX
            };

            rt.anchoredPosition = new Vector2(startX, -canvasH * 0.1f);
            _motes.Add(mote);
        }

        private void UpdateBackgroundDrift()
        {
            if (_bgRect == null) return;

            _bgDriftPhase += Time.deltaTime * 0.02f;
            float dx = Mathf.Sin(_bgDriftPhase * 0.7f) * 8f;
            float dy = Mathf.Sin(_bgDriftPhase * 0.5f + 1f) * 4f;
            _bgRect.anchoredPosition = new Vector2(dx, dy);
        }

        private void UpdateTitlePulse()
        {
            if (_titleText == null) return;
            float pulse = 1f + Mathf.Sin(Time.time * 1.2f) * 0.008f;
            _titleText.transform.localScale = Vector3.one * pulse;
        }

        private static float EaseOutBack(float t)
        {
            const float c1 = 1.70158f;
            const float c3 = c1 + 1f;
            return 1f + c3 * Mathf.Pow(t - 1f, 3f) + c1 * Mathf.Pow(t - 1f, 2f);
        }

        private static float EaseOutCubic(float t)
        {
            return 1f - Mathf.Pow(1f - t, 3f);
        }
    }
}
