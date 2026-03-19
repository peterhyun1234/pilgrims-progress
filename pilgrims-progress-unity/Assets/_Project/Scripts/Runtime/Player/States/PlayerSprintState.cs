using UnityEngine;
using PP.StateMachine;

namespace PP.Player
{
    public class PlayerSprintState : IState
    {
        private readonly PlayerController _ctx;
        public PlayerSprintState(PlayerController ctx) => _ctx = ctx;

        public void Enter()
        {
            _ctx.AnimController?.SetSprinting(true);
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

            if (!input.SprintHeld)
            {
                _ctx.TryChangeState(PlayerStateKey.Move);
                return;
            }

            _ctx.FacingDirection = move.normalized;
            _ctx.AnimController?.SetFacing(_ctx.FacingDirection);
        }

        public void FixedUpdate()
        {
            var input = _ctx.Input;
            if (input == null) return;
            _ctx.Motor.Move(input.MoveInput, true);
        }

        public void Exit()
        {
            _ctx.AnimController?.SetSprinting(false);
        }
    }
}
