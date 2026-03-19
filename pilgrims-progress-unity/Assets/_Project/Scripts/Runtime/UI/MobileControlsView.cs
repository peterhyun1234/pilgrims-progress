using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using PP.Core;

namespace PP.UI
{
    public class MobileControlsView : MonoBehaviour
    {
        [Header("Joystick")]
        [SerializeField] private RectTransform _joystickArea;
        [SerializeField] private RectTransform _joystickHandle;
        [SerializeField] private float _joystickRadius = 60f;

        [Header("Buttons")]
        [SerializeField] private Button _attackButton;
        [SerializeField] private Button _interactButton;
        [SerializeField] private Button _dodgeButton;
        [SerializeField] private Button _pauseButton;

        private PP.Input.InputManager _input;
        private bool _joystickActive;
        private Vector2 _joystickStart;
        private int _joystickTouchId = -1;

        private void Start()
        {
            _input = PP.Input.InputManager.Instance;

            _attackButton?.onClick.AddListener(() => _input?.InvokeAttack());
            _interactButton?.onClick.AddListener(() => _input?.InvokeInteract());
            _dodgeButton?.onClick.AddListener(() => _input?.InvokeDodge());
            _pauseButton?.onClick.AddListener(() => GameManager.Instance?.EnterPause());

            EventBus.Subscribe<ControlSchemeChangedEvent>(OnSchemeChanged);
            UpdateVisibility();
        }

        private void Update()
        {
            if (!_joystickActive || _input == null) return;

            for (int i = 0; i < UnityEngine.Input.touchCount; i++)
            {
                var touch = UnityEngine.Input.GetTouch(i);
                if (touch.fingerId != _joystickTouchId) continue;

                if (touch.phase == TouchPhase.Ended || touch.phase == TouchPhase.Canceled)
                {
                    ResetJoystick();
                    return;
                }

                Vector2 delta = touch.position - _joystickStart;
                if (delta.magnitude > _joystickRadius)
                    delta = delta.normalized * _joystickRadius;

                if (_joystickHandle != null)
                    _joystickHandle.anchoredPosition = delta;

                _input.SetMobileMove(delta / _joystickRadius);
            }
        }

        public void OnJoystickDown(BaseEventData data)
        {
            if (data is PointerEventData pointer)
            {
                _joystickActive = true;
                _joystickStart = pointer.position;
                _joystickTouchId = pointer.pointerId;
            }
        }

        public void OnJoystickUp(BaseEventData data)
        {
            ResetJoystick();
        }

        private void ResetJoystick()
        {
            _joystickActive = false;
            _joystickTouchId = -1;
            if (_joystickHandle != null)
                _joystickHandle.anchoredPosition = Vector2.zero;
            _input?.ClearMobileMove();
        }

        private void OnSchemeChanged(ControlSchemeChangedEvent evt)
        {
            UpdateVisibility();
        }

        private void UpdateVisibility()
        {
            bool isMobile = Application.isMobilePlatform ||
                            (_input != null && _input.ActiveScheme == ControlScheme.Touch);
            gameObject.SetActive(isMobile);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<ControlSchemeChangedEvent>(OnSchemeChanged);
        }
    }
}
