using UnityEngine;

namespace PilgrimsProgress.Narrative
{
    [CreateAssetMenu(fileName = "NewLocation", menuName = "PilgrimsProgress/Location Data")]
    public class LocationDataSO : ScriptableObject
    {
        public string LocationId;
        public string NameKey;

        [Header("Backgrounds (Parallax)")]
        public Sprite FarBackground;
        public Sprite MidBackground;
        public Sprite ForegroundBackground;

        [Header("Atmosphere")]
        public Color TintColor = Color.white;
        public string BgmId;
        public string AmbientId;

        [Header("Time of Day")]
        public Color DayTint = Color.white;
        public Color NightTint = new Color(0.4f, 0.4f, 0.6f);
        public Color HopeTint = new Color(1f, 0.95f, 0.85f);
        public Color DespairTint = new Color(0.5f, 0.5f, 0.65f);
    }
}
