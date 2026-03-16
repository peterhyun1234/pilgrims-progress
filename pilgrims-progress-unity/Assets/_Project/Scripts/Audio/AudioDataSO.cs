using UnityEngine;

namespace PilgrimsProgress.Audio
{
    [CreateAssetMenu(fileName = "NewAudioData", menuName = "PilgrimsProgress/Audio Data")]
    public class AudioDataSO : ScriptableObject
    {
        [System.Serializable]
        public struct AudioEntry
        {
            public string Id;
            public AudioClip Clip;
            [Range(0f, 1f)]
            public float Volume;
        }

        [Header("Background Music")]
        public AudioEntry[] BgmTracks;

        [Header("Sound Effects")]
        public AudioEntry[] SfxClips;

        [Header("Ambient Loops")]
        public AudioEntry[] AmbientLoops;

        public void RegisterAll(AudioManager audioManager)
        {
            if (audioManager == null) return;

            if (BgmTracks != null)
            {
                foreach (var entry in BgmTracks)
                {
                    if (entry.Clip != null)
                        audioManager.RegisterBGM(entry.Id, entry.Clip);
                }
            }

            if (SfxClips != null)
            {
                foreach (var entry in SfxClips)
                {
                    if (entry.Clip != null)
                        audioManager.RegisterSFX(entry.Id, entry.Clip);
                }
            }

            if (AmbientLoops != null)
            {
                foreach (var entry in AmbientLoops)
                {
                    if (entry.Clip != null)
                        audioManager.RegisterAmbient(entry.Id, entry.Clip);
                }
            }
        }
    }
}
