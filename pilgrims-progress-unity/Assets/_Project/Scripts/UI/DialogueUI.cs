using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.InputSystem;
using TMPro;
using PilgrimsProgress.Core;
using PilgrimsProgress.Narrative;

namespace PilgrimsProgress.UI
{
    public class DialogueUI : MonoBehaviour
    {
        [Header("Dialogue Panel")]
        [SerializeField] private GameObject _dialoguePanel;
        [SerializeField] private TextMeshProUGUI _speakerNameText;
        [SerializeField] private TextMeshProUGUI _dialogueText;
        [SerializeField] private GameObject _speakerPlate;
        [SerializeField] private Image _dialogueBoxImage;

        [Header("Continue")]
        [SerializeField] private Button _continueButton;
        [SerializeField] private GameObject _continueIndicator;

        [Header("Choices")]
        [SerializeField] private GameObject _choiceContainer;
        [SerializeField] private Button[] _choiceButtons;
        [SerializeField] private TextMeshProUGUI[] _choiceTexts;

        [Header("Location")]
        [SerializeField] private TextMeshProUGUI _locationText;

        [Header("Typewriter Settings")]
        [SerializeField] private float _typeSpeed = 0.03f;
        [SerializeField] private float _fastTypeSpeed = 0.005f;

        private InkService _inkService;
        private bool _isTyping;
        private bool _skipRequested;
        private Coroutine _typewriterCoroutine;
        private string _currentFullText;
        private GameModeManager _modeManager;

        private Button _skipAllButton;
        private Button _closeButton;
        private TextMeshProUGUI _tapHintText;
        private bool _dialogueActive;

        private void Start()
        {
            _inkService = ServiceLocator.Get<InkService>();
            _modeManager = ServiceLocator.Get<GameModeManager>();

            if (_inkService != null)
            {
                _inkService.OnDialogueLine += HandleDialogueLine;
                _inkService.OnChoicesPresented += HandleChoices;
                _inkService.OnStoryEnd += HandleStoryEnd;
            }

            if (_modeManager != null)
            {
                _modeManager.OnModeChanged += HandleModeChanged;
            }

            if (_continueButton != null)
            {
                _continueButton.onClick.AddListener(OnContinueClicked);
            }

            BuildExtraControls();
            HideDialogue();
        }

        private void BuildExtraControls()
        {
            if (_dialoguePanel == null) return;

            var lm = ServiceLocator.TryGet<Localization.LocalizationManager>(out var l) ? l : null;
            bool isKo = lm != null && lm.CurrentLanguage == "ko";

            var skipGo = new GameObject("SkipAllButton");
            skipGo.transform.SetParent(_dialoguePanel.transform, false);
            var skipImg = skipGo.AddComponent<Image>();
            skipImg.color = new Color(0.15f, 0.12f, 0.20f, 0.85f);
            var skipRt = skipImg.rectTransform;
            skipRt.anchorMin = new Vector2(0.80f, 0.84f);
            skipRt.anchorMax = new Vector2(0.98f, 1.04f);
            skipRt.sizeDelta = Vector2.zero;
            skipRt.anchoredPosition = Vector2.zero;
            _skipAllButton = skipGo.AddComponent<Button>();

            var skipLabel = new GameObject("Label");
            skipLabel.transform.SetParent(skipGo.transform, false);
            var skipTmp = skipLabel.AddComponent<TextMeshProUGUI>();
            skipTmp.text = isKo ? "대화 종료" : "End";
            skipTmp.fontSize = 14;
            skipTmp.color = new Color(0.9f, 0.5f, 0.4f);
            skipTmp.alignment = TextAlignmentOptions.Center;
            var skipLabelRt = skipTmp.rectTransform;
            skipLabelRt.anchorMin = Vector2.zero;
            skipLabelRt.anchorMax = Vector2.one;
            skipLabelRt.sizeDelta = Vector2.zero;

            _skipAllButton.onClick.AddListener(OnSkipAllClicked);

            var hintGo = new GameObject("TapHint");
            hintGo.transform.SetParent(_dialoguePanel.transform, false);
            _tapHintText = hintGo.AddComponent<TextMeshProUGUI>();
            _tapHintText.text = isKo ? "탭하여 계속 | ESC로 종료" : "Tap to continue | ESC to end";
            _tapHintText.fontSize = 12;
            _tapHintText.color = new Color(1f, 1f, 1f, 0.4f);
            _tapHintText.alignment = TextAlignmentOptions.BottomLeft;
            var hintRt = _tapHintText.rectTransform;
            hintRt.anchorMin = new Vector2(0.04f, 0.02f);
            hintRt.anchorMax = new Vector2(0.50f, 0.12f);
            hintRt.sizeDelta = Vector2.zero;
            hintRt.anchoredPosition = Vector2.zero;
        }

