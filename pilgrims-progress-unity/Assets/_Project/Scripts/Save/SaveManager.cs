using System;
using System.IO;
using UnityEngine;
using PilgrimsProgress.Core;
using PilgrimsProgress.Narrative;

namespace PilgrimsProgress.Save
{
    public class SaveManager : MonoBehaviour
    {
        public static SaveManager Instance { get; private set; }

        public event Action<string> OnSaveComplete;
        public event Action<string> OnLoadComplete;

        public const int MaxManualSlots = 3;
        public const string AutoSlotId = "auto";

        private float _sessionStartTime;
        private float _accumulatedPlayTime;

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
            _sessionStartTime = Time.realtimeSinceStartup;
        }

        public void SaveToSlot(string slotId)
        {
            var data = CreateSaveData(slotId);
            string json = JsonUtility.ToJson(data, true);
            string key = GetSaveKey(slotId);

            PlayerPrefs.SetString(key, json);
            PlayerPrefs.SetString(GetSlotInfoKey(slotId), CreateSlotInfoJson(data));
            PlayerPrefs.Save();

            Debug.Log($"[SaveManager] Saved to slot: {slotId}");
            OnSaveComplete?.Invoke(slotId);
        }

        public SaveData LoadFromSlot(string slotId)
        {
            string key = GetSaveKey(slotId);
            string json = PlayerPrefs.GetString(key, "");

            if (string.IsNullOrEmpty(json))
            {
                Debug.LogWarning($"[SaveManager] No save data in slot: {slotId}");
                return null;
            }

            var data = JsonUtility.FromJson<SaveData>(json);
            ApplySaveData(data);

            Debug.Log($"[SaveManager] Loaded from slot: {slotId}");
            OnLoadComplete?.Invoke(slotId);
            return data;
        }

        public void AutoSave()
        {
            SaveToSlot(AutoSlotId);
        }

        public SaveSlotInfo GetSlotInfo(string slotId)
        {
            string json = PlayerPrefs.GetString(GetSlotInfoKey(slotId), "");
            if (string.IsNullOrEmpty(json))
            {
                return new SaveSlotInfo(slotId);
            }
            return JsonUtility.FromJson<SaveSlotInfo>(json);
        }

        public SaveSlotInfo[] GetAllSlotInfos()
        {
            var infos = new SaveSlotInfo[MaxManualSlots + 1];
            infos[0] = GetSlotInfo(AutoSlotId);
            for (int i = 0; i < MaxManualSlots; i++)
            {
                infos[i + 1] = GetSlotInfo($"slot_{i + 1}");
            }
            return infos;
        }

        public void DeleteSlot(string slotId)
        {
            PlayerPrefs.DeleteKey(GetSaveKey(slotId));
            PlayerPrefs.DeleteKey(GetSlotInfoKey(slotId));
            PlayerPrefs.Save();
        }

        public bool HasSaveData(string slotId)
        {
            return PlayerPrefs.HasKey(GetSaveKey(slotId));
        }

        private SaveData CreateSaveData(string slotId)
        {
            var data = new SaveData
            {
                SlotId = slotId,
                SaveDate = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                PlayTimeSeconds = _accumulatedPlayTime + (Time.realtimeSinceStartup - _sessionStartTime)
            };

            var gm = GameManager.Instance;
            if (gm != null)
            {
                data.Language = gm.CurrentLanguage;
            }

            var statsManager = ServiceLocator.TryGet<StatsManager>(out var sm) ? sm : null;
            if (statsManager != null)
            {
                data.Stats = new CharacterStats(statsManager.Stats);
            }

            var inkService = ServiceLocator.TryGet<InkService>(out var ink) ? ink : null;
            if (inkService != null)
            {
                data.InkStoryState = inkService.GetStoryState();
            }

            var auth = ServiceLocator.TryGet<Auth.AuthManager>(out var am) ? am : null;
            if (auth != null)
            {
                data.GuestSessionId = auth.GuestId;
            }

            return data;
        }

        private void ApplySaveData(SaveData data)
        {
            _accumulatedPlayTime = data.PlayTimeSeconds;
            _sessionStartTime = Time.realtimeSinceStartup;

            var gm = GameManager.Instance;
            if (gm != null && !string.IsNullOrEmpty(data.Language))
            {
                gm.SetLanguage(data.Language);
            }

            var statsManager = ServiceLocator.TryGet<StatsManager>(out var sm) ? sm : null;
            if (statsManager != null && data.Stats != null)
            {
                statsManager.LoadStats(data.Stats);
            }

            var inkService = ServiceLocator.TryGet<InkService>(out var ink) ? ink : null;
            if (inkService != null && !string.IsNullOrEmpty(data.InkStoryState))
            {
                inkService.LoadStoryState(data.InkStoryState);
            }
        }

        private string CreateSlotInfoJson(SaveData data)
        {
            var info = new SaveSlotInfo(data.SlotId)
            {
                SaveDate = data.SaveDate,
                Chapter = data.Chapter,
                PlayTimeSeconds = data.PlayTimeSeconds,
                IsEmpty = false
            };
            return JsonUtility.ToJson(info);
        }

        private string GetSaveKey(string slotId) => $"SaveData_{slotId}";
        private string GetSlotInfoKey(string slotId) => $"SaveSlot_{slotId}";
    }
}
