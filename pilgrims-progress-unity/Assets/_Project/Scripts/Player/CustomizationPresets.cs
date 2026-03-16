using System;
using UnityEngine;

namespace PilgrimsProgress.Player
{
    [CreateAssetMenu(fileName = "CustomizationPresets", menuName = "PilgrimsProgress/Customization Presets")]
    public class CustomizationPresets : ScriptableObject
    {
        [Header("Skin Tones")]
        public Color[] SkinTones = new Color[]
        {
            new Color(0.96f, 0.87f, 0.75f), // light
            new Color(0.87f, 0.74f, 0.58f), // fair
            new Color(0.76f, 0.60f, 0.42f), // medium
            new Color(0.60f, 0.44f, 0.30f), // tan
            new Color(0.44f, 0.30f, 0.20f), // dark
        };

        [Header("Hair Styles")]
        public HairPreset[] HairStyles = new HairPreset[]
        {
            new HairPreset { Name = "Short",    TopHeight = 2, SideWidth = 0 },
            new HairPreset { Name = "Medium",   TopHeight = 3, SideWidth = 1 },
            new HairPreset { Name = "Long",     TopHeight = 3, SideWidth = 2 },
            new HairPreset { Name = "Tied",     TopHeight = 4, SideWidth = 0 },
            new HairPreset { Name = "Shaved",   TopHeight = 1, SideWidth = 0 },
            new HairPreset { Name = "Hooded",   TopHeight = 3, SideWidth = 3 },
        };

        [Header("Hair Colors")]
        public Color[] HairColors = new Color[]
        {
            new Color(0.15f, 0.12f, 0.10f), // black
            new Color(0.40f, 0.26f, 0.15f), // brown
            new Color(0.60f, 0.30f, 0.15f), // auburn
            new Color(0.80f, 0.68f, 0.40f), // blonde
            new Color(0.60f, 0.60f, 0.60f), // gray
            new Color(0.90f, 0.88f, 0.85f), // white
        };

        [Header("Outfit Colors")]
        public Color[] OutfitColors = new Color[]
        {
            new Color(0.50f, 0.38f, 0.25f), // brown rags
            new Color(0.45f, 0.45f, 0.43f), // gray rags
            new Color(0.35f, 0.40f, 0.50f), // blue-gray
            new Color(0.40f, 0.45f, 0.30f), // green-brown
        };

        public static CustomizationPresets CreateDefault()
        {
            var presets = CreateInstance<CustomizationPresets>();
            return presets;
        }
    }

    [Serializable]
    public class HairPreset
    {
        public string Name;
        public int TopHeight;
        public int SideWidth;
    }
}
