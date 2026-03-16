using UnityEngine;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.Interaction
{
    [RequireComponent(typeof(BoxCollider2D))]
    public class ChapterExitInteractable : MonoBehaviour
    {
        private bool _triggered;

        private void Awake()
        {
            var col = GetComponent<BoxCollider2D>();
            col.isTrigger = true;
            col.size = new Vector2(2f, 2f);
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (_triggered) return;
            if (other.GetComponent<Player.PlayerController>() == null) return;

            _triggered = true;
            Debug.Log("[ChapterExit] Player reached chapter exit");

            var chapterMgr = ChapterManager.Instance;
            if (chapterMgr == null)
            {
                if (ServiceLocator.TryGet<ChapterManager>(out var cm))
                    chapterMgr = cm;
            }

            if (chapterMgr != null)
            {
                chapterMgr.AdvanceChapter();
                UnityEngine.SceneManagement.SceneManager.LoadScene("Gameplay");
            }
        }
    }
}
