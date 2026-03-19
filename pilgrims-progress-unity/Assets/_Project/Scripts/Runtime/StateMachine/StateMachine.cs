using System;
using System.Collections.Generic;
using UnityEngine;

namespace PP.StateMachine
{
    public class StateMachine<TKey> where TKey : Enum
    {
        private readonly Dictionary<TKey, IState> _states = new();
        private readonly Dictionary<TKey, HashSet<TKey>> _transitions = new();
        private IState _current;

        public TKey CurrentKey { get; private set; }
        public TKey PreviousKey { get; private set; }
        public event Action<TKey, TKey> OnTransition;

        public void AddState(TKey key, IState state)
        {
            _states[key] = state;
        }

        public void AddTransition(TKey from, TKey to)
        {
            if (!_transitions.TryGetValue(from, out var set))
            {
                set = new HashSet<TKey>();
                _transitions[from] = set;
            }
            set.Add(to);
        }

        public void AddBidirectional(TKey a, TKey b)
        {
            AddTransition(a, b);
            AddTransition(b, a);
        }

        public void Initialize(TKey startKey)
        {
            if (!_states.TryGetValue(startKey, out _current))
            {
                Debug.LogError($"[StateMachine] State not registered: {startKey}");
                return;
            }
            CurrentKey = startKey;
            PreviousKey = startKey;
            _current.Enter();
        }

        public bool TryTransition(TKey to)
        {
            if (EqualityComparer<TKey>.Default.Equals(CurrentKey, to))
                return false;

            if (_transitions.TryGetValue(CurrentKey, out var valid) && !valid.Contains(to))
            {
                Debug.LogWarning($"[StateMachine] Blocked: {CurrentKey} → {to}");
                return false;
            }

            if (!_states.TryGetValue(to, out var next))
            {
                Debug.LogError($"[StateMachine] State not registered: {to}");
                return false;
            }

            _current?.Exit();
            PreviousKey = CurrentKey;
            CurrentKey = to;
            _current = next;
            _current.Enter();
            OnTransition?.Invoke(PreviousKey, CurrentKey);
            return true;
        }

        public void ForceTransition(TKey to)
        {
            if (!_states.TryGetValue(to, out var next))
            {
                Debug.LogError($"[StateMachine] State not registered: {to}");
                return;
            }

            _current?.Exit();
            PreviousKey = CurrentKey;
            CurrentKey = to;
            _current = next;
            _current.Enter();
            OnTransition?.Invoke(PreviousKey, CurrentKey);
        }

        public void Update() => _current?.Update();
        public void FixedUpdate() => _current?.FixedUpdate();

        public T GetState<T>(TKey key) where T : class, IState
        {
            return _states.TryGetValue(key, out var state) ? state as T : null;
        }
    }
}
