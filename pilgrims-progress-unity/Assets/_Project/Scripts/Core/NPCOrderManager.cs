using System;
using System.Collections.Generic;
using UnityEngine;

namespace PilgrimsProgress.Core
{
    public class NPCOrderManager : MonoBehaviour
    {
        public static NPCOrderManager Instance { get; private set; }

        public event Action<string> OnNPCCompleted;
        public event Action OnAllRequiredCompleted;

        private readonly HashSet<string> _completedNpcIds = new HashSet<string>();
        private NPCSpawnData[] _chapterNpcs;
        private int _currentOrderIndex = 1;

        public int CurrentOrderIndex => _currentOrderIndex;

        private void Awake()
        {
            Instance = this;
        }

        public void Initialize(NPCSpawnData[] npcs)
        {
            _chapterNpcs = npcs ?? Array.Empty<NPCSpawnData>();
            _completedNpcIds.Clear();
            _currentOrderIndex = 1;

            if (AreAllRequiredCompleted())
                OnAllRequiredCompleted?.Invoke();
        }

        public void MarkCompleted(string npcId)
        {
            if (_completedNpcIds.Contains(npcId)) return;

            _completedNpcIds.Add(npcId);
            OnNPCCompleted?.Invoke(npcId);

            AdvanceOrder();

            if (AreAllRequiredCompleted())
                OnAllRequiredCompleted?.Invoke();
        }

        private void AdvanceOrder()
        {
            while (IsOrderCompleted(_currentOrderIndex) && _currentOrderIndex <= GetMaxOrder())
                _currentOrderIndex++;
        }

        private bool IsOrderCompleted(int order)
        {
            foreach (var npc in _chapterNpcs)
            {
                if (npc.Order == order && !_completedNpcIds.Contains(npc.NpcId))
                    return false;
            }
            return true;
        }

        private int GetMaxOrder()
        {
            int max = 0;
            foreach (var npc in _chapterNpcs)
                if (npc.Order > max) max = npc.Order;
            return max;
        }

        public bool IsCompleted(string npcId) => _completedNpcIds.Contains(npcId);

        public bool IsCurrentTarget(string npcId)
        {
            foreach (var npc in _chapterNpcs)
            {
                if (npc.NpcId == npcId && npc.Order == _currentOrderIndex)
                    return true;
            }
            return false;
        }

        public NPCSpawnData? GetCurrentTargetNPC()
        {
            foreach (var npc in _chapterNpcs)
            {
                if (npc.Order == _currentOrderIndex && !_completedNpcIds.Contains(npc.NpcId))
                    return npc;
            }
            return null;
        }

        public Vector3? GetCurrentTargetPosition()
        {
            var target = GetCurrentTargetNPC();
            return target?.Position;
        }

        public bool AreAllRequiredCompleted()
        {
            foreach (var npc in _chapterNpcs)
            {
                if (npc.Required && !_completedNpcIds.Contains(npc.NpcId))
                    return false;
            }
            return true;
        }

        public bool CanInteract(string npcId)
        {
            foreach (var npc in _chapterNpcs)
            {
                if (npc.NpcId == npcId)
                    return npc.Order <= _currentOrderIndex;
            }
            return true;
        }
    }
}
