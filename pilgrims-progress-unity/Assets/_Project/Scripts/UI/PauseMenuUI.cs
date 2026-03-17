using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.InputSystem;
using TMPro;
using PilgrimsProgress.Core;
using PilgrimsProgress.Localization;

namespace PilgrimsProgress.UI
{
    public class PauseMenuUI : MonoBehaviour
    {
        public static PauseMenuUI Instance { get; private set; }

        private Canvas _canvas;
        private CanvasGroup _canvasGroup;
        private GameObject _mainPanel;
        private GameObject _confirmPanel;

        private Button _resumeBtn;
        private Button _saveBtn;
        private Button _settingsBtn;
        private Button _journeyBtn;
        private Button _mainMenuBtn;
        private Button _quitBtn;
        private Button _confirmYesBtn;
        private Button _confirmNoBtn;
        private TextMeshProUGUI _confirmText;

        private bool _isPaused;
        private System.Action _pendingConfirmAction;

        private static readonly Color PanelBg = new Color(0.03f, 0.02f, 0.06f, 0.92f);
        private static readonly Color BtnNormal = new Color(0.12f, 0.10f, 0.18f, 0.90f);
        private static readonly Color BtnDanger = new Color(0.28f, 0.12f, 0.12f, 0.90f);
        private static readonly Color Gold = new Color(0.90f, 0.78f, 0.45f);
        private static readonly Color TextLight = new Color(0.92f, 0.90f, 0.85f);

        private void Awake()
        {
            Instance = this;
            BuildUI();
            _canvas.enabled = false;
        }

        private void Update()
        {
            var kb = Keyboard.current;
            if (kb == null) return;

            if (kb.escapeKey.wasPressedThisFrame)
            {
                var gm = GameManager.Instance;
                if (gm == null || gm.CurrentState != GameState.Gameplay) return;

                var modeManager = GameModeManager.Instance;
                if (modeManager != null && modeManager.CurrentMode == GameMode.Dialogue) return;

                if (_isPaused)
                    Resume();
                else
                    Pause();
            }
        }

        public void Pause()
        {
            if (_isPaused) return;
            _isPaused = true;

            _canvas.enabled = true;
            _mainPanel.SetActive(true);
            if (_confirmPanel != null) _confirmPanel.SetActive(false);

            Time.timeScale = 0f;

            var modeManager = GameModeManager.Instance;
            modeManager?.EnterMenuMode();

            StartCoroutine(FadeIn());
            KoreanFontSetup.ApplyToAll();
        }

        public void Resume()
        {
            if (!_isPaused) return;
            StartCoroutine(FadeOutAndResume());
        }

        private IEnumerator FadeIn()
        {
            float t = 0;
            while (t < 0.15f)
            {
                t += Time.unscaledDeltaTime;
                _canvasGroup.alpha = Mathf.Clamp01(t / 0.15f);
                yield return null;
            }
            _canvasGroup.alpha = 1;
        }

        private IEnumerator FadeOutAndResume()
        {
            float t = 0;
            while (t < 0.1f)
            {
                t += Time.unscaledDeltaTime;
                _canvasGroup.alpha = 1 - Mathf.Clamp01(t / 0.1f);
                yield return null;
            }

            _canvasGroup.alpha = 0;
            _canvas.enabled = false;
            _isPaused = false;

            Time.timeScale = 1f;

            var modeManager = GameModeManager.Instance;
            modeManager?.ExitMenuMode();
        }

        private void ShowConfirm(string messageKey, System.Action onConfirm)
        {
            _pendingConfirmAction = onConfirm;
            _mainPanel.SetActive(false);
            _confirmPanel.SetActive(true);
            _confirmText.text = GetLoc(messageKey);
        }

        private void OnConfirmYes()
        {
            _pendingConfirmAction?.Invoke();
            _pendingConfirmAction = null;
        }

        private void OnConfirmNo()
        {
            _confirmPanel.SetActive(false);
            _mainPanel.SetActive(true);
            _pendingConfirmAction = null;
        }

        private void OnSave()
        {
            var saveMgr = FindFirstObjectByType<Save.SaveManager>();
            if (saveMgr != null)
            {
                saveMgr.AutoSave();
                ToastUI.Instance?.Show(GetLoc("pause_saved"));
            }
        }

        private void OnJourney()
        {
            JourneyMapUI.Instance?.Show();
        }

