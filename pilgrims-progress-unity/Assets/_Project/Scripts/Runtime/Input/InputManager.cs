using System;
using UnityEngine;
using UnityEngine.InputSystem;
using PP.Core;

namespace PP.Input
{
    public class InputManager : MonoBehaviour
    {
        public static InputManager Instance { get; private set; }

        #region Events — Player
        public event Action OnInteract;
        public event Action OnAttack;
        public event Action OnDodge;
        public event Action OnPray;
        public event Action OnPause;
        public event Action OnMapToggle;
        public event Action OnSprintStarted;
        public event Action OnSprintCanceled;
        #endregion

        #region Events — Dialogue
        public event Action OnDialogueContinue;
        public event Action OnDialogueSkip;
        public event Action<int> OnChoiceSelected;
        #endregion

        public Vector2 MoveInput { get; private set; }
        public bool SprintHeld { get; private set; }
        public ControlScheme ActiveScheme { get; private set; } = ControlScheme.KeyboardMouse;

        private InputActionAsset _actions;
        private InputActionMap _playerMap;
        private InputActionMap _dialogueMap;
        private InputActionMap _uiMap;
        private InputAction _moveAction;
        private InputAction _sprintAction;

        private Vector2 _mobileOverride;
        private bool _mobileActive;

        private bool _initialized;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            ServiceLocator.Register(this);

            BuildFallback();
            _initialized = true;
            ActivatePlayerMap();

            InputSystem.onActionChange += OnActionChange;
        }

        private void BuildFallback()
        {
            _playerMap = new InputActionMap("Player");

            _moveAction = _playerMap.AddAction("Move", InputActionType.Value);
            _moveAction.AddCompositeBinding("2DVector")
                .With("Up", "<Keyboard>/w").With("Down", "<Keyboard>/s")
                .With("Left", "<Keyboard>/a").With("Right", "<Keyboard>/d");
            _moveAction.AddCompositeBinding("2DVector")
                .With("Up", "<Keyboard>/upArrow").With("Down", "<Keyboard>/downArrow")
                .With("Left", "<Keyboard>/leftArrow").With("Right", "<Keyboard>/rightArrow");
            _moveAction.AddBinding("<Gamepad>/leftStick");

            BindNewAction(_playerMap, "Interact", new[] { "<Keyboard>/e", "<Gamepad>/buttonNorth" }, () => OnInteract?.Invoke());
            BindNewAction(_playerMap, "Attack", new[] { "<Keyboard>/space", "<Gamepad>/buttonWest" }, () => OnAttack?.Invoke());
            BindNewAction(_playerMap, "Dodge", new[] { "<Keyboard>/leftShift", "<Gamepad>/buttonSouth" }, () => OnDodge?.Invoke());
            BindNewAction(_playerMap, "Pause", new[] { "<Keyboard>/escape", "<Gamepad>/start" }, () => OnPause?.Invoke());

            _sprintAction = _playerMap.AddAction("Sprint", InputActionType.Button);
            _sprintAction.AddBinding("<Keyboard>/leftShift");
            _sprintAction.AddBinding("<Gamepad>/leftStickPress");
            _sprintAction.started += _ => OnSprintStarted?.Invoke();
            _sprintAction.canceled += _ => OnSprintCanceled?.Invoke();

            BuildDialogueMap();
        }

        private void BuildDialogueMap()
        {
            _dialogueMap = new InputActionMap("Dialogue");

            BindNewAction(_dialogueMap, "Continue",
                new[] { "<Keyboard>/space", "<Keyboard>/enter", "<Gamepad>/buttonSouth", "<Mouse>/leftButton" },
                () => OnDialogueContinue?.Invoke());

            BindNewAction(_dialogueMap, "Skip",
                new[] { "<Keyboard>/escape", "<Gamepad>/buttonEast" },
                () => OnDialogueSkip?.Invoke());

            for (int i = 0; i < 4; i++)
            {
                int idx = i;
                BindNewAction(_dialogueMap, $"Choice{i + 1}",
                    new[] { $"<Keyboard>/{i + 1}" },
                    () => OnChoiceSelected?.Invoke(idx));
            }
        }

        #region Action Map Switching

        public void ActivatePlayerMap() => SwitchMap(_playerMap);
        public void ActivateDialogueMap() => SwitchMap(_dialogueMap);
        public void ActivateUIMap() => SwitchMap(_uiMap ?? _dialogueMap);

        private void SwitchMap(InputActionMap target)
        {
            _playerMap?.Disable();
            _dialogueMap?.Disable();
            _uiMap?.Disable();
            target?.Enable();
        }

        #endregion

        #region Mobile

        public void SetMobileMove(Vector2 input)
        {
            _mobileOverride = input;
            _mobileActive = input.sqrMagnitude > 0.001f;
            if (_mobileActive) SetScheme(ControlScheme.Touch);
        }

        public void ClearMobileMove()
        {
            _mobileOverride = Vector2.zero;
            _mobileActive = false;
        }

        public void InvokeInteract() => OnInteract?.Invoke();
        public void InvokeAttack() => OnAttack?.Invoke();
        public void InvokeDodge() => OnDodge?.Invoke();
        public void InvokePray() => OnPray?.Invoke();

        #endregion

        private void Update()
        {
            MoveInput = _mobileActive
                ? _mobileOverride
                : (_moveAction != null && _moveAction.enabled ? _moveAction.ReadValue<Vector2>() : Vector2.zero);

            SprintHeld = _sprintAction != null && _sprintAction.IsPressed();
        }

        private void OnActionChange(object obj, InputActionChange change)
        {
            if (change != InputActionChange.ActionPerformed) return;
            if (obj is not InputAction action) return;
            var dev = action.activeControl?.device;
            if (dev is Keyboard or Mouse) SetScheme(ControlScheme.KeyboardMouse);
            else if (dev is Gamepad) SetScheme(ControlScheme.Gamepad);
            else if (dev is Touchscreen) SetScheme(ControlScheme.Touch);
        }

        private void SetScheme(ControlScheme scheme)
        {
            if (ActiveScheme == scheme) return;
            ActiveScheme = scheme;
            EventBus.Publish(new ControlSchemeChangedEvent { Scheme = scheme });
        }

        private static void Bind(InputActionMap map, string actionName, Action callback)
        {
            var action = map.FindAction(actionName);
            if (action != null) action.performed += _ => callback();
        }

        private static void BindNewAction(InputActionMap map, string name, string[] bindings, Action callback)
        {
            var action = map.AddAction(name, InputActionType.Button);
            foreach (var b in bindings) action.AddBinding(b);
            action.performed += _ => callback();
        }

        private void OnEnable()
        {
            if (_initialized) _playerMap?.Enable();
        }

        private void OnDisable()
        {
            _playerMap?.Disable();
            _dialogueMap?.Disable();
            _uiMap?.Disable();
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
            InputSystem.onActionChange -= OnActionChange;
        }
    }
}