        private void Update()
        {
            if (!_dialogueActive) return;

            var kb = Keyboard.current;
            if (kb == null) return;

            if (kb.escapeKey.wasPressedThisFrame)
            {
                OnSkipAllClicked();
                return;
            }

            if (kb.spaceKey.wasPressedThisFrame || kb.enterKey.wasPressedThisFrame)
            {
                OnContinueClicked();
            }
        }

        private void OnDestroy()
        {
            if (_inkService != null)
            {
                _inkService.OnDialogueLine -= HandleDialogueLine;
                _inkService.OnChoicesPresented -= HandleChoices;
                _inkService.OnStoryEnd -= HandleStoryEnd;
            }

            if (_modeManager != null)
            {
                _modeManager.OnModeChanged -= HandleModeChanged;
            }
        }

        private void HandleModeChanged(GameMode previous, GameMode current)
        {
            if (current == GameMode.Dialogue)
            {
                _dialogueActive = true;
            }
            else if (previous == GameMode.Dialogue)
            {
                _dialogueActive = false;
                HideDialogue();
            }
        }

        private void HideDialogue()
        {
            if (_dialoguePanel != null) _dialoguePanel.SetActive(false);
            HideChoices();
            if (_continueIndicator != null) _continueIndicator.SetActive(false);
            _dialogueActive = false;
        }

        private void HandleDialogueLine(DialogueLine line)
        {
            if (_dialoguePanel != null) _dialoguePanel.SetActive(true);
            _dialogueActive = true;

            string speaker = "";
            string emotion = "";
            foreach (var tag in line.Tags)
            {
                if (tag.Type == "SPEAKER")
                    speaker = tag.Value;
                else if (tag.Type == "EMOTION")
                    emotion = tag.Value;
                else if (tag.Type == "LOCATION" && _locationText != null)
                    _locationText.text = tag.Value;
            }

            bool isNarration = string.IsNullOrEmpty(speaker);
            if (_speakerPlate != null)
            {
                _speakerPlate.SetActive(!isNarration);
                var plateImg = _speakerPlate.GetComponent<Image>();
                if (plateImg != null && !isNarration)
                {
                    Color plateColor = GetSpeakerPlateColor(speaker);
                    plateImg.color = plateColor;
                }
            }
            if (_speakerNameText != null)
            {
                if (!isNarration)
                {
                    _speakerNameText.text = GetLocalizedSpeakerName(speaker);
                    _speakerNameText.color = GetSpeakerNameColor(speaker);
                }
            }

            // Dialogue text color based on speaker type
            if (_dialogueText != null)
            {
                if (isNarration)
                    _dialogueText.color = new Color(0.85f, 0.82f, 0.75f);
                else
                    _dialogueText.color = Color.white;

                if (!string.IsNullOrEmpty(emotion))
                    _dialogueText.fontStyle = GetEmotionFontStyle(emotion);
                else
                    _dialogueText.fontStyle = FontStyles.Normal;
            }

            // Panel color shift for dangerous characters
            if (_dialogueBoxImage != null)
            {
                _dialogueBoxImage.color = GetDialoguePanelTint(speaker);
            }

            if (!line.HasChoices) HideChoices();
            if (_skipAllButton != null) _skipAllButton.gameObject.SetActive(true);
            if (_tapHintText != null) _tapHintText.gameObject.SetActive(true);

            StartTypewriter(line.Text);
        }

