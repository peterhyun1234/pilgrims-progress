using UnityEngine;
using PilgrimsProgress.Core;
using PilgrimsProgress.Narrative;

namespace PilgrimsProgress.Player
{
    public class PlayerCustomizationManager : MonoBehaviour
    {
        public static PlayerCustomizationManager Instance { get; private set; }

        [SerializeField] private CustomizationPresets _presets;

        public PlayerCustomization CurrentCustomization { get; private set; } = new PlayerCustomization();
        public CustomizationPresets Presets => _presets;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            ServiceLocator.Register(this);

            EnsurePresets();
        }

        private void EnsurePresets()
        {
            if (_presets == null)
                _presets = CustomizationPresets.CreateDefault();
        }

        public void SetCustomization(PlayerCustomization data)
        {
            CurrentCustomization = new PlayerCustomization(data);
            CurrentCustomization.ClampIndices(
                _presets.SkinTones.Length,
                _presets.HairStyles.Length,
                _presets.HairColors.Length,
                _presets.OutfitColors.Length
            );
        }

        public string GetPlayerName()
        {
            return CurrentCustomization.GetTrimmedName();
        }

        public void ApplyToInk(InkService ink)
        {
            if (ink == null) return;
            ink.SetVariable("player_name", GetPlayerName());
        }

        public Color GetSkinColor()
        {
            EnsurePresets();
            return _presets.SkinTones[CurrentCustomization.SkinToneIndex];
        }

        public Color GetHairColor()
        {
            EnsurePresets();
            return _presets.HairColors[CurrentCustomization.HairColorIndex];
        }

        public Color GetOutfitColor()
        {
            EnsurePresets();
            return _presets.OutfitColors[CurrentCustomization.OutfitColorIndex];
        }

        public HairPreset GetHairStyle()
        {
            EnsurePresets();
            return _presets.HairStyles[CurrentCustomization.HairStyleIndex];
        }
    }
}
