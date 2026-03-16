using System;
using UnityEngine;

namespace PilgrimsProgress.Player
{
    [Serializable]
    public class PlayerCustomization
    {
        public string PlayerName = "Christian";
        public int SkinToneIndex;
        public int HairStyleIndex;
        public int HairColorIndex;
        public int OutfitColorIndex;

        public const int MaxNameLength = 12;
        public const int MinNameLength = 1;

        public PlayerCustomization() { }

        public PlayerCustomization(PlayerCustomization other)
        {
            PlayerName = other.PlayerName;
            SkinToneIndex = other.SkinToneIndex;
            HairStyleIndex = other.HairStyleIndex;
            HairColorIndex = other.HairColorIndex;
            OutfitColorIndex = other.OutfitColorIndex;
        }

        public bool IsNameValid()
        {
            if (string.IsNullOrWhiteSpace(PlayerName)) return false;
            string trimmed = PlayerName.Trim();
            return trimmed.Length >= MinNameLength && trimmed.Length <= MaxNameLength;
        }

        public void ClampIndices(int skinCount, int hairStyleCount, int hairColorCount, int outfitCount)
        {
            SkinToneIndex = Mathf.Clamp(SkinToneIndex, 0, Mathf.Max(0, skinCount - 1));
            HairStyleIndex = Mathf.Clamp(HairStyleIndex, 0, Mathf.Max(0, hairStyleCount - 1));
            HairColorIndex = Mathf.Clamp(HairColorIndex, 0, Mathf.Max(0, hairColorCount - 1));
            OutfitColorIndex = Mathf.Clamp(OutfitColorIndex, 0, Mathf.Max(0, outfitCount - 1));
        }

        public string GetTrimmedName()
        {
            if (string.IsNullOrWhiteSpace(PlayerName)) return "Christian";
            string trimmed = PlayerName.Trim();
            if (trimmed.Length > MaxNameLength) trimmed = trimmed.Substring(0, MaxNameLength);
            return trimmed.Length == 0 ? "Christian" : trimmed;
        }
    }
}
