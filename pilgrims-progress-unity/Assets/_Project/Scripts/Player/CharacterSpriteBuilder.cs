using UnityEngine;

namespace PilgrimsProgress.Player
{
    /// <summary>
    /// Generates pixel art character sprites from customization data.
    /// Produces a 16x16 sprite with skin, hair, outfit, and burden layers.
    /// Used by both the character creation preview and in-game rendering.
    /// </summary>
    public static class CharacterSpriteBuilder
    {
        private const int Size = 16;

        public static Sprite Build(PlayerCustomization data, CustomizationPresets presets, bool showBurden = true)
        {
            if (presets == null) return null;

            data.ClampIndices(
                presets.SkinTones.Length,
                presets.HairStyles.Length,
                presets.HairColors.Length,
                presets.OutfitColors.Length
            );

            Color skin = presets.SkinTones[data.SkinToneIndex];
            Color hair = presets.HairColors[data.HairColorIndex];
            Color outfit = presets.OutfitColors[data.OutfitColorIndex];
            Color outfitDark = outfit * 0.75f;
            outfitDark.a = 1f;
            Color skinDark = skin * 0.85f;
            skinDark.a = 1f;
            Color burden = new Color(0.50f, 0.35f, 0.20f);

            var hairStyle = presets.HairStyles[data.HairStyleIndex];

            var tex = new Texture2D(Size, Size);
            var pixels = new Color[Size * Size];

            for (int x = 0; x < Size; x++)
            {
                for (int y = 0; y < Size; y++)
                {
                    int i = y * Size + x;
                    pixels[i] = Color.clear;

                    // Feet (y 0-1)
                    if (y >= 0 && y < 2 && x >= 5 && x < 7) pixels[i] = skinDark;
                    if (y >= 0 && y < 2 && x >= 9 && x < 11) pixels[i] = skinDark;

                    // Legs (y 2-4)
                    if (y >= 2 && y < 5 && x >= 5 && x < 11) pixels[i] = outfitDark;

                    // Body / outfit (y 5-9)
                    if (y >= 5 && y < 10 && x >= 4 && x < 12) pixels[i] = outfit;
                    // Belt line
                    if (y == 5 && x >= 4 && x < 12) pixels[i] = outfitDark;
                    // Arms
                    if (y >= 6 && y < 9 && (x == 3 || x == 12)) pixels[i] = skin;

                    // Neck (y 10)
                    if (y == 10 && x >= 6 && x < 10) pixels[i] = skin;

                    // Head (y 11-14)
                    if (y >= 11 && y < 15 && x >= 5 && x < 11) pixels[i] = skin;

                    // Eyes (y 12)
                    if (y == 12 && (x == 6 || x == 9))
                        pixels[i] = new Color(0.1f, 0.1f, 0.1f);

                    // Mouth (y 11)
                    if (y == 11 && x >= 7 && x < 9)
                        pixels[i] = skinDark;

                    // Hair on top of head
                    int topStart = 15 - hairStyle.TopHeight;
                    if (y >= topStart && y < 16 && x >= 4 && x < 12)
                        pixels[i] = hair;

                    // Hair sides
                    if (hairStyle.SideWidth > 0)
                    {
                        if (y >= 11 && y < 15)
                        {
                            if (x >= 5 - hairStyle.SideWidth && x < 5) pixels[i] = hair;
                            if (x >= 11 && x < 11 + hairStyle.SideWidth) pixels[i] = hair;
                        }
                    }

                    // Burden on back (upper-right area)
                    if (showBurden && y >= 12 && y < 16 && x >= 10 && x < 14)
                        pixels[i] = burden;
                }
            }

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;

            return Sprite.Create(tex, new Rect(0, 0, Size, Size), new Vector2(0.5f, 0.25f), Size);
        }

        public static Sprite BuildPreview(PlayerCustomization data, CustomizationPresets presets)
        {
            return Build(data, presets, showBurden: true);
        }

        public static Sprite BuildWithoutBurden(PlayerCustomization data, CustomizationPresets presets)
        {
            return Build(data, presets, showBurden: false);
        }
    }
}
