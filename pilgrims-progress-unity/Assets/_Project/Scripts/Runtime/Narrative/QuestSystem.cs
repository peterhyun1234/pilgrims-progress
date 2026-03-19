using System;
using System.Collections.Generic;
using UnityEngine;
using PP.Core;

namespace PP.Narrative
{
    [Serializable]
    public class QuestEntry
    {
        public string Id;
        public QuestStatus Status;
        public HashSet<string> CompletedKnots = new();
        public float StartTime;
        public float CompletionTime;
    }

    public class QuestSystem : MonoBehaviour
    {
        public static QuestSystem Instance { get; private set; }

        private readonly Dictionary<string, QuestEntry> _quests = new();
        private readonly HashSet<string> _globalCompletedKnots = new();

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            ServiceLocator.Register(this);
        }

        public void UnlockQuest(string questId)
        {
            if (_quests.ContainsKey(questId)) return;
            _quests[questId] = new QuestEntry
            {
                Id = questId,
                Status = QuestStatus.Available,
                StartTime = Time.time
            };
            EventBus.Publish(new QuestUpdatedEvent { QuestId = questId, Status = QuestStatus.Available });
        }

        public bool StartQuest(string questId)
        {
            if (!_quests.TryGetValue(questId, out var entry)) return false;
            if (entry.Status != QuestStatus.Available) return false;
            entry.Status = QuestStatus.Active;
            EventBus.Publish(new QuestUpdatedEvent { QuestId = questId, Status = QuestStatus.Active });
            return true;
        }

        public bool CompleteQuest(string questId)
        {
            if (!_quests.TryGetValue(questId, out var entry)) return false;
            if (entry.Status != QuestStatus.Active) return false;
            entry.Status = QuestStatus.Completed;
            entry.CompletionTime = Time.time;
            EventBus.Publish(new QuestUpdatedEvent { QuestId = questId, Status = QuestStatus.Completed });
            return true;
        }

        public QuestStatus GetStatus(string questId)
        {
            return _quests.TryGetValue(questId, out var e) ? e.Status : QuestStatus.Locked;
        }

        public void MarkKnotCompleted(string knotName)
        {
            _globalCompletedKnots.Add(knotName);
        }

        public bool HasCompletedKnot(string knotName)
        {
            return _globalCompletedKnots.Contains(knotName);
        }

        public string ResolveKnot(string primaryKnot, string completedKnot)
        {
            if (string.IsNullOrEmpty(primaryKnot)) return null;
            if (HasCompletedKnot(primaryKnot) && !string.IsNullOrEmpty(completedKnot))
                return completedKnot;
            return primaryKnot;
        }

        #region Serialization

        [Serializable]
        private class SavePayload
        {
            public List<QuestSaveEntry> Quests = new();
            public List<string> CompletedKnots = new();
        }

        [Serializable]
        private class QuestSaveEntry
        {
            public string Id;
            public int Status;
            public List<string> CompletedKnots = new();
        }

        public string Serialize()
        {
            var payload = new SavePayload();
            foreach (var kv in _quests)
            {
                payload.Quests.Add(new QuestSaveEntry
                {
                    Id = kv.Key,
                    Status = (int)kv.Value.Status,
                    CompletedKnots = new List<string>(kv.Value.CompletedKnots)
                });
            }
            payload.CompletedKnots = new List<string>(_globalCompletedKnots);
            return JsonUtility.ToJson(payload);
        }

        public void Deserialize(string json)
        {
            if (string.IsNullOrEmpty(json)) return;
            var payload = JsonUtility.FromJson<SavePayload>(json);
            _quests.Clear();
            _globalCompletedKnots.Clear();

            if (payload.Quests != null)
            {
                foreach (var e in payload.Quests)
                {
                    var entry = new QuestEntry
                    {
                        Id = e.Id,
                        Status = (QuestStatus)e.Status,
                        CompletedKnots = new HashSet<string>(e.CompletedKnots)
                    };
                    _quests[e.Id] = entry;
                }
            }
            if (payload.CompletedKnots != null)
            {
                foreach (var k in payload.CompletedKnots)
                    _globalCompletedKnots.Add(k);
            }
        }

        #endregion

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }
    }
}
