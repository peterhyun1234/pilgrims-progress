using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
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
        [SerializeField] private GameObject _prologuePanel;

        [Header("Language Select")]
        [SerializeField] private Button _koreanButton;
        [SerializeField] private Button _englishButton;

        [Header("Character Creation")]
        [SerializeField] private CharacterCreationUI _characterCreationUI;

        [Header("Guest Mode")]
        [SerializeField] private TextMeshProUGUI _guestLabel;
        [SerializeField] private Button _createAccountButton;

        private bool _isFirstRunFlow;
        private Coroutine _panelTransition;

        private void Start()
        {
            SetupButtonListeners();
            AddHoverEffects();

            var gm = GameManager.Instance;
            _isFirstRunFlow = gm != null && gm.IsFirstRun;

            if (_isFirstRunFlow || (gm != null && gm.CurrentState == GameState.LanguageSelect))
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
                _createAccountButton.interactable = false;

            bool hasSave = GameManager.Instance != null && GameManager.Instance.HasSaveData();
            if (_continueButton != null) _continueButton.interactable = hasSave;
            if (_collectionButton != null) _collectionButton.interactable = false;
            if (_settingsButton != null) _settingsButton.interactable = false;

            DimDisabledButtons();
        }

        private void AddHoverEffects()
        {
            AddHoverScale(_newGameButton);
            AddHoverScale(_continueButton);
            AddHoverScale(_collectionButton);
            AddHoverScale(_settingsButton);
            AddHoverScale(_languageButton);
            AddHoverScale(_quitButton);
            AddHoverScale(_koreanButton);
            AddHoverScale(_englishButton);
        }

        private static void AddHoverScale(Button btn)
        {
            if (btn == null) return;
            var hover = btn.gameObject.AddComponent<ButtonHoverEffect>();
            hover.Initialize(btn);
        }

        private void DimDisabledButtons()
        {
            Button[] buttons = { _continueButton, _collectionButton, _settingsButton };
            foreach (var btn in buttons)
            {
                if (btn == null || btn.interactable) continue;
                var img = btn.GetComponent<Image>();
                if (img != null)
                {
                    var c = img.color;
                    img.color = new Color(c.r, c.g, c.b, c.a * 0.4f);
                }
                var label = btn.GetComponentInChildren<TextMeshProUGUI>();
                if (label != null)
                {
                    var c = label.color;
                    label.color = new Color(c.r, c.g, c.b, 0.35f);
                }
            }
        }

        private void HideAllPanels()
        {
            if (_languageSelectPanel != null) _languageSelectPanel.SetActive(false);
            if (_mainButtonsPanel != null) _mainButtonsPanel.SetActive(false);
            if (_settingsPanel != null) _settingsPanel.SetActive(false);
            if (_prologuePanel != null) _prologuePanel.SetActive(false);
            if (_characterCreationUI != null) _characterCreationUI.Hide();
        }

        private void ShowLanguageSelect()
        {
            TransitionToPanel(_languageSelectPanel);
        }

        private void ShowMainMenu()
        {
            TransitionToPanel(_mainButtonsPanel);
        }

        private void TransitionToPanel(GameObject target)
        {
            if (_panelTransition != null)
                StopCoroutine(_panelTransition);
            _panelTransition = StartCoroutine(PanelFadeTransition(target));
        }

        private IEnumerator PanelFadeTransition(GameObject target)
        {
            var cg = EnsureCanvasGroup(target);

            HideAllPanels();

            if (target != null)
            {
                target.SetActive(true);
                cg.alpha = 0f;

                float elapsed = 0f;
                const float duration = 0.3f;
                while (elapsed < duration)
                {
                    elapsed += Time.deltaTime;
                    cg.alpha = Mathf.Clamp01(elapsed / duration);
                    yield return null;
                }
                cg.alpha = 1f;
            }

            _panelTransition = null;
        }

        private static CanvasGroup EnsureCanvasGroup(GameObject go)
        {
            if (go == null) return null;
            var cg = go.GetComponent<CanvasGroup>();
            if (cg == null) cg = go.AddComponent<CanvasGroup>();
            return cg;
        }

        private void SelectLanguage(string langCode)
        {
            var loc = ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) ? lm : null;
            if (loc != null)
                loc.SetLanguage(langCode);

            if (GameManager.Instance != null)
                GameManager.Instance.SetLanguage(langCode);

            if (_isFirstRunFlow)
            {
                StartCoroutine(FadeToCharacterCreation());
            }
            else
            {
                if (GameManager.Instance != null)
                    GameManager.Instance.SetState(GameState.MainMenu);
                ShowMainMenu();
            }

            UpdateLocalization();
        }

        private IEnumerator FadeToCharacterCreation()
        {
            var tc = GetTransitionController();
            if (tc != null) yield return tc.FadeOut(0.4f);
            ShowCharacterCreation();
            if (tc != null) yield return tc.FadeIn(0.4f);
        }

        private void ShowCharacterCreation()
        {
            HideAllPanels();

            if (_characterCreationUI == null)
            {
                var canvas = GetComponentInParent<Canvas>();
                var parent = canvas != null ? canvas.transform : transform;

                var go = new GameObject("CharacterCreationUI");
                go.transform.SetParent(parent, false);
                var rt = go.AddComponent<RectTransform>();
                rt.anchorMin = Vector2.zero;
                rt.anchorMax = Vector2.one;
                rt.sizeDelta = Vector2.zero;
                _characterCreationUI = go.AddComponent<CharacterCreationUI>();
            }

            _characterCreationUI.OnConfirmed -= OnCharacterConfirmed;
            _characterCreationUI.OnConfirmed += OnCharacterConfirmed;
            _characterCreationUI.OnBack -= OnCharacterCreationBack;
            _characterCreationUI.OnBack += OnCharacterCreationBack;

            _characterCreationUI.Show();
        }

        private static Scene.TransitionController GetTransitionController()
        {
            return ServiceLocator.TryGet<Scene.TransitionController>(out var tc) ? tc : null;
        }

        private void UpdateLocalization()
        {
            var loc = ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) ? lm : null;
            if (loc == null) return;

            if (_titleText != null) _titleText.text = loc.Get("game_title");
            if (_subtitleText != null) _subtitleText.text = loc.Get("game_subtitle");
            if (_newGameLabel != null) _newGameLabel.text = loc.Get("menu_new_game");
            if (_continueLabel != null) _continueLabel.text = loc.Get("menu_continue");
            string soon = loc.CurrentLanguage == "ko" ? " (준비 중)" : " (Soon)";
            if (_collectionLabel != null) _collectionLabel.text = loc.Get("menu_collection") + soon;
            if (_settingsLabel != null) _settingsLabel.text = loc.Get("menu_settings") + soon;
            if (_languageLabel != null) _languageLabel.text = loc.Get("menu_language");
            if (_quitLabel != null) _quitLabel.text = loc.Get("menu_quit");
            if (_guestLabel != null) _guestLabel.text = loc.Get("game_guest");
        }

        private void OnNewGame()
        {
            ShowCharacterCreation();
        }

        private void OnCharacterConfirmed()
        {
            if (_isFirstRunFlow)
            {
                if (GameManager.Instance != null)
                    GameManager.Instance.CompleteFirstRun();
            }

            StartCoroutine(FadeToPrologue());
        }

        private IEnumerator FadeToPrologue()
        {
            var tc = GetTransitionController();
            if (tc != null) yield return tc.FadeOut(0.5f);

            HideAllPanels();
            if (_prologuePanel != null)
                _prologuePanel.SetActive(true);
            else
                BuildProloguePanel();

            if (tc != null) yield return tc.FadeIn(0.5f);
        }

        private void BuildProloguePanel()
        {
            var rootCanvas = GetComponentInParent<Canvas>();
            var parentTransform = rootCanvas != null ? rootCanvas.transform : transform;

            var panel = new GameObject("ProloguePanel");
            panel.transform.SetParent(parentTransform, false);
            var rt = panel.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.sizeDelta = Vector2.zero;
            panel.transform.SetAsLastSibling();

            var bg = panel.AddComponent<Image>();
            bg.color = new Color(0.02f, 0.01f, 0.05f, 0.98f);
            bg.raycastTarget = true;

            _prologuePanel = panel;

            var prologueUI = panel.AddComponent<PrologueUI>();
            prologueUI.OnPrologueComplete += OnPrologueComplete;
        }

        private void OnPrologueComplete()
        {
            StartCoroutine(FadeToGameplay());
        }

        private IEnumerator FadeToGameplay()
        {
            var tc = GetTransitionController();
            if (tc != null) yield return tc.FadeOut(0.6f);

            if (GameManager.Instance != null)
                GameManager.Instance.SetState(GameState.Gameplay);

            var sceneLoader = ServiceLocator.TryGet<Scene.SceneLoader>(out var sl) ? sl : null;
            if (sceneLoader != null)
                sceneLoader.LoadScene("Gameplay");
            else
                UnityEngine.SceneManagement.SceneManager.LoadScene("Gameplay");
        }

        private void OnCharacterCreationBack()
        {
            if (_characterCreationUI != null)
                _characterCreationUI.Hide();

            if (_isFirstRunFlow)
                ShowLanguageSelect();
            else
                ShowMainMenu();
        }

        private void OnContinue()
        {
            StartCoroutine(FadeToGameplay());
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
                if (_mainButtonsPanel != null)
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

    public class ButtonHoverEffect : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler
    {
        private Button _button;
        private Vector3 _originalScale;
        private Coroutine _scaleRoutine;

        public void Initialize(Button button)
        {
            _button = button;
            _originalScale = transform.localScale;
        }

        public void OnPointerEnter(PointerEventData eventData)
        {
            if (_button != null && !_button.interactable) return;
            AnimateTo(_originalScale * 1.06f);
        }

        public void OnPointerExit(PointerEventData eventData)
        {
            AnimateTo(_originalScale);
        }

        private void AnimateTo(Vector3 target)
        {
            if (_scaleRoutine != null) StopCoroutine(_scaleRoutine);
            _scaleRoutine = StartCoroutine(ScaleTo(target));
        }

        private System.Collections.IEnumerator ScaleTo(Vector3 target)
        {
            float elapsed = 0f;
            const float duration = 0.12f;
            var start = transform.localScale;
            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                t = t * t * (3f - 2f * t);
                transform.localScale = Vector3.Lerp(start, target, t);
                yield return null;
            }
            transform.localScale = target;
        }
    }
}