        private void OnMainMenu()
        {
            ShowConfirm("pause_confirm_menu", () =>
            {
                Time.timeScale = 1f;
                _isPaused = false;
                UnityEngine.SceneManagement.SceneManager.LoadScene("MainMenu");
            });
        }

        private void OnQuit()
        {
            ShowConfirm("pause_confirm_quit", () =>
            {
#if UNITY_EDITOR
                UnityEditor.EditorApplication.isPlaying = false;
#else
                Application.Quit();
#endif
            });
        }

        private void BuildUI()
        {
            var canvasGo = new GameObject("PauseCanvas");
            canvasGo.transform.SetParent(transform, false);
            _canvas = canvasGo.AddComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _canvas.sortingOrder = 100;
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();
            _canvasGroup = canvasGo.AddComponent<CanvasGroup>();
            _canvasGroup.alpha = 0;

            // Dimmed background
            var dimGo = new GameObject("Dim");
            dimGo.transform.SetParent(canvasGo.transform, false);
            var dimImg = dimGo.AddComponent<Image>();
            dimImg.color = new Color(0, 0, 0, 0.6f);
            dimImg.raycastTarget = true;
            Stretch(dimImg.rectTransform);

            _mainPanel = BuildMainPanel(canvasGo.transform);
            _confirmPanel = BuildConfirmPanel(canvasGo.transform);
            _confirmPanel.SetActive(false);
        }

        private GameObject BuildMainPanel(Transform parent)
        {
            var panel = new GameObject("PauseMainPanel");
            panel.transform.SetParent(parent, false);
            var rt = panel.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.30f, 0.15f);
            rt.anchorMax = new Vector2(0.70f, 0.85f);
            rt.sizeDelta = Vector2.zero;

            var bg = panel.AddComponent<Image>();
            bg.color = PanelBg;

            // Title
            var title = MakeTMP(panel.transform, "PauseTitle",
                new Vector2(0.1f, 0.85f), new Vector2(0.9f, 0.95f),
                32, Gold, TextAlignmentOptions.Center);
            title.fontStyle = FontStyles.Bold;
            title.text = GetLoc("pause_title");

            // Decorative line
            MakeImage(panel.transform, "PauseDeco",
                new Vector2(0.25f, 0.84f), new Vector2(0.75f, 0.843f),
                new Color(Gold.r, Gold.g, Gold.b, 0.4f));

            // Chapter info
            var chapterMgr = ChapterManager.Instance;
            int ch = chapterMgr != null ? chapterMgr.CurrentChapter : 1;
            var chData = ChapterDatabase.Get(ch);
            bool isKo = IsKorean();
            string chapterInfo = $"Ch.{ch}  {(isKo ? chData.NameKR : chData.NameEN)}";
            MakeTMP(panel.transform, "ChapterInfo",
                new Vector2(0.1f, 0.76f), new Vector2(0.9f, 0.84f),
                18, new Color(0.7f, 0.65f, 0.55f), TextAlignmentOptions.Center).text = chapterInfo;

            float btnY = 0.66f;
            float btnStep = 0.10f;

            _resumeBtn = MakeButton(panel.transform, "ResumeBtn",
                new Vector2(0.15f, btnY - 0.035f), new Vector2(0.85f, btnY + 0.035f),
                new Color(0.15f, 0.28f, 0.18f, 0.90f), GetLoc("pause_resume"), 24);
            _resumeBtn.onClick.AddListener(Resume);
            btnY -= btnStep;

            _saveBtn = MakeButton(panel.transform, "SaveBtn",
                new Vector2(0.15f, btnY - 0.035f), new Vector2(0.85f, btnY + 0.035f),
                BtnNormal, GetLoc("pause_save"), 22);
            _saveBtn.onClick.AddListener(OnSave);
            btnY -= btnStep;

            _journeyBtn = MakeButton(panel.transform, "JourneyBtn",
                new Vector2(0.15f, btnY - 0.035f), new Vector2(0.85f, btnY + 0.035f),
                BtnNormal, GetLoc("pause_journey"), 22);
            _journeyBtn.onClick.AddListener(OnJourney);
            btnY -= btnStep;

            _settingsBtn = MakeButton(panel.transform, "SettingsBtn",
                new Vector2(0.15f, btnY - 0.035f), new Vector2(0.85f, btnY + 0.035f),
                BtnNormal, GetLoc("pause_settings"), 22);
            _settingsBtn.onClick.AddListener(() => { /* TODO: settings in-game */ });
            btnY -= btnStep;

