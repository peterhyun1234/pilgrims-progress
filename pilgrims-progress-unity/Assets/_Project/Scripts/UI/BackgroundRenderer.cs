using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.UI
{
    public class BackgroundRenderer : MonoBehaviour
    {
        [Header("Parallax Layers")]
        [SerializeField] private Image _farLayer;
        [SerializeField] private Image _midLayer;
        [SerializeField] private Image _foregroundLayer;

        [Header("Parallax Speeds")]
        [SerializeField] private float _farSpeed = 0.002f;
        [SerializeField] private float _midSpeed = 0.005f;
        [SerializeField] private float _foregroundSpeed = 0.01f;

        [Header("Transition")]
        [SerializeField] private float _transitionDuration = 1.5f;
        [SerializeField] private Image _transitionOverlay;

        private Material _farMaterial;
        private Material _midMaterial;
        private Material _foregroundMaterial;

        private Coroutine _transitionCoroutine;

        private void Awake()
        {
            if (_farLayer != null)
            {
                _farMaterial = new Material(_farLayer.material);
                _farLayer.material = _farMaterial;
            }
            if (_midLayer != null)
            {
                _midMaterial = new Material(_midLayer.material);
                _midLayer.material = _midMaterial;
            }
            if (_foregroundLayer != null)
            {
                _foregroundMaterial = new Material(_foregroundLayer.material);
                _foregroundLayer.material = _foregroundMaterial;
            }
        }

        private void Update()
        {
            float time = Time.time;
            float sway = Mathf.Sin(time * 0.3f) * 0.001f;

            if (_farMaterial != null)
            {
                var offset = _farMaterial.mainTextureOffset;
                offset.x += (_farSpeed + sway * 0.5f) * Time.deltaTime;
                _farMaterial.mainTextureOffset = offset;
            }

            if (_midMaterial != null)
            {
                var offset = _midMaterial.mainTextureOffset;
                offset.x += (_midSpeed + sway) * Time.deltaTime;
                _midMaterial.mainTextureOffset = offset;
            }

            if (_foregroundMaterial != null)
            {
                var offset = _foregroundMaterial.mainTextureOffset;
                offset.x += (_foregroundSpeed + sway * 2f) * Time.deltaTime;
                _foregroundMaterial.mainTextureOffset = offset;
            }
        }

        public void SetLocation(Sprite farBg, Sprite midBg, Sprite fgBg, Color tint)
        {
            if (_transitionCoroutine != null)
            {
                StopCoroutine(_transitionCoroutine);
            }
            _transitionCoroutine = StartCoroutine(TransitionToNewLocation(farBg, midBg, fgBg, tint));
        }

        private IEnumerator TransitionToNewLocation(Sprite farBg, Sprite midBg, Sprite fgBg, Color tint)
        {
            if (_transitionOverlay != null)
            {
                yield return FadeOverlay(0f, 1f, _transitionDuration * 0.5f);
            }

            if (_farLayer != null && farBg != null) _farLayer.sprite = farBg;
            if (_midLayer != null && midBg != null) _midLayer.sprite = midBg;
            if (_foregroundLayer != null && fgBg != null) _foregroundLayer.sprite = fgBg;

            ApplyTint(tint);

            if (_transitionOverlay != null)
            {
                yield return FadeOverlay(1f, 0f, _transitionDuration * 0.5f);
            }
        }

        private IEnumerator FadeOverlay(float from, float to, float duration)
        {
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float alpha = Mathf.Lerp(from, to, elapsed / duration);
                _transitionOverlay.color = new Color(
                    _transitionOverlay.color.r,
                    _transitionOverlay.color.g,
                    _transitionOverlay.color.b,
                    alpha);
                yield return null;
            }
            _transitionOverlay.color = new Color(
                _transitionOverlay.color.r,
                _transitionOverlay.color.g,
                _transitionOverlay.color.b,
                to);
        }

        private void ApplyTint(Color tint)
        {
            if (_farLayer != null) _farLayer.color = tint;
            if (_midLayer != null) _midLayer.color = tint;
            if (_foregroundLayer != null) _foregroundLayer.color = Color.Lerp(tint, Color.white, 0.3f);
        }

        private void OnDestroy()
        {
            if (_farMaterial != null) Destroy(_farMaterial);
            if (_midMaterial != null) Destroy(_midMaterial);
            if (_foregroundMaterial != null) Destroy(_foregroundMaterial);
        }
    }
}
