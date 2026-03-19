using UnityEngine;
using PP.StateMachine;

namespace PP.Player
{
    public class PlayerMoveState : IState
    {
        private readonly PlayerController _ctx;
        public PlayerMoveState(PlayerController ctx) => _ctx = ctx;

        public void Enter()
        {
            _ctx.AnimController?.SetMoving(true);
        }

        public void Update()
        {
            var input = _ctx.Input;
            if (input == null) return;

            Vector2 move = input.MoveInput;
            if (move.sqrMagnitude < 0.01f)
            {
                _ctx.TryChangeState(PlayerStateKey.Idle);
                return;
            }

            if (input.SprintHeld)
            {
                _ctx.TryChangeState(PlayerStateKey.Sprint);
                return;
            }

            _ctx.FacingDirection = move.normalized;
            _ctx.AnimController?.SetFacing(_ctx.FacingDirection);
        }

        public void FixedUpdate()
        {
            var input = _ctx.Input;
            if (input == null) return;
            _ctx.Motor.Move(input.MoveInput, false);
        }

        public void Exit() { }
    }
}
