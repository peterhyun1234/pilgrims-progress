using PP.StateMachine;
using PP.Core;

namespace PP.Player
{
    public class PlayerInteractState : IState
    {
        private readonly PlayerController _ctx;
        private float _timer;
        private const float InteractDuration = 0.2f;

        public PlayerInteractState(PlayerController ctx) => _ctx = ctx;

        public void Enter()
        {
            _timer = InteractDuration;
            _ctx.Motor.Stop();
            _ctx.AnimController?.TriggerInteract();

            if (ServiceLocator.TryGet<PP.Interaction.InteractionDetector>(out var detector))
            {
                var target = detector.GetClosest();
                target?.Interact(_ctx);
            }
        }

        public void Update()
        {
            _timer -= UnityEngine.Time.deltaTime;
            if (_timer <= 0f)
                _ctx.TryChangeState(PlayerStateKey.Idle);
        }

        public void FixedUpdate() { }
        public void Exit() { }
    }
}
