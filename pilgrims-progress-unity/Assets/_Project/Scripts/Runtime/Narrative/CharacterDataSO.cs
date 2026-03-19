using System;
using System.Collections.Generic;
using UnityEngine;

namespace PP.Narrative
{
    [CreateAssetMenu(fileName = "NewCharacter", menuName = "PP/Character Data")]
    public class CharacterDataSO : ScriptableObject
    {
        [Header("Identity")]
        public string Id;
        public string NameEN;
        public string NameKO;

        [Header("Visuals")]
        public Sprite DefaultPortrait;
        public Color PlateColor = new(0.12f, 0.10f, 0.18f, 0.95f);
        public Color NameColor = new(0.90f, 0.78f, 0.45f);
        public Color PanelTint = Color.white;

        [Header("Expressions")]
        public List<ExpressionEntry> Expressions = new();

        [Header("Audio")]
        public AudioClip BarkSfx;

        [Serializable]
        public class ExpressionEntry
        {
            public string Emotion;
            public Sprite Portrait;
        }

        public string GetLocalizedName(string lang)
        {
            return lang == "ko" && !string.IsNullOrEmpty(NameKO) ? NameKO : NameEN;
        }

        public Sprite GetExpression(string emotion)
        {
            if (string.IsNullOrEmpty(emotion)) return DefaultPortrait;
            foreach (var e in Expressions)
            {
                if (string.Equals(e.Emotion, emotion, StringComparison.OrdinalIgnoreCase))
                    return e.Portrait != null ? e.Portrait : DefaultPortrait;
            }
            return DefaultPortrait;
        }
    }
}
