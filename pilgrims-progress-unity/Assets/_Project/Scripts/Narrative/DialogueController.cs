using System;
using System.Collections.Generic;
using Ink.Runtime;
using UnityEngine;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.Narrative
{
    public class DialogueController : MonoBehaviour
    {
        public event Action<string, string> OnSpeakerChanged;
        public event Action<string> OnEmotionChanged;
        public event Action<string> OnLocationChanged;
        public event Action<string> OnBgmChanged;
        public event Action<string> OnSfxRequested;
        public event Action<string, int> OnStatChanged;
        public event Action<int> OnBurdenChanged;
        public event Action<string> OnBibleCardUnlocked;
        public event Action<string> OnTransitionRequested;
        public event Action<string> OnCGRequested;
        public event Action<string> OnShakeRequested;
        public event Action<float> OnWaitRequested;

        private InkService _inkService;
        private string _currentSpeaker = "";
        private string _currentEmotion = "neutral";

        private void Start()
        {
            _inkService = ServiceLocator.Get<InkService>();
            if (_inkService != null)
            {
                _inkService.OnTagProcessed += HandleTag;
            }
        }

        private void OnDestroy()
        {
            if (_inkService != null)
            {
                _inkService.OnTagProcessed -= HandleTag;
            }
        }

        private void HandleTag(InkTag tag)
        {
            switch (tag.Type)
            {
                case "SPEAKER":
                    _currentSpeaker = tag.Value;
                    OnSpeakerChanged?.Invoke(_currentSpeaker, _currentEmotion);
                    break;
                case "EMOTION":
                    _currentEmotion = tag.Value;
                    OnEmotionChanged?.Invoke(_currentEmotion);
                    break;
                case "LOCATION":
                    OnLocationChanged?.Invoke(tag.Value);
                    break;
                case "BGM":
                    OnBgmChanged?.Invoke(tag.Value);
                    break;
                case "SFX":
                    OnSfxRequested?.Invoke(tag.Value);
                    break;
                case "STAT":
                    if (int.TryParse(tag.Modifier, out int statDelta))
                    {
                        OnStatChanged?.Invoke(tag.Value, statDelta);
                    }
                    break;
                case "BURDEN":
                    if (int.TryParse(tag.Value, out int burdenDelta))
                    {
                        OnBurdenChanged?.Invoke(burdenDelta);
                    }
                    break;
                case "BIBLE_CARD":
                    OnBibleCardUnlocked?.Invoke(tag.Value);
                    break;
                case "TRANSITION":
                    OnTransitionRequested?.Invoke(tag.Value);
                    break;
                case "CG":
                    OnCGRequested?.Invoke(tag.Value);
                    break;
                case "SHAKE":
                    OnShakeRequested?.Invoke(tag.Value);
                    break;
                case "WAIT":
                    if (float.TryParse(tag.Value, System.Globalization.NumberStyles.Float,
                        System.Globalization.CultureInfo.InvariantCulture, out float waitTime))
                    {
                        OnWaitRequested?.Invoke(waitTime);
                    }
                    break;
            }
        }

        public string CurrentSpeaker => _currentSpeaker;
        public string CurrentEmotion => _currentEmotion;
    }
}
