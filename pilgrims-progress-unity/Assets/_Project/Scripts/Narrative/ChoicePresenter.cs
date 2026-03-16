using System;
using System.Collections.Generic;
using Ink.Runtime;
using UnityEngine;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.Narrative
{
    public class ChoicePresenter : MonoBehaviour
    {
        public event Action<int> OnChoiceSelected;

        private InkService _inkService;

        private void Start()
        {
            _inkService = ServiceLocator.Get<InkService>();
        }

        public void SelectChoice(int index)
        {
            OnChoiceSelected?.Invoke(index);
            _inkService?.ChooseChoice(index);
        }

        public List<Choice> GetCurrentChoices()
        {
            if (_inkService == null || !_inkService.HasChoices) return null;
            return null;
        }
    }
}
