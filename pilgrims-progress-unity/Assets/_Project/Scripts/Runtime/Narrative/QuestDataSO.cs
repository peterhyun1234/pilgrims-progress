using UnityEngine;

namespace PP.Narrative
{
    [CreateAssetMenu(fileName = "NewQuest", menuName = "PP/Quest Data")]
    public class QuestDataSO : ScriptableObject
    {
        [Header("Identity")]
        public string QuestId;
        public string TitleEN;
        public string TitleKO;
        [TextArea(2, 4)] public string DescriptionEN;
        [TextArea(2, 4)] public string DescriptionKO;

        [Header("Ink")]
        public string InkKnot;
        public string CompletedKnot;

        [Header("Requirements")]
        public int ChapterNumber;
        public string[] Prerequisites;

        public string GetLocalizedTitle(string lang)
        {
            return lang == "ko" && !string.IsNullOrEmpty(TitleKO) ? TitleKO : TitleEN;
        }

        public string GetLocalizedDescription(string lang)
        {
            return lang == "ko" && !string.IsNullOrEmpty(DescriptionKO) ? DescriptionKO : DescriptionEN;
        }
    }
}
