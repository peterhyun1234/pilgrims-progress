using UnityEngine;
using PilgrimsProgress.Core;
using PilgrimsProgress.Interaction;
using PilgrimsProgress.Visuals;

namespace PilgrimsProgress.Player
{
    public class PlaceholderPlayerSetup : MonoBehaviour
    {
        [Header("Sprite")]
        [SerializeField] private int _spriteSize = 16;

        private void Awake()
        {
            SetupCollider();
            SetupInteractionDetector();
        }

        public void RefreshSprite()
        {
            var animator = GetComponent<PlayerAnimator>();
            if (animator != null)
            {
                animator.RefreshCustomization();
            }
        }

        private void SetupCollider()
        {
            var bc = GetComponent<BoxCollider2D>();
            if (bc == null) bc = gameObject.AddComponent<BoxCollider2D>();
            bc.size = new Vector2(0.6f, 0.4f);
            bc.offset = new Vector2(0f, 0.1f);
        }

        private void SetupInteractionDetector()
        {
            var detector = GetComponentInChildren<InteractionDetector>();
            if (detector == null)
            {
                var detectorGo = new GameObject("InteractionDetector");
                detectorGo.transform.SetParent(transform);
                detectorGo.transform.localPosition = Vector3.zero;
                detectorGo.AddComponent<InteractionDetector>();
            }
        }
    }
}
