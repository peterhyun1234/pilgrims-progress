using UnityEngine;

namespace PP.Player
{
    public class PlayerAnimationController : MonoBehaviour
    {
        private Animator _animator;
        private SpriteRenderer _sprite;

        private static readonly int HashSpeed = Animator.StringToHash("Speed");
        private static readonly int HashMoveX = Animator.StringToHash("MoveX");
        private static readonly int HashMoveY = Animator.StringToHash("MoveY");
        private static readonly int HashIsMoving = Animator.StringToHash("IsMoving");
        private static readonly int HashIsSprinting = Animator.StringToHash("IsSprinting");
        private static readonly int HashAttack = Animator.StringToHash("Attack");
        private static readonly int HashInteract = Animator.StringToHash("Interact");
        private static readonly int HashHurt = Animator.StringToHash("Hurt");
        private static readonly int HashPray = Animator.StringToHash("Pray");

        private void Awake()
        {
            _animator = GetComponent<Animator>();
            _sprite = GetComponentInChildren<SpriteRenderer>();
        }

        public void SetMoving(bool moving)
        {
            if (_animator == null) return;
            _animator.SetBool(HashIsMoving, moving);
        }

        public void SetSprinting(bool sprinting)
        {
            if (_animator == null) return;
            _animator.SetBool(HashIsSprinting, sprinting);
        }

        public void SetFacing(Vector2 direction)
        {
            if (_animator == null) return;

            _animator.SetFloat(HashMoveX, direction.x);
            _animator.SetFloat(HashMoveY, direction.y);
            _animator.SetFloat(HashSpeed, direction.magnitude);

            if (_sprite != null && Mathf.Abs(direction.x) > 0.01f)
                _sprite.flipX = direction.x < 0;
        }

        public void TriggerAttack()
        {
            if (_animator == null) return;
            _animator.SetTrigger(HashAttack);
        }

        public void TriggerInteract()
        {
            if (_animator == null) return;
            _animator.SetTrigger(HashInteract);
        }

        public void TriggerHurt()
        {
            if (_animator == null) return;
            _animator.SetTrigger(HashHurt);
        }

        public void TriggerPray()
        {
            if (_animator == null) return;
            _animator.SetTrigger(HashPray);
        }

        public void SetSpeed(float speed)
        {
            if (_animator == null) return;
            _animator.SetFloat(HashSpeed, speed);
        }
    }
}
