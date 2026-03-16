using System;
using System.Collections.Generic;
using Ink.Runtime;
using UnityEngine;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.Narrative
{
    public struct InkTag
    {
        public string Type;
        public string Value;
        public string Modifier;
    }

    public struct DialogueLine
    {
        public string Text;
        public List<InkTag> Tags;
        public bool HasChoices;
        public List<Choice> Choices;
    }

    public class InkService : MonoBehaviour
    {
        public static InkService Instance { get; private set; }

        public event Action<DialogueLine> OnDialogueLine;
        public event Action<List<Choice>> OnChoicesPresented;
        public event Action OnStoryEnd;
        public event Action<InkTag> OnTagProcessed;

        private Story _story;
        private TextAsset _currentInkJson;

        public bool IsStoryActive => _story != null && _story.canContinue;
        public bool HasChoices => _story != null && _story.currentChoices.Count > 0;

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
        }

        public void LoadStory(TextAsset inkJson)
        {
            _currentInkJson = inkJson;
            _story = new Story(inkJson.text);
            SetLanguageVariable();
            SetPlayerNameVariable();
        }

        public void SetLanguageVariable()
        {
            if (_story == null) return;
            var lang = GameManager.Instance != null ? GameManager.Instance.CurrentLanguage : "ko";
            if (_story.variablesState.GlobalVariableExistsWithName("lang"))
            {
                _story.variablesState["lang"] = lang;
            }
        }

        public void SetPlayerNameVariable()
        {
            if (_story == null) return;
            if (!_story.variablesState.GlobalVariableExistsWithName("player_name")) return;

            var custManager = ServiceLocator.TryGet<Player.PlayerCustomizationManager>(out var cm) ? cm : null;
            string name = custManager != null ? custManager.GetPlayerName() : "Christian";
            _story.variablesState["player_name"] = name;
        }

        public void Continue()
        {
            if (_story == null) return;

            if (_story.canContinue)
            {
                string text = _story.Continue().Trim();
                var tags = ParseTags(_story.currentTags);

                var line = new DialogueLine
                {
                    Text = text,
                    Tags = tags,
                    HasChoices = _story.currentChoices.Count > 0,
                    Choices = _story.currentChoices
                };

                foreach (var tag in tags)
                {
                    OnTagProcessed?.Invoke(tag);
                }

                OnDialogueLine?.Invoke(line);

                if (line.HasChoices)
                {
                    OnChoicesPresented?.Invoke(_story.currentChoices);
                }
            }
            else if (_story.currentChoices.Count == 0)
            {
                OnStoryEnd?.Invoke();
            }
        }

        public void ChooseChoice(int choiceIndex)
        {
            if (_story == null || choiceIndex < 0 || choiceIndex >= _story.currentChoices.Count) return;
            _story.ChooseChoiceIndex(choiceIndex);
            Continue();
        }

        public void JumpToKnot(string knotName)
        {
            if (_story == null) return;
            _story.ChoosePathString(knotName);
        }

        public string GetStoryState()
        {
            return _story?.state.ToJson();
        }

        public void LoadStoryState(string stateJson)
        {
            if (_story == null || string.IsNullOrEmpty(stateJson)) return;
            _story.state.LoadJson(stateJson);
        }

        public object GetVariable(string variableName)
        {
            if (_story == null) return null;
            return _story.variablesState[variableName];
        }

        public void SetVariable(string variableName, object value)
        {
            if (_story == null) return;
            _story.variablesState[variableName] = value;
        }

        private List<InkTag> ParseTags(List<string> rawTags)
        {
            return InkTagParser.ParseTags(rawTags);
        }
    }
}
