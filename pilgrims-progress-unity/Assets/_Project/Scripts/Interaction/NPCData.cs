using UnityEngine;

namespace PilgrimsProgress.Interaction
{
    /// <summary>
    /// ScriptableObject defining NPC data for a location.
    /// Used to configure NPCInteractable components in the editor.
    /// </summary>
    [CreateAssetMenu(fileName = "NewNPC", menuName = "PilgrimsProgress/NPC Data")]
    public class NPCData : ScriptableObject
    {
        public string NpcId;
        public string NameKey;
        public string InkKnotName;
        public Sprite[] IdleSprites;
        public Vector2 DefaultPosition;
        public bool FacesPlayer = true;
    }
}
