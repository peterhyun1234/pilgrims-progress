using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PP.Core;
using PP.Narrative;

namespace PP.UI
{
    public class DialogueView : MonoBehaviour
    {
        [Header("Panel")]
        [SerializeField] private GameObject _panel;
        [SerializeField] private TextMeshProUGUI _speakerText;
        [SerializeField] private TextMeshProUGUI _bodyText;
        [SerializeField] private Image _panelImage;
        [SerializeField] private GameObject _speakerPlate;

        [Header("Continue")]
        [SerializeField] private Button _continueButton;
        [SerializeField] private GameObject _continueIndicator;

        [Header("Choices")]
        [SerializeField] private GameObject _choiceContainer;
        [SerializeField] private Button[] _choiceButtons;
        [SerializeField] private TextMeshProUGUI[] _choiceTexts;

        [Header("Portrait")]
        [SerializeField] private Image _portraitImage;
        [SerializeField] private GameObject _portraitContainer;

        [Header("Typewriter")]
        [SerializeField] private float _baseCharDelay = 0.03f;
        [SerializeField] private float _beatPause = 0.4f;

        [Header("Data")]
        [SerializeField] private CharacterDatabase _characterDb;

        private InkService _ink;
        private DialogueManager _dialogue;
        private bool _typing;
        private bool _skipRequested;
        private Coroutine _typewriterRoutine;
        private string _currentEmotion = "neutral";

        private void Start()
        {
            _ink = InkService.Instance;
            _dialogue = DialogueManager.Instance;

            if (_ink != null)
            {
                _ink.OnLine += OnLine;
                _ink.OnChoices += OnChoices;
                _ink.OnEnd += OnEnd;
            }

            if (_continueButton != null)
                _continueButton.onClick.AddListener(OnContinuePressed);

            var input = PP.Input.InputManager.Instance;
            if (input != null)
            {
                input.OnDialogueContinue += OnContinuePressed;
                input.OnDialogueSkip += OnSkipAll;
                input.OnChoiceSelected += OnChoiceSelected;
            }

            if (_characterDb == null)
                _characterDb = Resources.Load<CharacterDatabase>("CharacterDatabase");

            Hide();
        }

        private void OnLine(DialogueLine line)
        {
            if (_panel != null) _panel.SetActive(true);

            string speaker = "";
            string emotion = "neutral";
            foreach (var tag in line.Tags)
            {
                if (tag.Type == "SPEAKER") speaker = tag.Value;
                else if (tag.Type == "EMOTION") emotion = tag.Value;
            }

            _currentEmotion = emotion;
            bool isNarration = string.IsNullOrEmpty(speaker);

            CharacterDataSO charData = null;
            if (_characterDb != null && !isNarration)
                _characterDb.TryGet(speaker, out charData);

            UpdateSpeaker(speaker, isNarration, charData);
            UpdatePortrait(speaker, emotion, charData);
            UpdatePanelColor(speaker, charData);
            SetFontStyle(emotion);

            if (!line.HasChoices) HideChoices();
            StartTypewriter(line.Text);
        }

        private void UpdateSpeaker(string speaker, bool isNarration, CharacterDataSO data)
        {
            if (_speakerPlate != null) _speakerPlate.SetActive(!isNarration);
            if (_speakerText == null || isNarration) return;

            string lang = GameManager.Instance?.CurrentLanguage ?? "ko";
            _speakerText.text = data != null ? data.GetLocalizedName(lang) : speaker;
            _speakerText.color = data != null ? data.NameColor : new Color(0.9f, 0.78f, 0.45f);

            if (_speakerPlate != null)
            {
                var plateImg = _speakerPlate.GetComponent<Image>();
                if (plateImg != null)
                    plateImg.color = data != null ? data.PlateColor : new Color(0.12f, 0.10f, 0.18f, 0.95f);
            }
        }

        private void UpdatePortrait(string speaker, string emotion, CharacterDataSO data)
        {
            if (_portraitContainer == null || _portraitImage == null) return;

            bool show = !string.IsNullOrEmpty(speaker) && data != null;
            _portraitContainer.SetActive(show);
            if (!show) return;

            var sprite = data.GetExpression(emotion);
            if (sprite != null) _portraitImage.sprite = sprite;
            _portraitImage.color = GetEmotionTint(emotion);
        }

        private void UpdatePanelColor(string speaker, CharacterDataSO data)
        {
            if (_panelImage == null) return;
            _panelImage.color = data != null ? data.PanelTint : Color.white;
        }

        private void SetFontStyle(string emotion)
        {
            if (_bodyText == null) return;
            _bodyText.fontStyle = emotion?.ToLower() switch
            {
                "angry" or "threatening" or "rage" => FontStyles.Bold,
                "scared" or "distressed" or "prayerful" => FontStyles.Italic,
                _ => FontStyles.Normal
            };
        }

