using System;
using PilgrimsProgress.Narrative;

namespace PilgrimsProgress.Save
{
    [Serializable]
    public class SaveData
    {
        public string SlotId;
        public string SaveDate;
        public float PlayTimeSeconds;
        public int Chapter;
        public string CurrentLocation;
        public string Language;
        public string GuestSessionId;

        public CharacterStats Stats;
        public string InkStoryState;

        public bool[] BibleCardsUnlocked;
        public string[] CollectionEntries;

        public SaveData()
        {
            SaveDate = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
            Stats = new CharacterStats();
            BibleCardsUnlocked = new bool[20];
            CollectionEntries = Array.Empty<string>();
        }
    }

    [Serializable]
    public class SaveSlotInfo
    {
        public string SlotId;
        public string SaveDate;
        public int Chapter;
        public float PlayTimeSeconds;
        public bool IsEmpty;

        public SaveSlotInfo(string slotId)
        {
            SlotId = slotId;
            IsEmpty = true;
        }
    }
}
