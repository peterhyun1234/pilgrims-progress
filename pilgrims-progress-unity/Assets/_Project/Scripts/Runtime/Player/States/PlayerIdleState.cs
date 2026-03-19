using PP.StateMachine;

namespace PP.Player
{
    public class PlayerIdleState : IState
    {
        private readonly PlayerController _ctx;
        public PlayerIdleState(PlayerController ctx) => _ctx = ctx;

        public void Enter()
        {
            _ctx.Motor.Stop();
            _ctx.AnimController?.SetMoving(false);
        }

        public void Update()
        {
            var input = _ctx.Input;
            if (input == null) return;

            if (input.MoveInput.sqrMagnitude > 0.01f)
            {
                if (input.SprintHeld)
                    _ctx.TryChangeState(PlayerStateKey.Sprint);
                else
                    _ctx.TryChangeState(PlayerStateKey.Move);
            }
        }

        public void FixedUpdate() { }
        public void Exit() { }
    }
}
