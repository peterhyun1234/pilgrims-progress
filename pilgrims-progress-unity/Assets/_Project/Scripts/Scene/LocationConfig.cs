using UnityEngine;

namespace PilgrimsProgress.Scene
{
    /// <summary>
    /// ScriptableObject defining configuration for a game location.
    /// Each location in the Pilgrim's Progress journey has one of these.
    /// </summary>
    [CreateAssetMenu(fileName = "NewLocation", menuName = "PilgrimsProgress/Location Config")]
    public class LocationConfig : ScriptableObject
    {
        [Header("Identity")]
        public string LocationId;
        public string SceneName;
        public string NameKo;
        public string NameEn;

        [Header("Map Size")]
        public int MapWidth = 30;
        public int MapHeight = 20;

        [Header("Ink Story")]
        public string InkKnotName;

        [Header("Audio")]
        public string BgmId;

        [Header("Visuals")]
        public Color GroundColor = new Color(0.6f, 0.75f, 0.45f);
        public Color WallColor = new Color(0.4f, 0.35f, 0.3f);
        public Color PathColor = new Color(0.8f, 0.7f, 0.5f);
        public Color AccentColor = Color.white;

        [Header("NPCs")]
        public NPCPlacement[] NPCs;

        [Header("Portals")]
        public PortalPlacement[] Portals;

        [Header("Items")]
        public ItemPlacement[] Items;
    }

    [System.Serializable]
    public class NPCPlacement
    {
        public string NpcId;
        public string InkKnotName;
        public Vector2 Position;
        public Color SpriteColor = new Color(0.8f, 0.6f, 0.3f);
    }

    [System.Serializable]
    public class PortalPlacement
    {
        public string TargetLocationId;
        public string SpawnPointId;
        public Vector2 Position;
        public string RequiredQuestFlag;
        public bool AutoTrigger;
    }

    [System.Serializable]
    public class ItemPlacement
    {
        public string ItemId;
        public string ItemType;
        public Vector2 Position;
    }
}
