using UnityEngine;

namespace PP.Interaction
{
    public interface IInteractable
    {
        string PromptText { get; }
        bool CanInteract { get; }
        void Interact(PP.Player.PlayerController player);
        Transform Transform { get; }
    }
}