        private static Color GetSpeakerPlateColor(string speaker)
        {
            switch (speaker)
            {
                case "Apollyon":
                case "Giant Despair":
                    return new Color(0.25f, 0.08f, 0.08f, 0.95f);
                case "Evangelist":
                case "Interpreter":
                case "Good-will":
                    return new Color(0.10f, 0.10f, 0.20f, 0.95f);
                case "Shining One":
                case "Shining One 1":
                case "Shining One 2":
                case "Shining One 3":
                    return new Color(0.18f, 0.16f, 0.08f, 0.95f);
                case "Faithful":
                case "Hopeful":
                    return new Color(0.08f, 0.12f, 0.18f, 0.95f);
                case "Obstinate":
                case "Worldly Wiseman":
                case "By-ends":
                case "Ignorance":
                    return new Color(0.18f, 0.12f, 0.08f, 0.95f);
                default:
                    return new Color(0.12f, 0.10f, 0.18f, 0.95f);
            }
        }

        private static Color GetSpeakerNameColor(string speaker)
        {
            switch (speaker)
            {
                case "Apollyon":
                    return new Color(0.90f, 0.30f, 0.25f);
                case "Giant Despair":
                    return new Color(0.70f, 0.50f, 0.40f);
                case "Evangelist":
                    return new Color(0.90f, 0.82f, 0.50f);
                case "Shining One":
                case "Shining One 1":
                case "Shining One 2":
                case "Shining One 3":
                    return new Color(1f, 0.95f, 0.70f);
                case "Faithful":
                    return new Color(0.85f, 0.70f, 0.40f);
                case "Hopeful":
                    return new Color(0.50f, 0.75f, 0.90f);
                case "Obstinate":
                    return new Color(0.80f, 0.45f, 0.35f);
                case "Worldly Wiseman":
                    return new Color(0.70f, 0.60f, 0.80f);
                case "Christian":
                    return new Color(0.90f, 0.85f, 0.70f);
                default:
                    return new Color(0.90f, 0.78f, 0.45f);
            }
        }

        private static Color GetDialoguePanelTint(string speaker)
        {
            switch (speaker)
            {
                case "Apollyon":
                    return new Color(1f, 0.90f, 0.88f);
                case "Giant Despair":
                    return new Color(0.92f, 0.90f, 0.88f);
                case "Shining One":
                case "Shining One 1":
                case "Shining One 2":
                case "Shining One 3":
                    return new Color(1f, 0.98f, 0.92f);
                default:
                    return Color.white;
            }
        }

        private static FontStyles GetEmotionFontStyle(string emotion)
        {
            switch (emotion?.ToLower())
            {
                case "angry":
                case "threatening":
                case "rage":
                    return FontStyles.Bold;
                case "scared":
                case "distressed":
                    return FontStyles.Italic;
                case "prayerful":
                case "blessed":
                    return FontStyles.Italic;
                default:
                    return FontStyles.Normal;
            }
        }

        private void HandleChoices(List<Ink.Runtime.Choice> choices)
        {
            if (_choiceContainer == null || _choiceButtons == null) return;

            _choiceContainer.SetActive(true);
            if (_continueButton != null) _continueButton.gameObject.SetActive(false);
            if (_tapHintText != null) _tapHintText.gameObject.SetActive(false);

            for (int i = 0; i < _choiceButtons.Length; i++)
            {
                if (i < choices.Count)
                {
                    _choiceButtons[i].gameObject.SetActive(true);
                    if (_choiceTexts != null && i < _choiceTexts.Length)
                    {
                        _choiceTexts[i].text = choices[i].text;
                    }

                    int choiceIndex = i;
                    _choiceButtons[i].onClick.RemoveAllListeners();
                    _choiceButtons[i].onClick.AddListener(() => OnChoiceSelected(choiceIndex));
                }
                else
                {
                    _choiceButtons[i].gameObject.SetActive(false);
                }
            }
        }

        private void HandleStoryEnd()
        {
            if (_continueButton != null) _continueButton.gameObject.SetActive(false);
            HideChoices();
            HideDialogue();
        }

        private void OnContinueClicked()
        {
            if (_isTyping)
            {
                _skipRequested = true;
                return;
            }

            _inkService?.Continue();
        }

        private void OnSkipAllClicked()
        {
            if (_typewriterCoroutine != null)
                StopCoroutine(_typewriterCoroutine);
            _isTyping = false;

            _modeManager?.ExitDialogueMode();
            HideDialogue();
        }

        private void OnChoiceSelected(int index)
        {
            HideChoices();
            _inkService?.ChooseChoice(index);
        }

        private void HideChoices()
        {
            if (_choiceContainer != null) _choiceContainer.SetActive(false);
        }

