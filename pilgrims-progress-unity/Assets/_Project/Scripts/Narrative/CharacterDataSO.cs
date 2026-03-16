using UnityEngine;

namespace PilgrimsProgress.Narrative
{
    [CreateAssetMenu(fileName = "NewCharacter", menuName = "PilgrimsProgress/Character Data")]
    public class CharacterDataSO : ScriptableObject
    {
        public string CharacterId;
        public string NameKey;

        [Header("Portraits")]
        public Sprite Neutral;
        public Sprite Happy;
        public Sprite Worried;
        public Sprite Angry;
        public Sprite Surprised;
        public Sprite Praying;
        public Sprite Desperate;
        public Sprite Determined;
        public Sprite Compassionate;
        public Sprite Hopeful;
        public Sprite Joyful;
        public Sprite Serious;
        public Sprite Confused;
        public Sprite Crying;
        public Sprite Earnest;
        public Sprite Dismissive;
        public Sprite Curious;
        public Sprite Excited;
        public Sprite Uncertain;
        public Sprite Weary;

        [Header("Display")]
        public bool IsProtagonist;
        public Color AccentColor = Color.white;

        public Sprite GetExpression(string emotion)
        {
            return emotion?.ToLower() switch
            {
                "neutral" => Neutral,
                "happy" => Happy,
                "worried" => Worried,
                "angry" => Angry,
                "surprised" => Surprised,
                "praying" => Praying,
                "desperate" => Desperate,
                "determined" => Determined,
                "compassionate" => Compassionate,
                "hopeful" => Hopeful,
                "joyful" => Joyful,
                "serious" => Serious,
                "confused" => Confused,
                "crying" => Crying,
                "earnest" => Earnest,
                "dismissive" => Dismissive,
                "curious" => Curious,
                "excited" => Excited,
                "uncertain" => Uncertain,
                "weary" => Weary,
                _ => Neutral
            };
        }
    }
}
