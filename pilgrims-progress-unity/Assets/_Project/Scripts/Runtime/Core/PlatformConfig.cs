using UnityEngine;

namespace PP.Core
{
    [CreateAssetMenu(fileName = "PlatformConfig", menuName = "PP/Platform Config")]
    public class PlatformConfig : ScriptableObject
    {
        [Header("Performance")]
        public int TargetFrameRate = 60;
        public bool VSync = false;
        public int MaxParticles = 200;

        [Header("UI")]
        public float UIScale = 1f;
        public bool ShowVirtualControls = false;

        [Header("Rendering")]
        public int PixelsPerUnit = 16;
        public bool UsePixelPerfect = true;

        public void Apply()
        {
            Application.targetFrameRate = TargetFrameRate;
            QualitySettings.vSyncCount = VSync ? 1 : 0;
        }

        public static PlatformConfig LoadForCurrentPlatform()
        {
            string path = Application.isMobilePlatform ? "PlatformConfig_Mobile" : "PlatformConfig_Desktop";
            var config = Resources.Load<PlatformConfig>(path);
            if (config == null)
                config = Resources.Load<PlatformConfig>("PlatformConfig_Desktop");
            return config;
        }
    }
}
