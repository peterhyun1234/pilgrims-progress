using UnityEngine;
using PP.Narrative;

namespace PP.Interaction
{
    public class NPCInteractable : MonoBehaviour, IInteractable
    {
        [SerializeField] private string _npcId;
        [SerializeField] private string _inkKnot;
        [SerializeField] private string _completedKnot;
        [SerializeField] private string _promptKey = "Talk";

        public string PromptText => _promptKey;
        public bool CanInteract => true;
        public Transform Transform => transform;

        public void Interact(PP.Player.PlayerController player)
        {
            var quest = QuestSystem.Instance;
            string knot = quest != null
                ? quest.ResolveKnot(_inkKnot, _completedKnot)
                : _inkKnot;

            if (string.IsNullOrEmpty(knot)) return;
            DialogueManager.Instance?.StartDialogue(knot);
        }
    }
}
