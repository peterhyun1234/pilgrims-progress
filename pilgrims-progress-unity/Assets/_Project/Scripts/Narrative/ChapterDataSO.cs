using UnityEngine;

namespace PilgrimsProgress.Narrative
{
    [CreateAssetMenu(fileName = "NewChapter", menuName = "PilgrimsProgress/Chapter Data")]
    public class ChapterDataSO : ScriptableObject
    {
        public string ChapterId;
        public string TitleKey;
        public string InkKnotName;
        public LocationDataSO[] Locations;
        public CharacterDataSO[] Characters;
    }
}
