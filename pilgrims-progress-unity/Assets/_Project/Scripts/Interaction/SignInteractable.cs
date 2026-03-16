using UnityEngine;
using PilgrimsProgress.Core;
using PilgrimsProgress.Player;
using PilgrimsProgress.Narrative;

namespace PilgrimsProgress.Interaction
{
    public class SignInteractable : Interactable
    {
        [Header("Sign")]
        [SerializeField] private string _inkKnotName;

        protected override void OnInteract(PlayerController player)
        {
            var ink = ServiceLocator.Get<InkService>();
            var modeManager = ServiceLocator.Get<GameModeManager>();
            if (ink == null || modeManager == null) return;

            if (!string.IsNullOrEmpty(_inkKnotName))
                ink.JumpToKnot(_inkKnotName);

            modeManager.EnterDialogueMode(transform);
            ink.Continue();
        }
    }
}
