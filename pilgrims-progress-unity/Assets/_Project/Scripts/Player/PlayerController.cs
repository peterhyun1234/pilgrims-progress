using UnityEngine;
using PilgrimsProgress.Core;
using PilgrimsProgress.Interaction;

namespace PilgrimsProgress.Player
{
    [RequireComponent(typeof(Rigidbody2D))]
    public class PlayerController : MonoBehaviour
    {
        [Header("Movement")]
        [SerializeField] private float _baseSpeed = 5f;
        [SerializeField] private float _sprintMultiplier = 1.35f;
        [SerializeField] private float _minSpeedMultiplier = 0.3f;
        [SerializeField] private float _burdenSpeedFactor = 0.007f;

        [Header("References")]
        [SerializeField] private InteractionDetector _interactionDetector;

        private Rigidbody2D _rb;
        private PlayerAnimator _animator;
        private PlayerInputHandler _input;
        private Vector2 _moveInput;
        private bool _canMove = true;

        public Vector2 FacingDirection { get; private set; } = Vector2.down;
        public bool IsMoving => _moveInput.sqrMagnitude > 0.01f;
        public bool IsSprinting { get; private set; }

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
            if (_input == null)
                _input = PlayerInputHandler.Instance;

            if (!_canMove)
            {
                _moveInput = Vector2.zero;
                return;
            }

            if (_input != null)
            {
                _moveInput = _input.MoveInput;
                if (_moveInput.sqrMagnitude > 1f)
                    _moveInput.Normalize();

                IsSprinting = _input.SprintHeld && IsMoving;

                if (_input.InteractPressed)
                    TryInteract();
            }

            if (_moveInput.sqrMagnitude > 0.01f)
                FacingDirection = _moveInput.normalized;
        }

        private void FixedUpdate()
        {
            float speed = CalculateSpeed();
            if (IsSprinting) speed *= _sprintMultiplier;
            _rb.linearVelocity = _moveInput.normalized * speed;
        }

        public void OnInteractButtonPressed()
        {
            TryInteract();
        }

        public void SetMoveInput(Vector2 input)
        {
            if (!_canMove) return;
            if (_input != null)
            {
                _input.SetMobileMove(input);
                return;
            }
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
                target.Interact(this);
        }
    }
}
