using UnityEngine;

namespace PilgrimsProgress.Audio
{
    /// <summary>
    /// Utility for associating locations and story events with BGM track IDs.
    /// Attach to the GameplayScene to auto-route DialogueController events to AudioManager.
    /// </summary>
    public class MusicCrossfader : MonoBehaviour
    {
        [System.Serializable]
        public struct LocationMusic
        {
            public string LocationId;
            public string BgmId;
        }

        [SerializeField] private LocationMusic[] _locationMusicMap;

        public string GetBgmForLocation(string locationId)
        {
            if (_locationMusicMap == null) return null;

            foreach (var entry in _locationMusicMap)
            {
                if (entry.LocationId == locationId)
                    return entry.BgmId;
            }
            return null;
        }
    }
}
