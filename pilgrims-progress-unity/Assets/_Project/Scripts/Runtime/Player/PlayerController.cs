using UnityEngine;
using PP.Core;
using PP.StateMachine;

namespace PP.Player
{
    [RequireComponent(typeof(PlayerMotor))]
    [RequireComponent(typeof(Rigidbody2D))]
    public class PlayerController : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private PlayerAnimationController _animController;

        private PlayerMotor _motor;
        private StateMachine<PlayerStateKey> _stateMachine;
        private PP.Input.InputManager _input;
        private bool _canMove = true;

        public PlayerMotor Motor => _motor;
        public PlayerAnimationController AnimController => _animController;
        public PP.Input.InputManager Input => _input;
        public bool CanMove => _canMove;

        public Vector2 FacingDirection { get; set; } = Vector2.down;

        private void Awake()
        {
            _motor = GetComponent<PlayerMotor>();
            if (_animController == null)
                _animController = GetComponent<PlayerAnimationController>();

            ServiceLocator.RegisterTransient(this);
            BuildStateMachine();
        }

        private void Start()
        {
            _input = PP.Input.InputManager.Instance;
            if (_input != null)
            {
                _input.OnInteract += OnInteract;
                _input.OnAttack += OnAttack;
                _input.OnPray += OnPray;
            }
        }

        private void BuildStateMachine()
        {
            _stateMachine = new StateMachine<PlayerStateKey>();

            _stateMachine.AddState(PlayerStateKey.Idle, new PlayerIdleState(this));
            _stateMachine.AddState(PlayerStateKey.Move, new PlayerMoveState(this));
            _stateMachine.AddState(PlayerStateKey.Sprint, new PlayerSprintState(this));
            _stateMachine.AddState(PlayerStateKey.Attack, new PlayerAttackState(this));
            _stateMachine.AddState(PlayerStateKey.Interact, new PlayerInteractState(this));
            _stateMachine.AddState(PlayerStateKey.Hurt, new PlayerHurtState(this));

            _stateMachine.AddBidirectional(PlayerStateKey.Idle, PlayerStateKey.Move);
            _stateMachine.AddBidirectional(PlayerStateKey.Idle, PlayerStateKey.Sprint);
            _stateMachine.AddBidirectional(PlayerStateKey.Move, PlayerStateKey.Sprint);
            _stateMachine.AddTransition(PlayerStateKey.Idle, PlayerStateKey.Attack);
            _stateMachine.AddTransition(PlayerStateKey.Move, PlayerStateKey.Attack);
            _stateMachine.AddTransition(PlayerStateKey.Sprint, PlayerStateKey.Attack);
            _stateMachine.AddTransition(PlayerStateKey.Attack, PlayerStateKey.Idle);
            _stateMachine.AddTransition(PlayerStateKey.Idle, PlayerStateKey.Interact);
            _stateMachine.AddTransition(PlayerStateKey.Move, PlayerStateKey.Interact);
            _stateMachine.AddTransition(PlayerStateKey.Interact, PlayerStateKey.Idle);
            _stateMachine.AddTransition(PlayerStateKey.Idle, PlayerStateKey.Hurt);
            _stateMachine.AddTransition(PlayerStateKey.Move, PlayerStateKey.Hurt);
            _stateMachine.AddTransition(PlayerStateKey.Sprint, PlayerStateKey.Hurt);
            _stateMachine.AddTransition(PlayerStateKey.Hurt, PlayerStateKey.Idle);

            _stateMachine.Initialize(PlayerStateKey.Idle);
        }

        private void Update()
        {
            if (!_canMove) return;
            _stateMachine.Update();
        }

        private void FixedUpdate()
        {
            if (!_canMove) return;
            _stateMachine.FixedUpdate();
        }

        public bool TryChangeState(PlayerStateKey key) => _stateMachine.TryTransition(key);

        public void SetCanMove(bool canMove)
        {
            _canMove = canMove;
            if (!canMove)
            {
                _motor.Stop();
                _stateMachine.ForceTransition(PlayerStateKey.Idle);
            }
        }

        private void OnInteract()
        {
            if (!_canMove) return;
            TryChangeState(PlayerStateKey.Interact);
        }

        private void OnAttack()
        {
            if (!_canMove) return;
            TryChangeState(PlayerStateKey.Attack);
        }

        private void OnPray()
        {
            if (!_canMove) return;
            _animController?.TriggerPray();
        }

        private void OnDestroy()
        {
            ServiceLocator.Unregister<PlayerController>();
            if (_input != null)
            {
                _input.OnInteract -= OnInteract;
                _input.OnAttack -= OnAttack;
                _input.OnPray -= OnPray;
            }
        }
    }

    public enum PlayerStateKey
    {
        Idle,
        Move,
        Sprint,
        Attack,
        Interact,
        Hurt
    }
}
