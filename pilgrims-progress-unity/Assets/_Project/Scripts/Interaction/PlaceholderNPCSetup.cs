using UnityEngine;
using PilgrimsProgress.Visuals;

namespace PilgrimsProgress.Interaction
{
    public class PlaceholderNPCSetup : MonoBehaviour
    {
        [SerializeField] private string _npcId = "";
        [SerializeField] private Color _promptColor = new Color(1f, 0.9f, 0.4f);

        private SpriteRenderer _sr;
        private Sprite[] _sprites;
        private float _idleTimer;
        private int _idleFrame;
        private bool _useSpriteSheet;

        private void Awake()
        {
            SetupSprite();
            SetupCollider();
            SetupPromptIcon();
        }

        private void SetupSprite()
        {
            _sr = GetComponent<SpriteRenderer>();
            if (_sr == null) _sr = gameObject.AddComponent<SpriteRenderer>();

            _sprites = SpriteSheetLoader.Load(_npcId);
            if (_sprites != null)
            {
                _sr.sprite = _sprites[0]; // idle down
                _sr.sortingOrder = 10;
                _useSpriteSheet = true;
                return;
            }

            _sr.sprite = ProceduralAssets.CreateNPCSprite(_npcId);
            _sr.sortingOrder = 10;
        }

        private void Update()
        {
            if (!_useSpriteSheet || _sprites == null) return;

            // Gentle idle animation: occasionally shift between frames
            _idleTimer += Time.deltaTime;
            if (_idleTimer > 2f)
            {
                _idleTimer = 0f;
                _idleFrame = (_idleFrame + 1) % 2;
                int frame = _idleFrame == 0 ? 0 : 1;
                var sprite = SpriteSheetLoader.GetSprite(_npcId, SpriteSheetLoader.Direction.Down, frame);
                if (sprite != null) _sr.sprite = sprite;
            }
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
