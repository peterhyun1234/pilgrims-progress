using UnityEngine;
using PilgrimsProgress.Core;
using PilgrimsProgress.UI;

namespace PilgrimsProgress.Interaction
{
    [RequireComponent(typeof(BoxCollider2D))]
    public class ChapterExitInteractable : MonoBehaviour
    {
        private bool _triggered;
        private SpriteRenderer _sr;
        private bool _unlocked;

        private void Awake()
        {
            var col = GetComponent<BoxCollider2D>();
            col.isTrigger = true;
            col.size = new Vector2(2f, 2f);
            _sr = GetComponent<SpriteRenderer>();
        }

        private void Start()
        {
            var orderMgr = NPCOrderManager.Instance;
            if (orderMgr != null)
            {
                orderMgr.OnAllRequiredCompleted += Unlock;
                _unlocked = orderMgr.AreAllRequiredCompleted();
            }
            else
            {
                _unlocked = true;
            }
            UpdateVisual();
        }

        private void Unlock()
        {
            _unlocked = true;
            UpdateVisual();
        }

        private void UpdateVisual()
        {
            if (_sr != null)
                _sr.color = _unlocked
                    ? new Color(0.9f, 0.78f, 0.45f, 1f)
                    : new Color(0.4f, 0.4f, 0.4f, 0.5f);
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (_triggered) return;
            if (other.GetComponent<Player.PlayerController>() == null) return;

            if (!_unlocked)
            {
                ShowLockedHint();
                return;
            }

            _triggered = true;

            var chapterMgr = ChapterManager.Instance;
            if (chapterMgr == null)
                ServiceLocator.TryGet<ChapterManager>(out chapterMgr);

            if (chapterMgr == null) return;

            int completedCh = chapterMgr.CurrentChapter;
            int nextCh = completedCh + 1;

            if (nextCh > ChapterManager.TotalChapters)
            {
                ShowEpilogue();
                return;
            }

            var transGo = new GameObject("ChapterTransition");
            var transUI = transGo.AddComponent<ChapterTransitionUI>();
            transUI.ShowTransition(completedCh, nextCh);
            transUI.OnTransitionComplete += () =>
            {
                chapterMgr.AdvanceChapter();
                UnityEngine.SceneManagement.SceneManager.LoadScene("Gameplay");
            };
        }

        private void ShowEpilogue()
        {
            var epilogueGo = new GameObject("EpilogueAndCredits");
            epilogueGo.AddComponent<EpilogueEndingUI>().Show();
        }

        private void ShowLockedHint()
        {
            var lm = ServiceLocator.TryGet<Localization.LocalizationManager>(out var l) ? l : null;
            string msg = lm != null && lm.CurrentLanguage == "ko"
                ? "아직 이 챕터에서 만나야 할 사람들이 남아있습니다."
                : "You still have people to meet in this chapter.";
            if (ToastUI.Instance != null)
                ToastUI.Instance.Show(msg);
            else
                Debug.Log($"[ChapterExit] {msg}");
        }

        private void OnDestroy()
        {
            var orderMgr = NPCOrderManager.Instance;
            if (orderMgr != null)
                orderMgr.OnAllRequiredCompleted -= Unlock;
        }
    }
}
