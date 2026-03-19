using System;

namespace PP.Save
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
        public string InkStoryState;
        public string QuestStateJson;

        public SaveData()
        {
            SaveDate = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
            QuestStateJson = "";
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
