using UnityEngine;
using TMPro;

namespace PilgrimsProgress.UI
{
    /// <summary>
    /// Creates a TMP_FontAsset from NotoSansKR at runtime and sets it as default,
    /// so Korean text renders correctly without manual font asset creation in the editor.
    /// </summary>
    public static class KoreanFontSetup
    {
        private static TMP_FontAsset _koreanFont;
        private static bool _initialized;

        public static TMP_FontAsset KoreanFont => _koreanFont;

        public static void Initialize()
        {
            if (_initialized) return;
            _initialized = true;

            var fontFile = Resources.Load<Font>("NotoSansKR-Regular");
            if (fontFile == null)
            {
                Debug.LogWarning("[KoreanFontSetup] NotoSansKR-Regular not found in Resources.");
                return;
            }

            _koreanFont = TMP_FontAsset.CreateFontAsset(fontFile);
            if (_koreanFont == null)
            {
                Debug.LogWarning("[KoreanFontSetup] Failed to create TMP_FontAsset.");
                return;
            }

            _koreanFont.name = "NotoSansKR-Runtime";

            // Dynamic font: characters are added to atlas on demand
            _koreanFont.atlasPopulationMode = AtlasPopulationMode.Dynamic;

            // Add as fallback to the default TMP font so all TMP text can render Korean
            var defaultFont = TMP_Settings.defaultFontAsset;
            if (defaultFont != null)
            {
                if (defaultFont.fallbackFontAssetTable == null)
                    defaultFont.fallbackFontAssetTable = new System.Collections.Generic.List<TMP_FontAsset>();

                if (!defaultFont.fallbackFontAssetTable.Contains(_koreanFont))
                    defaultFont.fallbackFontAssetTable.Add(_koreanFont);

                Debug.Log("[KoreanFontSetup] Added Korean font as fallback to default TMP font.");
            }
            else
            {
                Debug.Log("[KoreanFontSetup] No default TMP font found. Use ApplyToAll() after scene setup.");
            }
        }

        /// <summary>
        /// Sets the Korean font directly on all TMP text components in the scene.
        /// Call this after UI generation if fallback approach doesn't work.
        /// </summary>
        public static void ApplyToAll()
        {
            if (_koreanFont == null) return;

            var allTexts = Object.FindObjectsByType<TextMeshProUGUI>(FindObjectsSortMode.None);
            foreach (var tmp in allTexts)
            {
                if (tmp.font == null || !tmp.font.HasCharacter('가'))
                {
                    tmp.font = _koreanFont;
                }
            }
        }
    }
}
