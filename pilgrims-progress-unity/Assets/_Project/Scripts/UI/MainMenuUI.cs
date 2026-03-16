using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.UI
{
    public class MainMenuUI : MonoBehaviour
    {
        [Header("Title")]
        [SerializeField] private TextMeshProUGUI _titleText;
        [SerializeField] private TextMeshProUGUI _subtitleText;

        [Header("Buttons")]
        [SerializeField] private Button _newGameButton;
        [SerializeField] private Button _continueButton;
        [SerializeField] private Button _collectionButton;
        [SerializeField] private Button _settingsButton;
        [SerializeField] private Button _languageButton;
        [SerializeField] private Button _quitButton;

        [Header("Button Labels")]
        [SerializeField] private TextMeshProUGUI _newGameLabel;
        [SerializeField] private TextMeshProUGUI _continueLabel;
        [SerializeField] private TextMeshProUGUI _collectionLabel;
        [SerializeField] private TextMeshProUGUI _settingsLabel;
        [SerializeField] private TextMeshProUGUI _languageLabel;
        [SerializeField] private TextMeshProUGUI _quitLabel;

        [Header("Panels")]
        [SerializeField] private GameObject _languageSelectPanel;
        [SerializeField] private GameObject _settingsPanel;
        [SerializeField] private GameObject _mainButtonsPanel;

        [Header("Language Select")]
        [SerializeField] private Button _koreanButton;
        [SerializeField] private Button _englishButton;

        [Header("Guest Mode")]
        [SerializeField] private TextMeshProUGUI _guestLabel;
        [SerializeField] private Button _createAccountButton;

        private void Start()
        {
            SetupButtonListeners();

            var gm = GameManager.Instance;
            if (gm != null && gm.CurrentState == GameState.LanguageSelect)
            {
                ShowLanguageSelect();
            }
            else
            {
                ShowMainMenu();
            }

            UpdateLocalization();
        }

        private void SetupButtonListeners()
        {
            if (_newGameButton != null) _newGameButton.onClick.AddListener(OnNewGame);
            if (_continueButton != null) _continueButton.onClick.AddListener(OnContinue);
            if (_collectionButton != null) _collectionButton.onClick.AddListener(OnCollection);
            if (_settingsButton != null) _settingsButton.onClick.AddListener(OnSettings);
            if (_languageButton != null) _languageButton.onClick.AddListener(OnLanguage);
            if (_quitButton != null) _quitButton.onClick.AddListener(OnQuit);

            if (_koreanButton != null) _koreanButton.onClick.AddListener(() => SelectLanguage("ko"));
            if (_englishButton != null) _englishButton.onClick.AddListener(() => SelectLanguage("en"));

            if (_createAccountButton != null)
            {
                _createAccountButton.interactable = false;
            }

            bool hasSave = PlayerPrefs.HasKey("SaveSlot_Auto");
            if (_continueButton != null) _continueButton.interactable = hasSave;
        }

        private void ShowLanguageSelect()
        {
            if (_languageSelectPanel != null) _languageSelectPanel.SetActive(true);
            if (_mainButtonsPanel != null) _mainButtonsPanel.SetActive(false);
            if (_settingsPanel != null) _settingsPanel.SetActive(false);
        }

        private void ShowMainMenu()
        {
            if (_languageSelectPanel != null) _languageSelectPanel.SetActive(false);
            if (_mainButtonsPanel != null) _mainButtonsPanel.SetActive(true);
            if (_settingsPanel != null) _settingsPanel.SetActive(false);
        }

        private void SelectLanguage(string langCode)
        {
            var loc = ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) ? lm : null;
            if (loc != null)
            {
                loc.SetLanguage(langCode);
            }

            if (GameManager.Instance != null)
            {
                GameManager.Instance.SetState(GameState.MainMenu);
            }

            ShowMainMenu();
            UpdateLocalization();
        }

        private void UpdateLocalization()
        {
            var loc = ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) ? lm : null;
            if (loc == null) return;

            if (_titleText != null) _titleText.text = loc.Get("game_title");
            if (_subtitleText != null) _subtitleText.text = loc.Get("game_subtitle");
            if (_newGameLabel != null) _newGameLabel.text = loc.Get("menu_new_game");
            if (_continueLabel != null) _continueLabel.text = loc.Get("menu_continue");
            if (_collectionLabel != null) _collectionLabel.text = loc.Get("menu_collection");
            if (_settingsLabel != null) _settingsLabel.text = loc.Get("menu_settings");
            if (_languageLabel != null) _languageLabel.text = loc.Get("menu_language");
            if (_quitLabel != null) _quitLabel.text = loc.Get("menu_quit");
            if (_guestLabel != null) _guestLabel.text = loc.Get("game_guest");
        }

        private void OnNewGame()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.SetState(GameState.Prologue);
            }

            var sceneLoader = ServiceLocator.TryGet<Scene.SceneLoader>(out var sl) ? sl : null;
            if (sceneLoader != null)
            {
                sceneLoader.LoadScene("Gameplay");
            }
            else
            {
                UnityEngine.SceneManagement.SceneManager.LoadScene("Gameplay");
            }
        }

        private void OnContinue()
        {
            Debug.Log("[MainMenu] Continue - Load save");
        }

        private void OnCollection()
        {
            Debug.Log("[MainMenu] Collection");
        }

        private void OnSettings()
        {
            if (_settingsPanel != null)
            {
                _settingsPanel.SetActive(true);
                _mainButtonsPanel.SetActive(false);
            }
        }

        private void OnLanguage()
        {
            ShowLanguageSelect();
        }

        private void OnQuit()
        {
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit();
#endif
        }
    }
}
