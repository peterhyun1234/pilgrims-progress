using UnityEngine;
using PP.Core;
using PP.Narrative;

namespace PP.Save
{
    public class SaveManager : MonoBehaviour
    {
        public static SaveManager Instance { get; private set; }

        private const string AutoSlot = "SaveSlot_Auto";

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            ServiceLocator.Register(this);
        }

        public void Save(string slotId = null)
        {
            slotId ??= AutoSlot;
            var data = CreateSaveData(slotId);
            string json = JsonUtility.ToJson(data, true);
            PlayerPrefs.SetString(slotId, json);
            PlayerPrefs.Save();
            Debug.Log($"[SaveManager] Saved to {slotId}");
        }

        public SaveData Load(string slotId = null)
        {
            slotId ??= AutoSlot;
            string json = PlayerPrefs.GetString(slotId, "");
            if (string.IsNullOrEmpty(json)) return null;
            var data = JsonUtility.FromJson<SaveData>(json);
            ApplySaveData(data);
            return data;
        }

        public bool HasSave(string slotId = null)
        {
            return PlayerPrefs.HasKey(slotId ?? AutoSlot);
        }

        public void DeleteSave(string slotId = null)
        {
            PlayerPrefs.DeleteKey(slotId ?? AutoSlot);
            PlayerPrefs.Save();
        }

        private SaveData CreateSaveData(string slotId)
        {
            var gm = GameManager.Instance;
            var data = new SaveData
            {
                SlotId = slotId,
                Chapter = gm?.CurrentChapter ?? 0,
                Language = gm?.CurrentLanguage ?? "ko",
                InkStoryState = InkService.Instance?.GetState() ?? "",
                QuestStateJson = QuestSystem.Instance?.Serialize() ?? ""
            };
            return data;
        }

        private void ApplySaveData(SaveData data)
        {
            var gm = GameManager.Instance;
            if (gm != null)
            {
                gm.CurrentChapter = data.Chapter;
                gm.CurrentLanguage = data.Language;
            }

            var ink = InkService.Instance;
            if (ink != null && !string.IsNullOrEmpty(data.InkStoryState))
                ink.LoadState(data.InkStoryState);

            var quest = QuestSystem.Instance;
            if (quest != null && !string.IsNullOrEmpty(data.QuestStateJson))
                quest.Deserialize(data.QuestStateJson);
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }
    }
}
