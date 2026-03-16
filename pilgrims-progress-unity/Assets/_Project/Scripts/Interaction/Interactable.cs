using UnityEngine;
using PilgrimsProgress.Player;

namespace PilgrimsProgress.Interaction
{
    public abstract class Interactable : MonoBehaviour
    {
        [Header("Interaction")]
        [SerializeField] private GameObject _promptIcon;
        [SerializeField] private bool _singleUse;

        private bool _used;

        public bool CanInteract => !_singleUse || !_used;

        public void ShowPrompt(bool show)
        {
            if (_promptIcon != null)
                _promptIcon.SetActive(show);
        }

        public void Interact(PlayerController player)
        {
            if (!CanInteract) return;

            OnInteract(player);

            if (_singleUse)
                _used = true;
        }

        protected abstract void OnInteract(PlayerController player);

        public void ResetUsage()
        {
            _used = false;
        }
    }
}
