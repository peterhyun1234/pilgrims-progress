using System;
using System.Collections.Generic;

namespace PP.Core
{
    public interface IEvent { }

    public static class EventBus
    {
        private static readonly Dictionary<Type, List<Delegate>> _listeners = new();

        public static void Subscribe<T>(Action<T> handler) where T : struct, IEvent
        {
            var type = typeof(T);
            if (!_listeners.TryGetValue(type, out var list))
            {
                list = new List<Delegate>();
                _listeners[type] = list;
            }
            list.Add(handler);
        }

        public static void Unsubscribe<T>(Action<T> handler) where T : struct, IEvent
        {
            if (_listeners.TryGetValue(typeof(T), out var list))
                list.Remove(handler);
        }

        public static void Publish<T>(T evt) where T : struct, IEvent
        {
            if (!_listeners.TryGetValue(typeof(T), out var list)) return;
            for (int i = list.Count - 1; i >= 0; i--)
            {
                if (list[i] is Action<T> action)
                    action.Invoke(evt);
            }
        }

        public static void Clear()
        {
            _listeners.Clear();
        }

        public static void Clear<T>() where T : struct, IEvent
        {
            _listeners.Remove(typeof(T));
        }
    }
}
