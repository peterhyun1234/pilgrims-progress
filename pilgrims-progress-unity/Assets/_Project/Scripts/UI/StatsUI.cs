using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PilgrimsProgress.Core;
using PilgrimsProgress.Narrative;

namespace PilgrimsProgress.UI
{
    public class StatsUI : MonoBehaviour
    {
        [Header("Stat Bars")]
        [SerializeField] private Image _faithBar;
        [SerializeField] private Image _courageBar;
        [SerializeField] private Image _wisdomBar;
        [SerializeField] private Image _burdenBar;

        [Header("Stat Labels")]
        [SerializeField] private TextMeshProUGUI _faithLabel;
        [SerializeField] private TextMeshProUGUI _courageLabel;
        [SerializeField] private TextMeshProUGUI _wisdomLabel;
        [SerializeField] private TextMeshProUGUI _burdenLabel;

        [Header("Stat Values")]
        [SerializeField] private TextMeshProUGUI _faithValue;
        [SerializeField] private TextMeshProUGUI _courageValue;
        [SerializeField] private TextMeshProUGUI _wisdomValue;
        [SerializeField] private TextMeshProUGUI _burdenValue;

        [Header("Change Notification")]
        [SerializeField] private GameObject _statChangeNotification;
        [SerializeField] private TextMeshProUGUI _statChangeText;

        [Header("Animation")]
        [SerializeField] private float _barAnimationDuration = 0.5f;

        [Header("Colors")]
        [SerializeField] private Color _faithColor = new Color(0.93f, 0.79f, 0.30f);
        [SerializeField] private Color _courageColor = new Color(0.80f, 0.28f, 0.28f);
        [SerializeField] private Color _wisdomColor = new Color(0.28f, 0.56f, 0.80f);
        [SerializeField] private Color _burdenColor = new Color(0.45f, 0.35f, 0.28f);

        private StatsManager _statsManager;

        private void Start()
        {
            _statsManager = ServiceLocator.Get<StatsManager>();

            if (_statsManager != null)
            {
                _statsManager.OnStatChanged += HandleStatChanged;
                _statsManager.OnBurdenChanged += HandleBurdenChanged;
                UpdateAllBars();
            }

            if (_faithBar != null) _faithBar.color = _faithColor;
            if (_courageBar != null) _courageBar.color = _courageColor;
            if (_wisdomBar != null) _wisdomBar.color = _wisdomColor;
            if (_burdenBar != null) _burdenBar.color = _burdenColor;

            if (_statChangeNotification != null)
                _statChangeNotification.SetActive(false);

            UpdateLabels();
        }

        private void OnDestroy()
        {
            if (_statsManager != null)
            {
                _statsManager.OnStatChanged -= HandleStatChanged;
                _statsManager.OnBurdenChanged -= HandleBurdenChanged;
            }
        }

        private void HandleStatChanged(string statName, int oldValue, int newValue)
        {
            int delta = newValue - oldValue;
            Image bar = GetBarForStat(statName);
            if (bar != null)
            {
                StartCoroutine(AnimateBar(bar, oldValue, newValue, CharacterStats.MaxStatValue));
            }

            UpdateStatValue(statName, newValue);
            ShowChangeNotification(statName, delta);
        }

        private void HandleBurdenChanged(int oldValue, int newValue)
        {
            int delta = newValue - oldValue;
            if (_burdenBar != null)
            {
                StartCoroutine(AnimateBar(_burdenBar, oldValue, newValue, CharacterStats.MaxBurden));
            }

            if (_burdenValue != null)
                _burdenValue.text = newValue.ToString();

            ShowChangeNotification("burden", delta);
        }

        private IEnumerator AnimateBar(Image bar, int oldValue, int newValue, int maxValue)
        {
            float elapsed = 0f;
            float startFill = (float)oldValue / maxValue;
            float endFill = (float)newValue / maxValue;

            while (elapsed < _barAnimationDuration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.SmoothStep(0f, 1f, elapsed / _barAnimationDuration);
                bar.fillAmount = Mathf.Lerp(startFill, endFill, t);
                yield return null;
            }

            bar.fillAmount = endFill;
        }

        private void ShowChangeNotification(string statName, int delta)
        {
            if (_statChangeNotification == null || _statChangeText == null) return;

            var loc = ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) ? lm : null;
            string localizedName = loc != null ? loc.Get($"stat_{statName.ToLower()}") : statName;

            string sign = delta > 0 ? "+" : "";
            string colorHex = delta > 0 ? "#4CAF50" : "#F44336";
            _statChangeText.text = $"<color={colorHex}>{localizedName} {sign}{delta}</color>";

            _statChangeNotification.SetActive(true);
            StartCoroutine(HideNotificationAfterDelay(2f));
        }

        private IEnumerator HideNotificationAfterDelay(float delay)
        {
            yield return new WaitForSeconds(delay);
            if (_statChangeNotification != null)
                _statChangeNotification.SetActive(false);
        }

        private void UpdateAllBars()
        {
            if (_statsManager == null) return;
            var stats = _statsManager.Stats;

            if (_faithBar != null) _faithBar.fillAmount = (float)stats.Faith / CharacterStats.MaxStatValue;
            if (_courageBar != null) _courageBar.fillAmount = (float)stats.Courage / CharacterStats.MaxStatValue;
            if (_wisdomBar != null) _wisdomBar.fillAmount = (float)stats.Wisdom / CharacterStats.MaxStatValue;
            if (_burdenBar != null) _burdenBar.fillAmount = (float)stats.Burden / CharacterStats.MaxBurden;

            if (_faithValue != null) _faithValue.text = stats.Faith.ToString();
            if (_courageValue != null) _courageValue.text = stats.Courage.ToString();
            if (_wisdomValue != null) _wisdomValue.text = stats.Wisdom.ToString();
            if (_burdenValue != null) _burdenValue.text = stats.Burden.ToString();
        }

        private void UpdateLabels()
        {
            var loc = ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) ? lm : null;
            if (loc == null) return;

            if (_faithLabel != null) _faithLabel.text = loc.Get("stat_faith");
            if (_courageLabel != null) _courageLabel.text = loc.Get("stat_courage");
            if (_wisdomLabel != null) _wisdomLabel.text = loc.Get("stat_wisdom");
            if (_burdenLabel != null) _burdenLabel.text = loc.Get("stat_burden");
        }

        private void UpdateStatValue(string statName, int value)
        {
            switch (statName.ToLower())
            {
                case "faith":
                    if (_faithValue != null) _faithValue.text = value.ToString();
                    break;
                case "courage":
                    if (_courageValue != null) _courageValue.text = value.ToString();
                    break;
                case "wisdom":
                    if (_wisdomValue != null) _wisdomValue.text = value.ToString();
                    break;
            }
        }

        private Image GetBarForStat(string statName)
        {
            switch (statName.ToLower())
            {
                case "faith": return _faithBar;
                case "courage": return _courageBar;
                case "wisdom": return _wisdomBar;
                default: return null;
            }
        }
    }
}
