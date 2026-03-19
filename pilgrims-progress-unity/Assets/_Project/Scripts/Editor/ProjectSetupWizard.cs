#if UNITY_EDITOR
using UnityEngine;
using UnityEditor;
using PP.Narrative;
using PP.Core;

namespace PP.Editor
{
    public static class ProjectSetupWizard
    {
        [MenuItem("PP/Setup/Create All Default Assets")]
        public static void CreateAllDefaults()
        {
            CreateCharacterDatabase();
            CreateDefaultCharacters();
            CreatePlatformConfigs();
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("[PP Setup] All default assets created.");
        }

        [MenuItem("PP/Setup/Create Character Database")]
        public static void CreateCharacterDatabase()
        {
            const string path = "Assets/_Project/Data/Characters/CharacterDatabase.asset";
            EnsureDirectory("Assets/_Project/Data/Characters");

            if (AssetDatabase.LoadAssetAtPath<CharacterDatabase>(path) != null)
            {
                Debug.Log("[PP Setup] CharacterDatabase already exists.");
                return;
            }

            var db = ScriptableObject.CreateInstance<CharacterDatabase>();
            AssetDatabase.CreateAsset(db, path);

            var resourcePath = "Assets/_Project/Resources/CharacterDatabase.asset";
            if (AssetDatabase.LoadAssetAtPath<CharacterDatabase>(resourcePath) == null)
                AssetDatabase.CopyAsset(path, resourcePath);

            Debug.Log("[PP Setup] CharacterDatabase created at " + path);
        }

        [MenuItem("PP/Setup/Create Default Characters")]
        public static void CreateDefaultCharacters()
        {
            EnsureDirectory("Assets/_Project/Data/Characters");

            string[] characters = new[]
            {
                "Christian|크리스천|0.12,0.10,0.18|0.90,0.85,0.70",
                "Evangelist|전도자|0.10,0.10,0.20|0.90,0.82,0.50",
                "Obstinate|완고|0.18,0.12,0.08|0.80,0.45,0.35",
                "Pliable|유연|0.14,0.14,0.14|0.70,0.70,0.70",
                "Help|도움|0.10,0.15,0.10|0.60,0.85,0.60",
                "Worldly Wiseman|세상지혜씨|0.18,0.12,0.08|0.70,0.60,0.80",
                "Good-will|선의|0.10,0.10,0.20|0.90,0.82,0.50",
                "Interpreter|해석자|0.10,0.10,0.20|0.90,0.82,0.50",
                "Prudence|신중|0.08,0.12,0.18|0.75,0.65,0.90",
                "Piety|경건|0.08,0.12,0.18|0.80,0.75,0.55",
                "Charity|사랑|0.08,0.12,0.18|0.90,0.65,0.65",
                "Apollyon|아폴리온|0.25,0.08,0.08|0.90,0.30,0.25",
                "Faithful|신실|0.08,0.12,0.18|0.85,0.70,0.40",
                "Hopeful|소망|0.08,0.12,0.18|0.50,0.75,0.90",
                "Giant Despair|절망 거인|0.20,0.15,0.10|0.70,0.50,0.40",
                "Ignorance|무지|0.18,0.12,0.08|0.65,0.55,0.45",
                "By-ends|사리사욕|0.18,0.12,0.08|0.60,0.50,0.70",
                "Shining One|빛나는 자|0.18,0.16,0.08|1.00,0.95,0.70"
            };

            foreach (var entry in characters)
            {
                var parts = entry.Split('|');
                string id = parts[0];
                string nameKO = parts[1];
                string plateRGB = parts[2];
                string nameRGB = parts[3];

                string assetPath = $"Assets/_Project/Data/Characters/{id.Replace(" ", "_")}.asset";
                if (AssetDatabase.LoadAssetAtPath<CharacterDataSO>(assetPath) != null) continue;

                var so = ScriptableObject.CreateInstance<CharacterDataSO>();
                so.Id = id;
                so.NameEN = id;
                so.NameKO = nameKO;

                var pc = plateRGB.Split(',');
                so.PlateColor = new Color(float.Parse(pc[0]), float.Parse(pc[1]), float.Parse(pc[2]), 0.95f);

                var nc = nameRGB.Split(',');
                so.NameColor = new Color(float.Parse(nc[0]), float.Parse(nc[1]), float.Parse(nc[2]));

                AssetDatabase.CreateAsset(so, assetPath);
            }

            Debug.Log($"[PP Setup] {characters.Length} character assets ensured.");
        }

        [MenuItem("PP/Setup/Create Platform Configs")]
        public static void CreatePlatformConfigs()
        {
            EnsureDirectory("Assets/_Project/Resources");

            CreatePlatformConfig("Assets/_Project/Resources/PlatformConfig_Desktop.asset",
                60, false, 500, 1f, false);

            CreatePlatformConfig("Assets/_Project/Resources/PlatformConfig_Mobile.asset",
                30, false, 100, 1.2f, true);

            Debug.Log("[PP Setup] Platform configs created.");
        }

        private static void CreatePlatformConfig(string path, int fps, bool vsync, int particles, float uiScale, bool virtualControls)
        {
            if (AssetDatabase.LoadAssetAtPath<PlatformConfig>(path) != null) return;

            var config = ScriptableObject.CreateInstance<PlatformConfig>();
            config.TargetFrameRate = fps;
            config.VSync = vsync;
            config.MaxParticles = particles;
            config.UIScale = uiScale;
            config.ShowVirtualControls = virtualControls;
            AssetDatabase.CreateAsset(config, path);
        }

        private static void EnsureDirectory(string path)
        {
            if (AssetDatabase.IsValidFolder(path)) return;

            var parts = path.Split('/');
            string current = parts[0];
            for (int i = 1; i < parts.Length; i++)
            {
                string next = current + "/" + parts[i];
                if (!AssetDatabase.IsValidFolder(next))
                    AssetDatabase.CreateFolder(current, parts[i]);
                current = next;
            }
        }
    }
}
#endif
