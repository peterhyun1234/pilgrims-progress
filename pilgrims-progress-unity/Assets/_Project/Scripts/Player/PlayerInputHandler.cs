using System;
using UnityEngine;
using UnityEngine.InputSystem;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.Player
{
    public class PlayerInputHandler : MonoBehaviour
    {
        public enum ControlScheme { KeyboardMouse, Gamepad, Touch }

        public static PlayerInputHandler Instance { get; private set; }

        public Vector2 MoveInput { get; private set; }
        public bool InteractPressed { get; private set; }
        public bool JumpPressed { get; private set; }
        public bool PausePressed { get; private set; }
        public bool SprintHeld { get; private set; }

        public ControlScheme ActiveScheme { get; private set; } = ControlScheme.KeyboardMouse;
        public event Action<ControlScheme> OnControlSchemeChanged;

        private InputActionAsset _actions;
        private InputAction _moveAction;
        private InputAction _interactAction;
        private InputAction _jumpAction;
        private InputAction _sprintAction;

        private Vector2 _mobileOverride;
        private bool _mobileOverrideActive;
        private bool _mobileInteractQueued;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            ServiceLocator.Register(this);
            LoadActions();
        }

        private void LoadActions()
        {
            var asset = Resources.Load<InputActionAsset>("InputSystem_Actions");
            if (asset == null)
            {
                _actions = ScriptableObject.CreateInstance<InputActionAsset>();
                Debug.LogWarning("[PlayerInputHandler] InputSystem_Actions not found in Resources, creating fallback bindings");
                CreateFallbackActions();
                return;
            }

            _actions = asset;
            BindActions();
        }

        private void BindActions()
        {
            var playerMap = _actions.FindActionMap("Player");
            if (playerMap == null)
            {
                Debug.LogWarning("[PlayerInputHandler] 'Player' action map not found");
                CreateFallbackActions();
                return;
            }

            _moveAction = playerMap.FindAction("Move");
            _interactAction = playerMap.FindAction("Interact");
            _jumpAction = playerMap.FindAction("Jump");
            _sprintAction = playerMap.FindAction("Sprint");

            playerMap.Enable();

            InputSystem.onActionChange += OnActionChange;
        }

        private void CreateFallbackActions()
        {
            var map = new InputActionMap("Player");

            _moveAction = map.AddAction("Move", InputActionType.Value);
            _moveAction.AddCompositeBinding("2DVector")
                .With("Up", "<Keyboard>/w")
                .With("Down", "<Keyboard>/s")
                .With("Left", "<Keyboard>/a")
                .With("Right", "<Keyboard>/d");
            _moveAction.AddCompositeBinding("2DVector")
                .With("Up", "<Keyboard>/upArrow")
                .With("Down", "<Keyboard>/downArrow")
                .With("Left", "<Keyboard>/leftArrow")
                .With("Right", "<Keyboard>/rightArrow");
            _moveAction.AddBinding("<Gamepad>/leftStick");

            _interactAction = map.AddAction("Interact", InputActionType.Button);
            _interactAction.AddBinding("<Keyboard>/e");
            _interactAction.AddBinding("<Keyboard>/space");
            _interactAction.AddBinding("<Gamepad>/buttonNorth");

            _jumpAction = map.AddAction("Jump", InputActionType.Button);
            _jumpAction.AddBinding("<Keyboard>/space");
            _jumpAction.AddBinding("<Gamepad>/buttonSouth");

            _sprintAction = map.AddAction("Sprint", InputActionType.Button);
            _sprintAction.AddBinding("<Keyboard>/leftShift");
            _sprintAction.AddBinding("<Gamepad>/leftStickPress");

            map.Enable();
        }

        private void Update()
        {
            if (_mobileOverrideActive)
            {
                MoveInput = _mobileOverride;
            }
            else if (_moveAction != null)
            {
                MoveInput = _moveAction.ReadValue<Vector2>();
            }
            else
            {
                MoveInput = Vector2.zero;
            }

            InteractPressed = _mobileInteractQueued
                              || (_interactAction != null && _interactAction.WasPressedThisFrame());
            _mobileInteractQueued = false;

            JumpPressed = _jumpAction != null && _jumpAction.WasPressedThisFrame();
            SprintHeld = _sprintAction != null && _sprintAction.IsPressed();
            PausePressed = Keyboard.current != null && Keyboard.current.escapeKey.wasPressedThisFrame;

            DetectControlScheme();
        }

        private void DetectControlScheme()
        {
            ControlScheme newScheme = ActiveScheme;

            if (Gamepad.current != null && Gamepad.current.wasUpdatedThisFrame)
                newScheme = ControlScheme.Gamepad;
            else if (Keyboard.current != null && Keyboard.current.wasUpdatedThisFrame)
                newScheme = ControlScheme.KeyboardMouse;
            else if (_mobileOverrideActive)
                newScheme = ControlScheme.Touch;

            if (newScheme != ActiveScheme)
            {
                ActiveScheme = newScheme;
                OnControlSchemeChanged?.Invoke(ActiveScheme);
            }
        }

        private void OnActionChange(object obj, InputActionChange change)
        {
            if (change != InputActionChange.ActionPerformed) return;
            if (obj is not InputAction action) return;

            var device = action.activeControl?.device;
            if (device is Gamepad && ActiveScheme != ControlScheme.Gamepad)
            {
                ActiveScheme = ControlScheme.Gamepad;
                OnControlSchemeChanged?.Invoke(ActiveScheme);
            }
            else if (device is Keyboard or Mouse && ActiveScheme != ControlScheme.KeyboardMouse)
            {
                ActiveScheme = ControlScheme.KeyboardMouse;
                OnControlSchemeChanged?.Invoke(ActiveScheme);
            }
        }

        public void SetMobileMove(Vector2 input)
        {
            _mobileOverride = input;
            _mobileOverrideActive = input.sqrMagnitude > 0.001f;
            if (_mobileOverrideActive && ActiveScheme != ControlScheme.Touch)
            {
                ActiveScheme = ControlScheme.Touch;
                OnControlSchemeChanged?.Invoke(ActiveScheme);
            }
        }

        public void QueueMobileInteract()
        {
            _mobileInteractQueued = true;
        }

        public void ClearMobileMove()
        {
            _mobileOverride = Vector2.zero;
            _mobileOverrideActive = false;
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
            InputSystem.onActionChange -= OnActionChange;
        }
    }
}
