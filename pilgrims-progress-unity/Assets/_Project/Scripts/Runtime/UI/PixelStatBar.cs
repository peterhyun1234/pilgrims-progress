using UnityEngine;
using UnityEngine.UI;

namespace PP.UI
{
    public class PixelStatBar : MonoBehaviour
    {
        [SerializeField] private Image _fillImage;
        [SerializeField] private Gradient _gradient;
        [SerializeField] private float _lerpSpeed = 5f;

        private float _targetValue;
        private float _currentValue;

        public void SetValue(float normalized)
        {
            _targetValue = Mathf.Clamp01(normalized);
        }

        private void Update()
        {
            if (Mathf.Approximately(_currentValue, _targetValue)) return;

            _currentValue = Mathf.MoveTowards(_currentValue, _targetValue, _lerpSpeed * Time.deltaTime);

            if (_fillImage != null)
            {
                _fillImage.fillAmount = _currentValue;
                if (_gradient != null)
                    _fillImage.color = _gradient.Evaluate(_currentValue);
            }
        }
    }
}
