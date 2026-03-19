using UnityEngine;
using TMPro;

namespace PP.UI
{
    public static class FontManager
    {
        private static TMP_FontAsset _koreanFont;
        private static bool _attempted;

        public static TMP_FontAsset GetKoreanFont()
        {
            if (_koreanFont != null) return _koreanFont;
            if (_attempted) return null;
            _attempted = true;

            _koreanFont = Resources.Load<TMP_FontAsset>("Fonts/NotoSansKR-Regular SDF");
            if (_koreanFont != null) return _koreanFont;

            var ttf = Resources.Load<Font>("NotoSansKR-Regular");
            if (ttf == null)
                ttf = Resources.Load<Font>("Fonts/NotoSansKR-Regular");

            if (ttf != null)
            {
                _koreanFont = TMP_FontAsset.CreateFontAsset(ttf);
                if (_koreanFont != null)
                {
                    _koreanFont.name = "NotoSansKR-Dynamic";
                    AddFallbackToDefault(_koreanFont);
                }
            }

            return _koreanFont;
        }

        public static void ApplyTo(TextMeshProUGUI text)
        {
            if (text == null) return;
            var font = GetKoreanFont();
            if (font != null) text.font = font;
        }

        public static void ApplyToAll(GameObject root)
        {
            if (root == null) return;
            var font = GetKoreanFont();
            if (font == null) return;
            foreach (var tmp in root.GetComponentsInChildren<TextMeshProUGUI>(true))
                tmp.font = font;
        }

        private static void AddFallbackToDefault(TMP_FontAsset koreanFont)
        {
            var defaultFont = TMP_Settings.defaultFontAsset;
            if (defaultFont == null) return;
            if (defaultFont.fallbackFontAssetTable == null)
                defaultFont.fallbackFontAssetTable = new System.Collections.Generic.List<TMP_FontAsset>();
            if (!defaultFont.fallbackFontAssetTable.Contains(koreanFont))
                defaultFont.fallbackFontAssetTable.Add(koreanFont);
        }
    }
}
