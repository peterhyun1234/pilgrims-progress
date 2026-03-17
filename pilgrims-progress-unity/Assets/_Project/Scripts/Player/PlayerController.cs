using UnityEngine;
using UnityEngine.InputSystem;
using PilgrimsProgress.Core;
using PilgrimsProgress.Narrative;
using PilgrimsProgress.Interaction;

namespace PilgrimsProgress.Player
{
    [RequireComponent(typeof(Rigidbody2D))]
    public class PlayerController : MonoBehaviour
    {
        [Header("Movement")]
        [SerializeField] private float _baseSpeed = 5f;
        [SerializeField] private float _minSpeedMultiplier = 0.3f;
        [SerializeField] private float _burdenSpeedFactor = 0.007f;

        [Header("References")]
        [SerializeField] private InteractionDetector _interactionDetector;

        private Rigidbody2D _rb;
        private PlayerAnimator _animator;
        private Vector2 _moveInput;
        private bool _canMove = true;

        public Vector2 FacingDirection { get; private set; } = Vector2.down;
        public bool IsMoving => _moveInput.sqrMagnitude > 0.01f;

        private void Awake()
        {
            _rb = GetComponent<Rigidbody2D>();
            _rb.gravityScale = 0f;
            _rb.freezeRotation = true;
            _rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;

            _animator = GetComponent<PlayerAnimator>();

            if (_interactionDetector == null)
                _interactionDetector = GetComponentInChildren<InteractionDetector>();

            ServiceLocator.Register(this);
        }

        private void Update()
        {
            if (!_canMove)
            {
                _moveInput = Vector2.zero;
                return;
            }

            ReadMovementInput();
            ReadInteractionInput();

            if (_moveInput.sqrMagnitude > 0.01f)
            {
                FacingDirection = _moveInput.normalized;
            }
        }

        private void FixedUpdate()
        {
            float speed = CalculateSpeed();
            _rb.linearVelocity = _moveInput.normalized * speed;
        }

        private void ReadMovementInput()
        {
            var kb = Keyboard.current;
            if (kb == null) return;

            _moveInput = Vector2.zero;

            if (kb.wKey.isPressed || kb.upArrowKey.isPressed) _moveInput.y += 1f;
            if (kb.sKey.isPressed || kb.downArrowKey.isPressed) _moveInput.y -= 1f;
            if (kb.aKey.isPressed || kb.leftArrowKey.isPressed) _moveInput.x -= 1f;
            if (kb.dKey.isPressed || kb.rightArrowKey.isPressed) _moveInput.x += 1f;

            if (_moveInput.sqrMagnitude > 1f)
                _moveInput.Normalize();
        }

        private void ReadInteractionInput()
        {
            var kb = Keyboard.current;
            if (kb == null) return;

            if (kb.spaceKey.wasPressedThisFrame || kb.eKey.wasPressedThisFrame)
            {
                TryInteract();
            }
        }

        /// <summary>
        /// Called by mobile UI interact button.
        /// </summary>
        public void OnInteractButtonPressed()
        {
            TryInteract();
        }

        /// <summary>
        /// Called by mobile virtual joystick.
        /// </summary>
        public void SetMoveInput(Vector2 input)
        {
            if (!_canMove) return;
            _moveInput = input;
            if (_moveInput.sqrMagnitude > 0.01f)
                FacingDirection = _moveInput.normalized;
        }

        public void SetCanMove(bool canMove)
        {
            _canMove = canMove;
            if (!canMove)
            {
                _moveInput = Vector2.zero;
                _rb.linearVelocity = Vector2.zero;
            }
        }

        private float CalculateSpeed()
        {
            var stats = StatsManager.Instance;
            if (stats == null)
                return _baseSpeed;

            float burdenMod = Mathf.Max(_minSpeedMultiplier, stats.GetBurdenSpeedPenalty());
            float speed = _baseSpeed * burdenMod;

            var chapterMgr = ChapterManager.Instance;
            bool isDarkArea = chapterMgr != null &&
                Core.ChapterDatabase.Get(chapterMgr.CurrentChapter).Theme == Core.MapTheme.DarkValley;

            if (isDarkArea)
                speed *= stats.GetDarkAreaSpeedMultiplier();

            if (stats.GetCourageTier() >= StatTier.High)
                speed *= 1.05f;

            return speed;
        }

        private void TryInteract()
        {
            if (_interactionDetector == null) return;

            var target = _interactionDetector.GetClosestInteractable();
            if (target != null)
            {
                target.Interact(this);
            }
        }
    }
}
