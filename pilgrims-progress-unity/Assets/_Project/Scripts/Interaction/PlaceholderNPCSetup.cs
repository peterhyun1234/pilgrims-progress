using UnityEngine;

namespace PilgrimsProgress.Interaction
{
    /// <summary>
    /// Generates a placeholder NPC sprite with interaction prompt icon.
    /// </summary>
    public class PlaceholderNPCSetup : MonoBehaviour
    {
        [Header("Sprite")]
        [SerializeField] private Color _npcColor = new Color(0.8f, 0.6f, 0.3f);
        [SerializeField] private int _spriteSize = 16;

        [Header("Prompt")]
        [SerializeField] private Color _promptColor = Color.yellow;

        private void Awake()
        {
            SetupSprite();
            SetupCollider();
            SetupPromptIcon();
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

                    if (isHead) pixels[i] = _npcColor;
                    else if (isBody) pixels[i] = _npcColor * 0.7f;
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
            bc.size = new Vector2(0.8f, 0.6f);
            bc.offset = new Vector2(0f, 0.2f);
        }

        private void SetupPromptIcon()
        {
            var interactable = GetComponent<Interactable>();
            if (interactable == null) return;

            var promptField = typeof(Interactable).GetField("_promptIcon",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            if (promptField != null && promptField.GetValue(interactable) == null)
            {
                var promptGo = new GameObject("PromptIcon");
                promptGo.transform.SetParent(transform);
                promptGo.transform.localPosition = new Vector3(0, 1.2f, 0);

                var promptSr = promptGo.AddComponent<SpriteRenderer>();
                var tex = new Texture2D(8, 8);
                var pixels = new Color[64];
                for (int x = 0; x < 8; x++)
                    for (int y = 0; y < 8; y++)
                    {
                        bool isExcl = (x >= 3 && x < 5 && y >= 2 && y < 7) || (x >= 3 && x < 5 && y == 0);
                        pixels[y * 8 + x] = isExcl ? _promptColor : Color.clear;
                    }
                tex.SetPixels(pixels);
                tex.Apply();
                tex.filterMode = FilterMode.Point;

                promptSr.sprite = Sprite.Create(tex, new Rect(0, 0, 8, 8), new Vector2(0.5f, 0.5f), 8f);
                promptSr.sortingOrder = 20;
                promptGo.SetActive(false);

                promptField.SetValue(interactable, promptGo);
            }
        }
    }
}
