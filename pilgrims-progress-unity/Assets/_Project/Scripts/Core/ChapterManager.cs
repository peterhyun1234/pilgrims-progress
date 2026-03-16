using System;
using UnityEngine;

namespace PilgrimsProgress.Core
{
    public class ChapterManager : MonoBehaviour
    {
        public static ChapterManager Instance { get; private set; }

        public event Action<int> OnChapterChanged;

        public int CurrentChapter
        {
            get => GameManager.Instance != null ? GameManager.Instance.CurrentChapter : 1;
            private set
            {
                if (GameManager.Instance != null)
                    GameManager.Instance.CurrentChapter = value;
            }
        }

        public const int TotalChapters = 12;

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

            if (CurrentChapter < 1) CurrentChapter = 1;
        }

        public void AdvanceChapter()
        {
            if (CurrentChapter >= TotalChapters) return;
            CurrentChapter++;
            Debug.Log($"[ChapterManager] Advanced to Chapter {CurrentChapter}");
            OnChapterChanged?.Invoke(CurrentChapter);
        }

        public void SetChapter(int chapter)
        {
            CurrentChapter = Mathf.Clamp(chapter, 1, TotalChapters);
            Debug.Log($"[ChapterManager] Set to Chapter {CurrentChapter}");
            OnChapterChanged?.Invoke(CurrentChapter);
        }

        public ChapterData GetChapterData(int chapter)
        {
            return ChapterDatabase.Get(chapter);
        }

        public ChapterData GetCurrentChapterData()
        {
            return GetChapterData(CurrentChapter);
        }
    }
}
