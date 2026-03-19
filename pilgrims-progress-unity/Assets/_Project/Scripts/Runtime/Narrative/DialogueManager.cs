using System;
using UnityEngine;
using PP.Core;

namespace PP.Narrative
{
    public class DialogueManager : MonoBehaviour
    {
        public static DialogueManager Instance { get; private set; }

        public event Action<string, string, string> OnSpeakerLine;
        public event Action<string> OnEmotionChanged;
        public event Action<string> OnLocationChanged;

        private InkService _ink;
        private string _currentSpeaker = "";
        private string _currentEmotion = "neutral";
        private string _activeKnot;
        private bool _active;

        public bool IsActive => _active;
        public string CurrentSpeaker => _currentSpeaker;
        public string CurrentEmotion => _currentEmotion;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            ServiceLocator.Register(this);
        }

        private void Start()
        {
            _ink = InkService.Instance;
            if (_ink != null)
            {
                _ink.OnTag += HandleTag;
                _ink.OnEnd += EndDialogue;
            }
        }

        public void StartDialogue(string knotName)
        {
            if (_ink == null || _active) return;

            _activeKnot = knotName;
            _active = true;
            _ink.JumpToKnot(knotName);

            GameManager.Instance?.EnterDialogue();
            EventBus.Publish(new DialogueStartedEvent { KnotName = knotName, SpeakerId = _currentSpeaker });

            _ink.Continue();
        }

        public void ContinueDialogue()
        {
            if (!_active || _ink == null) return;
            _ink.Continue();
        }

        public void SelectChoice(int index)
        {
            if (!_active || _ink == null) return;
            _ink.ChooseChoice(index);
        }

        public void EndDialogue()
        {
            if (!_active) return;
            _active = false;

            if (!string.IsNullOrEmpty(_activeKnot))
            {
                var quest = QuestSystem.Instance;
                quest?.MarkKnotCompleted(_activeKnot);
            }

            GameManager.Instance?.ExitDialogue();
            EventBus.Publish(new DialogueEndedEvent());
            _activeKnot = null;
        }

        private void HandleTag(InkTag tag)
        {
            switch (tag.Type)
            {
                case "SPEAKER":
                    _currentSpeaker = tag.Value;
                    break;
                case "EMOTION":
                    _currentEmotion = tag.Value;
                    OnEmotionChanged?.Invoke(_currentEmotion);
                    break;
                case "LOCATION":
                    OnLocationChanged?.Invoke(tag.Value);
                    break;
            }
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
            if (_ink != null)
            {
                _ink.OnTag -= HandleTag;
                _ink.OnEnd -= EndDialogue;
            }
        }
    }
}
