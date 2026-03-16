using UnityEngine;
using PilgrimsProgress.Visuals;

namespace PilgrimsProgress.Interaction
{
    public class PlaceholderNPCSetup : MonoBehaviour
    {
        [SerializeField] private string _npcId = "";
        [SerializeField] private Color _promptColor = new Color(1f, 0.9f, 0.4f);

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

            sr.sprite = ProceduralAssets.CreateNPCSprite(_npcId);
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
                promptGo.transform.localPosition = new Vector3(0, 1.3f, 0);

                var promptSr = promptGo.AddComponent<SpriteRenderer>();
                var tex = new Texture2D(8, 8);
                var pixels = new Color[64];
                for (int x = 0; x < 8; x++)
                    for (int y = 0; y < 8; y++)
                    {
                        bool isExcl = (x >= 3 && x < 5 && y >= 2 && y < 7) ||
                                      (x >= 3 && x < 5 && y == 0);
                        pixels[y * 8 + x] = isExcl ? _promptColor : Color.clear;
                    }
                tex.SetPixels(pixels);
                tex.Apply();
                tex.filterMode = FilterMode.Point;

                promptSr.sprite = Sprite.Create(tex, new Rect(0, 0, 8, 8),
                    new Vector2(0.5f, 0.5f), 8f);
                promptSr.sortingOrder = 20;
                promptGo.SetActive(false);

                promptField.SetValue(interactable, promptGo);
            }
        }

        public void SetNpcId(string id)
        {
            _npcId = id;
            SetupSprite();
        }
    }
}
