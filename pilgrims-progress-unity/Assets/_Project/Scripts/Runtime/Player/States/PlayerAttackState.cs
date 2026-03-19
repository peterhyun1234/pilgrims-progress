using UnityEngine;
using PP.StateMachine;
using PP.Core;

namespace PP.Player
{
    public class PlayerAttackState : IState
    {
        private readonly PlayerController _ctx;
        private float _timer;
        private const float AttackDuration = 0.35f;

        public PlayerAttackState(PlayerController ctx) => _ctx = ctx;

        public void Enter()
        {
            _timer = AttackDuration;
            _ctx.Motor.Stop();
            _ctx.AnimController?.TriggerAttack();
            EventBus.Publish(new HitstopEvent { Duration = 0.04f });
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
