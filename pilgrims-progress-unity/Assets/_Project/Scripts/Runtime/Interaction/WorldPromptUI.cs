using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PP.Core;

namespace PP.Interaction
{
    public class WorldPromptUI : MonoBehaviour
    {
        [SerializeField] private GameObject _promptRoot;
        [SerializeField] private TextMeshProUGUI _promptText;
        [SerializeField] private Image _inputIcon;
        [SerializeField] private InteractionDetector _detector;

        [Header("Icons")]
        [SerializeField] private Sprite _keyboardIcon;
        [SerializeField] private Sprite _gamepadIcon;
        [SerializeField] private Sprite _touchIcon;

        private float _bobTime;

        private void Start()
        {
            EventBus.Subscribe<ControlSchemeChangedEvent>(OnSchemeChanged);
            if (_promptRoot != null) _promptRoot.SetActive(false);
        }

        private void Update()
        {
            if (_detector == null) return;

            bool show = _detector.HasTarget;
            if (_promptRoot != null) _promptRoot.SetActive(show);

            if (show && _detector.GetClosest() is IInteractable target)
            {
                if (_promptText != null) _promptText.text = target.PromptText;

                _bobTime += Time.deltaTime * 2f;
                float bob = Mathf.Sin(_bobTime) * 3f;
                _promptRoot.transform.localPosition = new Vector3(0, bob, 0);
            }
        }

        private void OnSchemeChanged(ControlSchemeChangedEvent evt)
        {
            if (_inputIcon == null) return;
            _inputIcon.sprite = evt.Scheme switch
            {
                ControlScheme.Gamepad => _gamepadIcon,
                ControlScheme.Touch => _touchIcon,
                _ => _keyboardIcon
            };
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<ControlSchemeChangedEvent>(OnSchemeChanged);
        }
    }
}
