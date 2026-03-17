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

        public int GetStat(string name)
        {
            switch (name.ToLower())
            {
                case "faith": return Faith;
                case "courage": return Courage;
                case "wisdom": return Wisdom;
                case "burden": return Burden;
                default: return 0;
            }
        }
    }

    public enum StatTier { Depleted, Low, Medium, High, Mastered }

    public class StatsManager : MonoBehaviour
    {
        public static StatsManager Instance { get; private set; }

        public event Action<string, int, int> OnStatChanged;
        public event Action<int, int> OnBurdenChanged;
        public event Action<string, StatTier, StatTier> OnTierChanged;

        public CharacterStats Stats { get; private set; } = new CharacterStats();

        private StatTier _prevFaithTier;
        private StatTier _prevCourageTier;
        private StatTier _prevWisdomTier;

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

            _prevFaithTier = GetTier(Stats.Faith);
            _prevCourageTier = GetTier(Stats.Courage);
            _prevWisdomTier = GetTier(Stats.Wisdom);
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
                case "burden":
                    ModifyBurden(delta);
                    return;
                default:
                    Debug.LogWarning($"[StatsManager] Unknown stat: {statName}");
                    return;
            }

            OnStatChanged?.Invoke(statName, oldValue, newValue);
            CheckTierChange(statName, oldValue, newValue);
        }

        public void SetBurden(int value)
        {
            int oldValue = Stats.Burden;
            Stats.Burden = Mathf.Clamp(value, 0, CharacterStats.MaxBurden);
            if (oldValue != Stats.Burden)
                OnBurdenChanged?.Invoke(oldValue, Stats.Burden);
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
            _prevFaithTier = GetTier(Stats.Faith);
            _prevCourageTier = GetTier(Stats.Courage);
            _prevWisdomTier = GetTier(Stats.Wisdom);
        }

        public void ResetStats()
        {
            Stats = new CharacterStats();
            _prevFaithTier = GetTier(Stats.Faith);
            _prevCourageTier = GetTier(Stats.Courage);
            _prevWisdomTier = GetTier(Stats.Wisdom);
        }

        #region Tier System

        public static StatTier GetTier(int value)
        {
            if (value >= 80) return StatTier.Mastered;
            if (value >= 55) return StatTier.High;
            if (value >= 30) return StatTier.Medium;
            if (value >= 10) return StatTier.Low;
            return StatTier.Depleted;
        }

        public StatTier GetFaithTier() => GetTier(Stats.Faith);
        public StatTier GetCourageTier() => GetTier(Stats.Courage);
        public StatTier GetWisdomTier() => GetTier(Stats.Wisdom);

        private void CheckTierChange(string stat, int oldVal, int newVal)
        {
            var oldTier = GetTier(oldVal);
            var newTier = GetTier(newVal);
            if (oldTier == newTier) return;

            switch (stat.ToLower())
            {
                case "faith": _prevFaithTier = newTier; break;
                case "courage": _prevCourageTier = newTier; break;
                case "wisdom": _prevWisdomTier = newTier; break;
            }

            OnTierChanged?.Invoke(stat, oldTier, newTier);
        }

        #endregion

        #region Gameplay Queries

        public float GetBuffEffectiveness()
        {
            float faithBonus = Stats.Faith / 100f * 0.5f;
            return 1f + faithBonus;
        }

        public float GetDebuffResistance()
        {
            float faithBonus = Stats.Faith / 100f * 0.3f;
            float wisdomBonus = Stats.Wisdom / 100f * 0.2f;
            return faithBonus + wisdomBonus;
        }

        public float GetDarkAreaSpeedMultiplier()
        {
            float base_ = 0.6f;
            float courageBonus = Stats.Courage / 100f * 0.4f;
            return base_ + courageBonus;
        }

        public float GetRevealRadius()
        {
            float base_ = 3f;
            float wisdomBonus = Stats.Wisdom / 100f * 5f;
            return base_ + wisdomBonus;
        }

        public float GetBurdenSpeedPenalty()
        {
            return 1f - (Stats.Burden * 0.007f);
        }

        #endregion
    }
}
