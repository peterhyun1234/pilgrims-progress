using UnityEngine;

namespace PP.Player
{
    [RequireComponent(typeof(Rigidbody2D))]
    public class PlayerMotor : MonoBehaviour
    {
        [Header("Speed")]
        [SerializeField] private float _baseSpeed = 5f;
        [SerializeField] private float _sprintMultiplier = 1.5f;

        [Header("Acceleration — SANABI feel")]
        [SerializeField] private float _accelTime = 0.06f;
        [SerializeField] private float _decelTime = 0.04f;
        [SerializeField] private AnimationCurve _accelCurve = AnimationCurve.EaseInOut(0, 0, 1, 1);

        [Header("Direction Reversal")]
        [SerializeField] private float _reversalPenalty = 0.25f;

        private Rigidbody2D _rb;
        private float _speedFactor;
        private Vector2 _lastDirection;
        private Vector2 _desiredInput;
        private bool _sprinting;

        public Vector2 Velocity => _rb != null ? _rb.linearVelocity : Vector2.zero;
        public bool IsMoving => _speedFactor > 0.01f;

        private void Awake()
        {
            _rb = GetComponent<Rigidbody2D>();
            _rb.gravityScale = 0f;
            _rb.freezeRotation = true;
            _rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            _rb.interpolation = RigidbodyInterpolation2D.Interpolate;
        }

        public void Move(Vector2 input, bool sprint)
        {
            if (input.sqrMagnitude > 1f)
                input.Normalize();

            _desiredInput = input;
            _sprinting = sprint;

            if (input.sqrMagnitude > 0.01f)
            {
                Vector2 dir = input.normalized;
                float dot = Vector2.Dot(dir, _lastDirection);
                if (dot < -0.5f)
                    _speedFactor *= _reversalPenalty;
                _lastDirection = dir;
            }
        }

        public void Stop()
        {
            _desiredInput = Vector2.zero;
            _sprinting = false;
            _speedFactor = 0f;
            if (_rb != null) _rb.linearVelocity = Vector2.zero;
        }

        private void FixedUpdate()
        {
            float target = _desiredInput.sqrMagnitude > 0.01f ? 1f : 0f;
            float rateUp = _accelTime > 0 ? Time.fixedDeltaTime / _accelTime : 1f;
            float rateDown = _decelTime > 0 ? Time.fixedDeltaTime / _decelTime : 1f;

            _speedFactor = target > _speedFactor
                ? Mathf.MoveTowards(_speedFactor, target, rateUp)
                : Mathf.MoveTowards(_speedFactor, target, rateDown);

            float speed = _baseSpeed * _accelCurve.Evaluate(_speedFactor);
            if (_sprinting) speed *= _sprintMultiplier;

            _rb.linearVelocity = _desiredInput.normalized * speed;
        }

        public void ApplyKnockback(Vector2 direction, float force)
        {
            _rb.linearVelocity = Vector2.zero;
            _rb.AddForce(direction.normalized * force, ForceMode2D.Impulse);
        }
    }
}
