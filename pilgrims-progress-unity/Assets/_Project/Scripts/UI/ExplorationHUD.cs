using UnityEngine;
using UnityEngine.UI;
using UnityEngine.InputSystem;
using TMPro;
using PilgrimsProgress.Core;
using PilgrimsProgress.Narrative;

namespace PilgrimsProgress.UI
{
    public class ExplorationHUD : MonoBehaviour
    {
        [Header("Stats Bars")]
        [SerializeField] private Image _faithBar;
        [SerializeField] private Image _courageBar;
        [SerializeField] private Image _wisdomBar;
        [SerializeField] private TextMeshProUGUI _faithLabel;
        [SerializeField] private TextMeshProUGUI _courageLabel;
        [SerializeField] private TextMeshProUGUI _wisdomLabel;

        [Header("Burden")]
        [SerializeField] private Image _burdenIcon;
        [SerializeField] private Image _burdenFill;
        [SerializeField] private TextMeshProUGUI _burdenText;

        [Header("Location")]
        [SerializeField] private TextMeshProUGUI _locationName;

        [Header("Interact Prompt")]
        [SerializeField] private GameObject _interactPrompt;
        [SerializeField] private TextMeshProUGUI _interactText;

        [Header("Mobile Controls")]
        [SerializeField] private GameObject _mobileJoystickArea;
        [SerializeField] private GameObject _mobileInteractButton;

        [Header("Canvas Group")]
        [SerializeField] private CanvasGroup _canvasGroup;

        private StatsManager _statsManager;
        private GameModeManager _modeManager;

        private void Start()
        {
            _statsManager = ServiceLocator.Get<StatsManager>();
            _modeManager = ServiceLocator.Get<GameModeManager>();

            if (_statsManager != null)
            {
                _statsManager.OnStatChanged += HandleStatChanged;
                _statsManager.OnBurdenChanged += HandleBurdenChanged;
                _statsManager.OnTierChanged += HandleTierChanged;
                UpdateAllBars();
                UpdateLabelsWithTiers();
            }

            if (_modeManager != null)
            {
                _modeManager.OnModeChanged += HandleModeChanged;
            }

            bool isMobile = Application.isMobilePlatform;
            if (_mobileJoystickArea != null) _mobileJoystickArea.SetActive(isMobile);
            if (_mobileInteractButton != null) _mobileInteractButton.SetActive(isMobile);
        }

        private void OnDestroy()
        {
            if (_statsManager != null)
            {
                _statsManager.OnStatChanged -= HandleStatChanged;
                _statsManager.OnBurdenChanged -= HandleBurdenChanged;
                _statsManager.OnTierChanged -= HandleTierChanged;
            }

            if (_modeManager != null)
            {
                _modeManager.OnModeChanged -= HandleModeChanged;
            }
        }

        public void SetLocationName(string name)
        {
            if (_locationName != null)
                _locationName.text = name;
        }

        public void ShowInteractPrompt(bool show, string text = "")
        {
            if (_interactPrompt != null)
                _interactPrompt.SetActive(show);
            if (_interactText != null && !string.IsNullOrEmpty(text))
                _interactText.text = text;
        }

        private void Update()
        {
            var kb = Keyboard.current;
            if (kb == null) return;

            if (kb.tabKey.wasPressedThisFrame)
            {
                var modeManager = GameModeManager.Instance;
                if (modeManager != null && modeManager.CurrentMode == GameMode.Exploration)
                    JourneyMapUI.Instance?.Show();
            }
        }

        private void HandleStatChanged(string statName, int oldVal, int newVal)
        {
            float normalized = newVal / (float)CharacterStats.MaxStatValue;

            switch (statName.ToLower())
            {
                case "faith":
                    if (_faithBar != null) _faithBar.fillAmount = normalized;
                    UpdateBarColor(_faithBar, statName, newVal);
                    break;
                case "courage":
                    if (_courageBar != null) _courageBar.fillAmount = normalized;
                    UpdateBarColor(_courageBar, statName, newVal);
                    break;
                case "wisdom":
                    if (_wisdomBar != null) _wisdomBar.fillAmount = normalized;
                    UpdateBarColor(_wisdomBar, statName, newVal);
                    break;
            }
            UpdateLabelsWithTiers();
        }

