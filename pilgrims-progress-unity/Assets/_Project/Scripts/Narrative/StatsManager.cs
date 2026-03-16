using System;
using UnityEngine;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.Narrative
{
    [System.Serializable]
    public class CharacterStats
    {
        public int Faith;
        public int Courage;
        public int Wisdom;
        public int Burden;

        public const int MaxStatValue = 100;
        public const int MinStatValue = 0;
        public const int MaxBurden = 100;

        public CharacterStats()
        {
            Faith = 30;
            Courage = 20;
            Wisdom = 20;
            Burden = 80;
        }

        public CharacterStats(CharacterStats other)
        {
            Faith = other.Faith;
            Courage = other.Courage;
            Wisdom = other.Wisdom;
            Burden = other.Burden;
        }
    }

    public class StatsManager : MonoBehaviour
    {
        public static StatsManager Instance { get; private set; }

        public event Action<string, int, int> OnStatChanged;
        public event Action<int, int> OnBurdenChanged;

        public CharacterStats Stats { get; private set; } = new CharacterStats();

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            ServiceLocator.Register(this);
        }

        public void ModifyStat(string statName, int delta)
        {
            int oldValue;
            int newValue;

            switch (statName.ToLower())
            {
                case "faith":
                    oldValue = Stats.Faith;
                    Stats.Faith = Mathf.Clamp(Stats.Faith + delta, CharacterStats.MinStatValue, CharacterStats.MaxStatValue);
                    newValue = Stats.Faith;
                    break;
                case "courage":
                    oldValue = Stats.Courage;
                    Stats.Courage = Mathf.Clamp(Stats.Courage + delta, CharacterStats.MinStatValue, CharacterStats.MaxStatValue);
                    newValue = Stats.Courage;
                    break;
                case "wisdom":
                    oldValue = Stats.Wisdom;
                    Stats.Wisdom = Mathf.Clamp(Stats.Wisdom + delta, CharacterStats.MinStatValue, CharacterStats.MaxStatValue);
                    newValue = Stats.Wisdom;
                    break;
                default:
                    Debug.LogWarning($"[StatsManager] Unknown stat: {statName}");
                    return;
            }

            OnStatChanged?.Invoke(statName, oldValue, newValue);
        }

        public void ModifyBurden(int delta)
        {
            int oldValue = Stats.Burden;
            Stats.Burden = Mathf.Clamp(Stats.Burden + delta, 0, CharacterStats.MaxBurden);
            OnBurdenChanged?.Invoke(oldValue, Stats.Burden);
        }

        public void LoadStats(CharacterStats stats)
        {
            Stats = new CharacterStats(stats);
        }

        public void ResetStats()
        {
            Stats = new CharacterStats();
        }
    }
}