        #region Typewriter

        private void StartTypewriter(string text)
        {
            if (_typewriterRoutine != null) StopCoroutine(_typewriterRoutine);
            _typewriterRoutine = StartCoroutine(TypewriterRoutine(text));
        }

        private IEnumerator TypewriterRoutine(string raw)
        {
            _typing = true;
            _skipRequested = false;
            if (_continueIndicator != null) _continueIndicator.SetActive(false);
            if (_continueButton != null) _continueButton.gameObject.SetActive(true);

            string display = raw.Replace("{beat}", "");
            _bodyText.text = display;
            _bodyText.maxVisibleCharacters = 0;

            int visible = 0;
            int idx = 0;
            float emotionMult = GetEmotionSpeedMult(_currentEmotion);

            while (idx < raw.Length)
            {
                if (_skipRequested)
                {
                    _bodyText.maxVisibleCharacters = display.Length;
                    break;
                }

                if (idx + 6 <= raw.Length && raw.Substring(idx, 6) == "{beat}")
                {
                    idx += 6;
                    if (!_skipRequested) yield return new WaitForSecondsRealtime(_beatPause);
                    continue;
                }

                char c = raw[idx++];

                if (c == '<')
                {
                    int close = raw.IndexOf('>', idx);
                    if (close >= 0) { idx = close + 1; continue; }
                }

                visible++;
                _bodyText.maxVisibleCharacters = visible;

                float delay = GetCharDelay(c) * emotionMult;
                yield return new WaitForSecondsRealtime(delay);
            }

            _bodyText.maxVisibleCharacters = display.Length;
            _typing = false;
            if (_continueIndicator != null) _continueIndicator.SetActive(true);
        }

        private float GetCharDelay(char c) => c switch
        {
            '.' or '\u3002' => _baseCharDelay * 6f,
            '!' or '?' => _baseCharDelay * 5f,
            ',' or '\uFF0C' => _baseCharDelay * 3f,
            ':' or ';' => _baseCharDelay * 3f,
            '\u2026' => _baseCharDelay * 8f,
            '-' => _baseCharDelay * 2f,
            _ => _baseCharDelay
        };

        private static float GetEmotionSpeedMult(string emotion) => emotion?.ToLower() switch
        {
            "angry" or "rage" => 0.6f,
            "shouting" => 0.4f,
            "sad" or "sorrowful" => 1.8f,
            "scared" or "fearful" => 1.2f,
            "whispering" or "prayerful" => 2.0f,
            "joyful" or "happy" => 0.8f,
            _ => 1.0f
        };

        #endregion

        #region Input Handling

        private void OnContinuePressed()
        {
            if (_typing) { _skipRequested = true; return; }
            _dialogue?.ContinueDialogue();
        }

        private void OnSkipAll()
        {
            if (_typewriterRoutine != null) StopCoroutine(_typewriterRoutine);
            _typing = false;
            _dialogue?.EndDialogue();
            Hide();
        }

        private void OnChoiceSelected(int index)
        {
            HideChoices();
            _dialogue?.SelectChoice(index);
        }

        #endregion

        private void OnChoices(List<Ink.Runtime.Choice> choices)
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
                        _choiceTexts[i].text = choices[i].text;

                    int ci = i;
                    _choiceButtons[i].onClick.RemoveAllListeners();
                    _choiceButtons[i].onClick.AddListener(() => OnChoiceSelected(ci));
                }
                else
                {
                    _choiceButtons[i].gameObject.SetActive(false);
                }
            }
        }

        private void OnEnd()
        {
            Hide();
        }

        private void Hide()
        {
            if (_panel != null) _panel.SetActive(false);
            HideChoices();
            if (_continueIndicator != null) _continueIndicator.SetActive(false);
        }

        private void HideChoices()
        {
            if (_choiceContainer != null) _choiceContainer.SetActive(false);
        }

        private static Color GetEmotionTint(string emotion) => emotion?.ToLower() switch
        {
            "angry" or "rage" => new Color(1.1f, 0.85f, 0.85f),
            "sad" or "sorrowful" => new Color(0.85f, 0.85f, 1.0f),
            "joyful" or "happy" => new Color(1.0f, 1.0f, 0.9f),
            "scared" or "fearful" => new Color(0.9f, 0.88f, 1.0f),
            _ => Color.white
        };

        private void OnDestroy()
        {
            if (_ink != null)
            {
                _ink.OnLine -= OnLine;
                _ink.OnChoices -= OnChoices;
                _ink.OnEnd -= OnEnd;
            }

            var input = PP.Input.InputManager.Instance;
            if (input != null)
            {
                input.OnDialogueContinue -= OnContinuePressed;
                input.OnDialogueSkip -= OnSkipAll;
                input.OnChoiceSelected -= OnChoiceSelected;
            }
        }
    }
}
