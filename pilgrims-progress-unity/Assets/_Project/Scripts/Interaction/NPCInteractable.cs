using UnityEngine;
using PilgrimsProgress.Core;
using PilgrimsProgress.Player;
using PilgrimsProgress.Narrative;

namespace PilgrimsProgress.Interaction
{
    public class NPCInteractable : Interactable
    {
        [Header("NPC")]
        [SerializeField] private string _npcId;
        [SerializeField] private string _inkKnotName;
        [SerializeField] private string _displayNameKey;

        [Header("Visuals")]
        [SerializeField] private SpriteRenderer _spriteRenderer;

        public string NpcId => _npcId;
        public string InkKnotName => _inkKnotName;

        protected override void OnInteract(PlayerController player)
        {
            var inkService = ServiceLocator.Get<InkService>();
            if (inkService == null) return;

            var modeManager = ServiceLocator.Get<GameModeManager>();
            if (modeManager == null) return;

            if (!string.IsNullOrEmpty(_inkKnotName))
            {
                inkService.JumpToKnot(_inkKnotName);
            }

            modeManager.EnterDialogueMode(transform);
            inkService.Continue();
        }

        public void FacePlayer(Vector2 playerPos)
        {
            if (_spriteRenderer == null) return;
            _spriteRenderer.flipX = playerPos.x < transform.position.x;
        }
    }
}
