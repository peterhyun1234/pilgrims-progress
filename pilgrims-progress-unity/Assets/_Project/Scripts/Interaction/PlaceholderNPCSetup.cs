using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PilgrimsProgress.Visuals;
using PilgrimsProgress.Core;
using PilgrimsProgress.UI;

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
        private GameObject _nameLabel;

        private void Awake()
        {
            SetupSprite();
            SetupCollider();
            SetupPromptIcon();
            SetupNameLabel();
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
            SetupNameLabel();
        }

        private void SetupNameLabel()
        {
            if (string.IsNullOrEmpty(_npcId)) return;
            if (_nameLabel != null) Destroy(_nameLabel);

            var lm = ServiceLocator.TryGet<Localization.LocalizationManager>(out var l) ? l : null;
            string lang = lm != null ? lm.CurrentLanguage : "en";
            string speakerId = GetSpeakerIdFromNpcId(_npcId);
            string displayName = DialogueUI.GetLocalizedName(speakerId, lang);

            _nameLabel = new GameObject("NameCanvas");
            _nameLabel.transform.SetParent(transform);
            _nameLabel.transform.localPosition = new Vector3(0, -0.7f, 0);
            _nameLabel.transform.localScale = new Vector3(0.012f, 0.012f, 1f);

            var canvas = _nameLabel.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.WorldSpace;
            canvas.sortingOrder = 21;
            var rt = canvas.GetComponent<RectTransform>();
            rt.sizeDelta = new Vector2(200, 30);

            var textGo = new GameObject("NameText");
            textGo.transform.SetParent(_nameLabel.transform, false);
            var tmp = textGo.AddComponent<TextMeshProUGUI>();
            tmp.text = displayName;
            tmp.fontSize = 22;
            tmp.color = new Color(0.95f, 0.88f, 0.6f, 0.9f);
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.enableWordWrapping = false;
            var trt = tmp.rectTransform;
            trt.anchorMin = Vector2.zero;
            trt.anchorMax = Vector2.one;
            trt.sizeDelta = Vector2.zero;

            KoreanFontSetup.ApplyToAll();
        }

        private static string GetSpeakerIdFromNpcId(string npcId)
        {
            switch (npcId)
            {
                case "evangelist": return "Evangelist";
                case "obstinate": return "Obstinate";
                case "pliable": return "Pliable";
                case "help": return "Help";
                case "worldly_wiseman": return "Worldly Wiseman";
                case "goodwill": return "Good-will";
                case "interpreter": return "Interpreter";
                case "shining1": case "shining2": case "shining3": return "Shining One";
                case "prudence": return "Prudence";
                case "piety": return "Piety";
                case "charity": return "Charity";
                case "apollyon": return "Apollyon";
                case "faithful": return "Faithful";
                case "hopeful": return "Hopeful";
                case "byends": return "By-ends";
                case "giant_despair": return "Giant Despair";
                case "shepherd1": case "shepherd2": return "Shepherd";
                case "ignorance": return "Ignorance";
                default: return npcId;
            }
        }
    }
}