            _mainMenuBtn = MakeButton(panel.transform, "MainMenuBtn",
                new Vector2(0.15f, btnY - 0.035f), new Vector2(0.85f, btnY + 0.035f),
                BtnDanger, GetLoc("pause_main_menu"), 22);
            _mainMenuBtn.onClick.AddListener(OnMainMenu);
            btnY -= btnStep;

            _quitBtn = MakeButton(panel.transform, "QuitBtn",
                new Vector2(0.15f, btnY - 0.035f), new Vector2(0.85f, btnY + 0.035f),
                BtnDanger, GetLoc("pause_quit"), 22);
            _quitBtn.onClick.AddListener(OnQuit);

            // Hint at bottom
            MakeTMP(panel.transform, "PauseHint",
                new Vector2(0.1f, 0.02f), new Vector2(0.9f, 0.08f),
                14, new Color(0.5f, 0.5f, 0.5f), TextAlignmentOptions.Center).text =
                GetLoc("pause_hint_esc");

            return panel;
        }

        private GameObject BuildConfirmPanel(Transform parent)
        {
            var panel = new GameObject("ConfirmPanel");
            panel.transform.SetParent(parent, false);
            var rt = panel.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.30f, 0.35f);
            rt.anchorMax = new Vector2(0.70f, 0.65f);
            rt.sizeDelta = Vector2.zero;

            var bg = panel.AddComponent<Image>();
            bg.color = PanelBg;

            _confirmText = MakeTMP(panel.transform, "ConfirmText",
                new Vector2(0.1f, 0.50f), new Vector2(0.9f, 0.85f),
                22, TextLight, TextAlignmentOptions.Center);

            _confirmYesBtn = MakeButton(panel.transform, "YesBtn",
                new Vector2(0.12f, 0.12f), new Vector2(0.47f, 0.40f),
                BtnDanger, GetLoc("confirm_yes"), 22);
            _confirmYesBtn.onClick.AddListener(OnConfirmYes);

            _confirmNoBtn = MakeButton(panel.transform, "NoBtn",
                new Vector2(0.53f, 0.12f), new Vector2(0.88f, 0.40f),
                BtnNormal, GetLoc("confirm_no"), 22);
            _confirmNoBtn.onClick.AddListener(OnConfirmNo);

            return panel;
        }

        #region UI Helpers

        private TextMeshProUGUI MakeTMP(Transform parent, string name,
            Vector2 ancMin, Vector2 ancMax, int size, Color color, TextAlignmentOptions align)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var tmp = go.AddComponent<TextMeshProUGUI>();
            tmp.fontSize = size;
            tmp.color = color;
            tmp.alignment = align;
            tmp.enableWordWrapping = true;
            var rt = tmp.rectTransform;
            rt.anchorMin = ancMin;
            rt.anchorMax = ancMax;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;
            return tmp;
        }

        private Image MakeImage(Transform parent, string name,
            Vector2 ancMin, Vector2 ancMax, Color color)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var img = go.AddComponent<Image>();
            img.color = color;
            img.raycastTarget = false;
            var rt = img.rectTransform;
            rt.anchorMin = ancMin;
            rt.anchorMax = ancMax;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;
            return img;
        }

        private Button MakeButton(Transform parent, string name,
            Vector2 ancMin, Vector2 ancMax, Color bgColor, string label, int fontSize)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var img = go.AddComponent<Image>();
            img.color = bgColor;
            var rt = img.rectTransform;
            rt.anchorMin = ancMin;
            rt.anchorMax = ancMax;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;

            var tmp = MakeTMP(go.transform, "Label", Vector2.zero, Vector2.one,
                fontSize, TextLight, TextAlignmentOptions.Center);
            tmp.text = label;

            var btn = go.AddComponent<Button>();
            btn.targetGraphic = img;
            return btn;
        }

        private void Stretch(RectTransform rt)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;
        }

        private string GetLoc(string key)
        {
            if (ServiceLocator.TryGet<LocalizationManager>(out var lm))
                return lm.Get(key);
            return $"[{key}]";
        }

        private bool IsKorean()
        {
            return ServiceLocator.TryGet<LocalizationManager>(out var lm) && lm.CurrentLanguage == "ko";
        }

        #endregion

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
            if (_isPaused) Time.timeScale = 1f;
        }
    }
}
