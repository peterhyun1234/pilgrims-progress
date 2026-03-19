using System;
using System.Collections.Generic;
using UnityEngine;

namespace PP.Core
{
    public static class ServiceLocator
    {
        private static readonly Dictionary<Type, object> _services = new();
        private static readonly Dictionary<Type, object> _transients = new();

        public static void Register<T>(T service) where T : class
        {
            var type = typeof(T);
            if (_services.ContainsKey(type))
                Debug.LogWarning($"[ServiceLocator] Overwriting: {type.Name}");
            _services[type] = service;
        }

        public static void RegisterTransient<T>(T service) where T : class
        {
            _transients[typeof(T)] = service;
        }

        public static T Get<T>() where T : class
        {
            if (_services.TryGetValue(typeof(T), out var s))
                return (T)s;
            if (_transients.TryGetValue(typeof(T), out var t))
                return (T)t;
            Debug.LogError($"[ServiceLocator] Not found: {typeof(T).Name}");
            return null;
        }

        public static bool TryGet<T>(out T service) where T : class
        {
            if (_services.TryGetValue(typeof(T), out var s))
            {
                service = (T)s;
                return true;
            }
            if (_transients.TryGetValue(typeof(T), out var t))
            {
                service = (T)t;
                return true;
            }
            service = null;
            return false;
        }

        public static void Unregister<T>() where T : class
        {
            _services.Remove(typeof(T));
            _transients.Remove(typeof(T));
        }

        public static void ClearTransients()
        {
            _transients.Clear();
        }

        public static void Reset()
        {
            _services.Clear();
            _transients.Clear();
        }
    }
}
