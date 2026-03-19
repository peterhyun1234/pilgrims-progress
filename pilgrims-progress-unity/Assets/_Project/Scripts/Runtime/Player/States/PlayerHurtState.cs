using UnityEngine;
using PP.StateMachine;
using PP.Core;

namespace PP.Player
{
    public class PlayerHurtState : IState
    {
        private readonly PlayerController _ctx;
        private float _timer;
        private const float HurtDuration = 0.3f;

        public PlayerHurtState(PlayerController ctx) => _ctx = ctx;

        public void Enter()
        {
            _timer = HurtDuration;
            _ctx.Motor.Stop();
            _ctx.AnimController?.TriggerHurt();
            EventBus.Publish(new ScreenShakeEvent { Intensity = 0.15f, Duration = 0.2f });
            EventBus.Publish(new HitstopEvent { Duration = 0.06f });
        }

        public void Update()
        {
            _timer -= Time.deltaTime;
            if (_timer <= 0f)
                _ctx.TryChangeState(PlayerStateKey.Idle);
        }

        public void FixedUpdate() { }
        public void Exit() { }
    }
}
