using System;
using System.Collections.Generic;
using Ink.Runtime;
using UnityEngine;
using PP.Core;

namespace PP.Narrative
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

        public event Action<DialogueLine> OnLine;
        public event Action<List<Choice>> OnChoices;
        public event Action OnEnd;
        public event Action<InkTag> OnTag;

        private Story _story;

        public bool CanContinue => _story != null && _story.canContinue;
        public bool HasChoices => _story != null && _story.currentChoices.Count > 0;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            ServiceLocator.Register(this);
        }

        public void LoadStory(TextAsset inkJson)
        {
            _story = new Story(inkJson.text);
            SyncVariables();
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

                foreach (var tag in tags) OnTag?.Invoke(tag);
                OnLine?.Invoke(line);
                if (line.HasChoices) OnChoices?.Invoke(_story.currentChoices);
            }
            else if (_story.currentChoices.Count == 0)
            {
                OnEnd?.Invoke();
            }
        }

        public void ChooseChoice(int index)
        {
            if (_story == null || index < 0 || index >= _story.currentChoices.Count) return;
            _story.ChooseChoiceIndex(index);
            Continue();
        }

        public void JumpToKnot(string knot)
        {
            _story?.ChoosePathString(knot);
        }

        public string GetState() => _story?.state.ToJson();

        public void LoadState(string json)
        {
            if (_story == null || string.IsNullOrEmpty(json)) return;
            _story.state.LoadJson(json);
        }

        public object GetVariable(string name) => _story?.variablesState[name];
        public void SetVariable(string name, object value)
        {
            if (_story != null) _story.variablesState[name] = value;
        }

        private void SyncVariables()
        {
            if (_story == null) return;
            var gm = GameManager.Instance;
            if (gm == null) return;

            TrySetVar("lang", gm.CurrentLanguage);
            TrySetVar("player_name", gm.PlayerName);
        }

        private void TrySetVar(string name, object value)
        {
            if (_story.variablesState.GlobalVariableExistsWithName(name))
                _story.variablesState[name] = value;
        }

        private static List<InkTag> ParseTags(List<string> raw)
        {
            var result = new List<InkTag>();
            if (raw == null) return result;

            foreach (var r in raw)
            {
                var parts = r.Split(':');
                var tag = new InkTag
                {
                    Type = parts[0].Trim().ToUpper(),
                    Value = parts.Length > 1 ? parts[1].Trim() : "",
                    Modifier = parts.Length > 2 ? parts[2].Trim() : ""
                };
                result.Add(tag);
            }
            return result;
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }
    }
}
