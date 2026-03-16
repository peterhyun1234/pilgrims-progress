using UnityEngine;
using PilgrimsProgress.Interaction;

namespace PilgrimsProgress.Player
{
    /// <summary>
    /// Generates a placeholder player sprite and collider at runtime.
    /// Attach to a GameObject that will become the player.
    /// </summary>
    public class PlaceholderPlayerSetup : MonoBehaviour
    {
        [Header("Sprite")]
        [SerializeField] private Color _playerColor = new Color(0.3f, 0.5f, 0.9f);
        [SerializeField] private Color _burdenColor = new Color(0.5f, 0.35f, 0.2f);
        [SerializeField] private int _spriteSize = 16;

        private void Awake()
        {
            SetupSprite();
            SetupCollider();
            SetupInteractionDetector();
        }

        private void SetupSprite()
        {
            var sr = GetComponent<SpriteRenderer>();
            if (sr == null) sr = gameObject.AddComponent<SpriteRenderer>();

            int s = _spriteSize;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];

            for (int x = 0; x < s; x++)
            {
                for (int y = 0; y < s; y++)
                {
                    int i = y * s + x;
                    bool isBody = x >= 4 && x < 12 && y >= 0 && y < 12;
                    bool isHead = x >= 5 && x < 11 && y >= 9 && y < 15;
                    bool isBurden = x >= 6 && x < 13 && y >= 11 && y < 16;

                    if (isBurden) pixels[i] = _burdenColor;
                    else if (isHead) pixels[i] = _playerColor;
                    else if (isBody) pixels[i] = _playerColor * 0.8f;
                    else pixels[i] = Color.clear;
                }
            }

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;

            sr.sprite = Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.25f), s);
            sr.sortingOrder = 10;
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
