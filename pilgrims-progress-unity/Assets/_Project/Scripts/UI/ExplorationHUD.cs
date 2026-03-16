using UnityEngine;
using UnityEngine.UI;
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
                UpdateAllBars();
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

        private void HandleStatChanged(string statName, int oldVal, int newVal)
        {
            float normalized = newVal / (float)CharacterStats.MaxStatValue;

            switch (statName.ToLower())
            {
                case "faith":
                    if (_faithBar != null) _faithBar.fillAmount = normalized;
                    break;
                case "courage":
                    if (_courageBar != null) _courageBar.fillAmount = normalized;
                    break;
                case "wisdom":
                    if (_wisdomBar != null) _wisdomBar.fillAmount = normalized;
                    break;
            }
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