        private void HandleTierChanged(string stat, StatTier oldTier, StatTier newTier)
        {
            UpdateLabelsWithTiers();
        }

        private void UpdateLabelsWithTiers()
        {
            if (_statsManager == null) return;

            var lm = ServiceLocator.TryGet<Localization.LocalizationManager>(out var l) ? l : null;
            bool isKo = lm != null && lm.CurrentLanguage == "ko";

            if (_faithLabel != null)
            {
                string tier = GetTierSymbol(_statsManager.GetFaithTier());
                _faithLabel.text = isKo ? $"믿음 {tier}" : $"Faith {tier}";
            }
            if (_courageLabel != null)
            {
                string tier = GetTierSymbol(_statsManager.GetCourageTier());
                _courageLabel.text = isKo ? $"용기 {tier}" : $"Courage {tier}";
            }
            if (_wisdomLabel != null)
            {
                string tier = GetTierSymbol(_statsManager.GetWisdomTier());
                _wisdomLabel.text = isKo ? $"지혜 {tier}" : $"Wisdom {tier}";
            }
        }

        private static string GetTierSymbol(StatTier tier)
        {
            switch (tier)
            {
                case StatTier.Mastered: return "\u2605";  // filled star
                case StatTier.High: return "\u2606";       // empty star
                case StatTier.Medium: return "\u25C6";     // diamond
                case StatTier.Low: return "\u25CB";         // circle
                default: return "\u25CB";
            }
        }

        private void UpdateBarColor(Image bar, string stat, int value)
        {
            if (bar == null) return;
            var tier = StatsManager.GetTier(value);

            Color baseColor;
            switch (stat.ToLower())
            {
                case "faith": baseColor = new Color(0.9f, 0.8f, 0.3f); break;
                case "courage": baseColor = new Color(0.3f, 0.6f, 0.9f); break;
                case "wisdom": baseColor = new Color(0.4f, 0.8f, 0.4f); break;
                default: baseColor = Color.white; break;
            }

            if (tier == StatTier.Mastered)
                bar.color = Color.Lerp(baseColor, Color.white, 0.3f);
            else if (tier == StatTier.Depleted)
                bar.color = Color.Lerp(baseColor, new Color(0.5f, 0.3f, 0.3f), 0.5f);
            else
                bar.color = baseColor;
        }

        private void HandleBurdenChanged(int oldVal, int newVal)
        {
            if (_burdenFill != null)
                _burdenFill.fillAmount = newVal / (float)CharacterStats.MaxBurden;
            if (_burdenText != null)
                _burdenText.text = newVal.ToString();
        }

        private void HandleModeChanged(GameMode previous, GameMode current)
        {
            bool showHUD = current == GameMode.Exploration;
            if (_canvasGroup != null)
            {
                _canvasGroup.alpha = showHUD ? 1f : 0f;
                _canvasGroup.interactable = showHUD;
                _canvasGroup.blocksRaycasts = showHUD;
            }
        }

        private void UpdateAllBars()
        {
            if (_statsManager == null) return;

            var stats = _statsManager.Stats;
            float max = CharacterStats.MaxStatValue;

            if (_faithBar != null) _faithBar.fillAmount = stats.Faith / max;
            if (_courageBar != null) _courageBar.fillAmount = stats.Courage / max;
            if (_wisdomBar != null) _wisdomBar.fillAmount = stats.Wisdom / max;
            if (_burdenFill != null) _burdenFill.fillAmount = stats.Burden / (float)CharacterStats.MaxBurden;
            if (_burdenText != null) _burdenText.text = stats.Burden.ToString();
        }
    }
}