        private void StartTypewriter(string text)
        {
            if (_typewriterCoroutine != null)
            {
                StopCoroutine(_typewriterCoroutine);
            }
            _currentFullText = text;
            _typewriterCoroutine = StartCoroutine(TypewriterEffect(text));
        }

        private IEnumerator TypewriterEffect(string text)
        {
            _isTyping = true;
            _skipRequested = false;
            if (_continueIndicator != null) _continueIndicator.SetActive(false);
            if (_continueButton != null) _continueButton.gameObject.SetActive(true);

            if (_dialogueText == null) { _isTyping = false; yield break; }
            _dialogueText.text = "";

            for (int i = 0; i < text.Length; i++)
            {
                if (_skipRequested)
                {
                    _dialogueText.text = text;
                    break;
                }

                _dialogueText.text = text.Substring(0, i + 1);

                bool isRichTag = text[i] == '<';
                if (isRichTag)
                {
                    int closeIndex = text.IndexOf('>', i);
                    if (closeIndex > i)
                    {
                        i = closeIndex;
                        continue;
                    }
                }

                float speed = _skipRequested ? _fastTypeSpeed : GetCharDelay(text[i]);
                yield return new WaitForSecondsRealtime(speed);
            }

            _isTyping = false;
            if (_continueIndicator != null) _continueIndicator.SetActive(true);
        }

        private float GetCharDelay(char c)
        {
            switch (c)
            {
                case '.':
                case '\u3002': // Korean period
                    return _typeSpeed * 6f;
                case '!':
                case '?':
                    return _typeSpeed * 5f;
                case ',':
                case '\uFF0C': // fullwidth comma
                    return _typeSpeed * 3f;
                case ':':
                case ';':
                    return _typeSpeed * 3f;
                case '\u2026': // ellipsis
                    return _typeSpeed * 4f;
                default:
                    return _typeSpeed;
            }
        }

        public static string GetLocalizedName(string speakerId, string lang)
        {
            switch (speakerId)
            {
                case "Christian":
                    return lang == "ko" ? "크리스천" : "Christian";
                case "Evangelist":
                    return lang == "ko" ? "전도자" : "Evangelist";
                case "Obstinate":
                    return lang == "ko" ? "완고" : "Obstinate";
                case "Pliable":
                    return lang == "ko" ? "유연" : "Pliable";
                case "Help":
                    return lang == "ko" ? "도움" : "Help";
                case "Worldly Wiseman":
                    return lang == "ko" ? "세상지혜씨" : "Mr. Worldly Wiseman";
                case "Good-will":
                    return lang == "ko" ? "선의" : "Good-will";
                case "Interpreter":
                    return lang == "ko" ? "해석자" : "Interpreter";
                case "Prudence":
                    return lang == "ko" ? "신중" : "Prudence";
                case "Piety":
                    return lang == "ko" ? "경건" : "Piety";
                case "Charity":
                    return lang == "ko" ? "사랑" : "Charity";
                case "Apollyon":
                    return lang == "ko" ? "아폴리온" : "Apollyon";
                case "Faithful":
                    return lang == "ko" ? "신실" : "Faithful";
                case "Hopeful":
                    return lang == "ko" ? "소망" : "Hopeful";
                case "Giant Despair":
                    return lang == "ko" ? "절망 거인" : "Giant Despair";
                case "Shepherd":
                case "Shepherd 1":
                case "Shepherd 2":
                    return lang == "ko" ? "목자" : "Shepherd";
                case "Ignorance":
                    return lang == "ko" ? "무지" : "Ignorance";
                case "By-ends":
                    return lang == "ko" ? "사리사욕" : "By-ends";
                case "Shining One":
                case "Shining One 1":
                case "Shining One 2":
                case "Shining One 3":
                    return lang == "ko" ? "빛나는 자" : "Shining One";
                default:
                    return speakerId;
            }
        }

        private string GetLocalizedSpeakerName(string speakerId)
        {
            if (speakerId == "Christian")
            {
                var custManager = ServiceLocator.TryGet<Player.PlayerCustomizationManager>(out var cm) ? cm : null;
                if (custManager != null)
                {
                    string playerName = custManager.GetPlayerName();
                    if (!string.IsNullOrEmpty(playerName)) return playerName;
                }
            }

            var loc = ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) ? lm : null;
            string lang = loc != null ? loc.CurrentLanguage : "en";
            return GetLocalizedName(speakerId, lang);
        }
    }
}
