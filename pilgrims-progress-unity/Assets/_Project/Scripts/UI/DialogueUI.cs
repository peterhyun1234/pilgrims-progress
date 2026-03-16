using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
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

            HideDialogue();
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
            if (current != GameMode.Dialogue && previous == GameMode.Dialogue)
            {
                HideDialogue();
            }
        }

        private void HideDialogue()
        {
            if (_dialoguePanel != null) _dialoguePanel.SetActive(false);
            HideChoices();
            if (_continueIndicator != null) _continueIndicator.SetActive(false);
        }

        private void HandleDialogueLine(DialogueLine line)
        {
            if (_dialoguePanel != null) _dialoguePanel.SetActive(true);

            string speaker = "";
            foreach (var tag in line.Tags)
            {
                if (tag.Type == "SPEAKER")
                {
                    speaker = tag.Value;
                }
                else if (tag.Type == "LOCATION" && _locationText != null)
                {
                    _locationText.text = tag.Value;
                }
            }

            bool isNarration = string.IsNullOrEmpty(speaker);
            if (_speakerPlate != null)
            {
                _speakerPlate.SetActive(!isNarration);
            }
            if (_speakerNameText != null && !isNarration)
            {
                _speakerNameText.text = GetLocalizedSpeakerName(speaker);
            }

            if (!line.HasChoices)
            {
                HideChoices();
            }

            StartTypewriter(line.Text);
        }

        private void HandleChoices(List<Ink.Runtime.Choice> choices)
        {
            if (_choiceContainer == null || _choiceButtons == null) return;

            _choiceContainer.SetActive(true);
            if (_continueButton != null) _continueButton.gameObject.SetActive(false);

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

                float speed = _skipRequested ? _fastTypeSpeed : _typeSpeed;
                yield return new WaitForSecondsRealtime(speed);
            }

            _isTyping = false;
            if (_continueIndicator != null) _continueIndicator.SetActive(true);
        }

        private string GetLocalizedSpeakerName(string speakerId)
        {
            var loc = ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) ? lm : null;
            if (loc == null) return speakerId;

            string lang = loc.CurrentLanguage;

            switch (speakerId)
            {
                case "Christian":
                    var custManager = ServiceLocator.TryGet<Player.PlayerCustomizationManager>(out var cm) ? cm : null;
                    return custManager != null ? custManager.GetPlayerName() : (lang == "ko" ? "크리스천" : "Christian");
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
                    return lang == "ko" ? "목자" : "Shepherd";
                case "Ignorance":
                    return lang == "ko" ? "무지" : "Ignorance";
                case "By-ends":
                    return lang == "ko" ? "사리사욕" : "By-ends";
                case "Shining One":
                    return lang == "ko" ? "빛나는 자" : "Shining One";
                default:
                    return speakerId;
            }
        }
    }
}
