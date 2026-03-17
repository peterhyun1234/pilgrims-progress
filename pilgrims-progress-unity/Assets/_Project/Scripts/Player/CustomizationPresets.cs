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
            new Color(0.96f, 0.87f, 0.75f), // porcelain
            new Color(0.91f, 0.80f, 0.65f), // fair
            new Color(0.82f, 0.68f, 0.52f), // warm
            new Color(0.72f, 0.55f, 0.40f), // tan
            new Color(0.58f, 0.42f, 0.30f), // brown
            new Color(0.42f, 0.30f, 0.22f), // deep
        };

        [Header("Hair Styles")]
        public HairPreset[] HairStyles = new HairPreset[]
        {
            new HairPreset { Name = "Short",   TopHeight = 2, SideWidth = 0, HasBangs = false },
            new HairPreset { Name = "Neat",    TopHeight = 2, SideWidth = 1, HasBangs = true },
            new HairPreset { Name = "Medium",  TopHeight = 3, SideWidth = 1, HasBangs = false },
            new HairPreset { Name = "Long",    TopHeight = 3, SideWidth = 2, HasBangs = true },
            new HairPreset { Name = "Flowing", TopHeight = 3, SideWidth = 3, HasBangs = true },
            new HairPreset { Name = "Tied",    TopHeight = 4, SideWidth = 0, HasBangs = false },
            new HairPreset { Name = "Shaved",  TopHeight = 1, SideWidth = 0, HasBangs = false },
            new HairPreset { Name = "Hooded",  TopHeight = 3, SideWidth = 3, HasBangs = false },
        };

        [Header("Hair Colors")]
        public Color[] HairColors = new Color[]
        {
            new Color(0.12f, 0.10f, 0.08f), // raven
            new Color(0.30f, 0.20f, 0.12f), // dark brown
            new Color(0.48f, 0.32f, 0.18f), // chestnut
            new Color(0.60f, 0.30f, 0.15f), // auburn
            new Color(0.78f, 0.62f, 0.35f), // golden
            new Color(0.88f, 0.82f, 0.70f), // flaxen
            new Color(0.55f, 0.55f, 0.52f), // silver
            new Color(0.92f, 0.90f, 0.86f), // white
        };

        [Header("Outfit Colors")]
        public Color[] OutfitColors = new Color[]
        {
            new Color(0.50f, 0.38f, 0.25f), // pilgrim brown
            new Color(0.42f, 0.42f, 0.40f), // stone gray
            new Color(0.30f, 0.36f, 0.48f), // dusk blue
            new Color(0.38f, 0.44f, 0.30f), // forest green
            new Color(0.52f, 0.32f, 0.28f), // russet
            new Color(0.58f, 0.50f, 0.35f), // sand
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
        public bool HasBangs;
    }
}
