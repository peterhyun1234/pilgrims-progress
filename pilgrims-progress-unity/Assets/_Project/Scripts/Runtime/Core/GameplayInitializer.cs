using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PP.Player;
using PP.Interaction;
using PP.GameCamera;
using PP.UI;

namespace PP.Core
{
    public class GameplayInitializer : MonoBehaviour
    {
        private void Start()
        {
            FontManager.GetKoreanFont();

            var player = SetupPlayer();
            SetupCamera(player.transform);
            SetupGround();
            SetupHUD();
            SetupTestNPC();

            GameManager.Instance?.SetMode(GameMode.Exploration);
        }

        #region Player

        private PlayerController SetupPlayer()
        {
            var existing = FindFirstObjectByType<PlayerController>();
            if (existing != null) return existing;

            var go = new GameObject("Player");
            go.transform.position = Vector3.zero;

            var rb = go.AddComponent<Rigidbody2D>();
            rb.gravityScale = 0f;
            rb.freezeRotation = true;

            var sr = go.AddComponent<SpriteRenderer>();
            sr.sortingOrder = 10;
            sr.sprite = GetFirstFrame("christian");

            var col = go.AddComponent<BoxCollider2D>();
            col.size = new Vector2(0.5f, 0.3f);
            col.offset = new Vector2(0, 0.15f);

            go.AddComponent<PlayerMotor>();
            go.AddComponent<PlayerAnimationController>();
            var ctrl = go.AddComponent<PlayerController>();

            var detector = new GameObject("InteractionDetector");
            detector.transform.SetParent(go.transform, false);
            detector.AddComponent<InteractionDetector>();

            return ctrl;
        }

        #endregion

        #region Camera

        private void SetupCamera(Transform target)
        {
            var cam = FindFirstObjectByType<UnityEngine.Camera>();
            if (cam == null)
            {
                var go = new GameObject("Main Camera");
                go.tag = "MainCamera";
                cam = go.AddComponent<UnityEngine.Camera>();
                go.AddComponent<AudioListener>();
                go.transform.position = new Vector3(0, 0, -10);
            }

            cam.orthographic = true;
            cam.orthographicSize = 5f;
            cam.backgroundColor = new Color(0.06f, 0.09f, 0.14f);

            var cc = cam.GetComponent<CameraController>()
                     ?? cam.gameObject.AddComponent<CameraController>();
            cc.SetTarget(target);
        }

        #endregion

        #region Ground

        private void SetupGround()
        {
            var root = new GameObject("[World]");
            var tile = MakePixelSprite(Color.white);

            for (int x = -14; x <= 14; x++)
            {
                for (int y = -10; y <= 10; y++)
                {
                    float n = Mathf.PerlinNoise(x * 0.3f + 100, y * 0.3f + 100);
                    float g = 0.18f + n * 0.12f;
                    Color c = new Color(g * 0.5f, g, g * 0.35f);
                    MakeWorldTile(root.transform, new Vector3(x, y, 0), c, tile, -10);
                }
            }

            for (int y = -10; y <= 10; y++)
            {
                float n = Mathf.PerlinNoise(0.5f, y * 0.2f + 50);
                float b = 0.38f + n * 0.08f;
                var pathTile = MakeWorldTile(root.transform, new Vector3(0, y, 0),
                    new Color(b, b * 0.82f, b * 0.55f), tile, -9);
                pathTile.transform.localScale = new Vector3(1.5f, 1f, 1f);
            }

            PlaceTree(root.transform, new Vector3(-3.5f, 3f, 0));
            PlaceTree(root.transform, new Vector3(4f, -2f, 0));
            PlaceTree(root.transform, new Vector3(-2f, -4f, 0));
            PlaceTree(root.transform, new Vector3(5.5f, 4.5f, 0));
            PlaceTree(root.transform, new Vector3(-5f, -1f, 0));

            PlaceRock(root.transform, new Vector3(2f, -3f, 0));
            PlaceRock(root.transform, new Vector3(-4f, 1f, 0));
        }

        private void PlaceTree(Transform parent, Vector3 pos)
        {
            var trunkGo = MakeWorldTile(parent, pos, new Color(0.35f, 0.22f, 0.1f),
                MakePixelSprite(Color.white), -7);
            trunkGo.transform.localScale = new Vector3(0.2f, 0.5f, 1f);
            trunkGo.name = "Trunk";

            var leafGo = MakeWorldTile(parent, pos + new Vector3(0, 0.45f, 0),
                new Color(0.1f, 0.32f, 0.08f), MakePixelSprite(Color.white), -6);
            leafGo.transform.localScale = new Vector3(0.8f, 0.7f, 1f);
            leafGo.name = "Leaves";
        }

        private void PlaceRock(Transform parent, Vector3 pos)
        {
            var go = MakeWorldTile(parent, pos, new Color(0.3f, 0.3f, 0.32f),
                MakePixelSprite(Color.white), -7);
            go.transform.localScale = new Vector3(
                Random.Range(0.3f, 0.6f), Random.Range(0.2f, 0.4f), 1f);
            go.name = "Rock";
        }

        private GameObject MakeWorldTile(Transform parent, Vector3 pos,
            Color color, Sprite sprite, int order)
        {
            var go = new GameObject("Tile");
            go.transform.SetParent(parent, false);
            go.transform.position = pos;
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = sprite;
            sr.color = color;
            sr.sortingOrder = order;
            return go;
        }

        #endregion

        #region HUD

        private void SetupHUD()
        {
            bool ko = IsKorean();

            var root = new GameObject("[HUD]");
            var canvas = root.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 5;

            var scaler = root.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            root.AddComponent<GraphicRaycaster>();

            int ch = GameManager.Instance?.CurrentChapter ?? 0;
            MakeHUDText(root.transform, "Chapter",
                ko ? $"제 {ch + 1}장 — 멸망의 도시" : $"Chapter {ch + 1} — City of Destruction",
                16, new Color(0.85f, 0.78f, 0.55f, 0.8f),
                new Vector2(0.01f, 0.95f), new Vector2(0.4f, 0.99f),
                TextAlignmentOptions.TopLeft);

            MakeHUDText(root.transform, "Controls",
                ko ? "WASD 이동 · E 상호작용 · Space 공격 · Shift 달리기"
                   : "WASD Move · E Interact · Space Attack · Shift Sprint",
                12, new Color(0.5f, 0.48f, 0.4f, 0.5f),
                new Vector2(0.15f, 0.005f), new Vector2(0.85f, 0.03f),
                TextAlignmentOptions.Bottom);

            FontManager.ApplyToAll(root);
        }

        private void MakeHUDText(Transform parent, string name, string text,
            int size, Color color, Vector2 anchorMin, Vector2 anchorMax,
            TextAlignmentOptions align)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var tmp = go.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = size;
            tmp.color = color;
            tmp.alignment = align;
            tmp.raycastTarget = false;
            var rt = tmp.rectTransform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.sizeDelta = Vector2.zero;
        }

        #endregion

        #region NPC

        private void SetupTestNPC()
        {
            bool ko = IsKorean();

            var go = new GameObject("NPC_Evangelist");
            go.transform.position = new Vector3(3f, 2f, 0);

            var sr = go.AddComponent<SpriteRenderer>();
            sr.sortingOrder = 10;
            sr.sprite = GetFirstFrame("evangelist");

            var col = go.AddComponent<BoxCollider2D>();
            col.size = new Vector2(0.5f, 0.3f);
            col.offset = new Vector2(0, 0.15f);

            go.AddComponent<NPCInteractable>();

            MakeNameLabel(go.transform, ko ? "전도자" : "Evangelist",
                new Color(0.95f, 0.88f, 0.5f));
        }

        private void MakeNameLabel(Transform parent, string text, Color color)
        {
            var go = new GameObject("Label");
            go.transform.SetParent(parent, false);
            go.transform.localPosition = new Vector3(0, 1.1f, 0);

            var canvas = go.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.WorldSpace;
            canvas.sortingOrder = 20;

            var rt = canvas.GetComponent<RectTransform>();
            rt.sizeDelta = new Vector2(120f, 20f);
            rt.localScale = Vector3.one * 0.01f;

            var textGo = new GameObject("Text");
            textGo.transform.SetParent(go.transform, false);
            var tmp = textGo.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = 14;
            tmp.color = color;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.outlineWidth = 0.2f;
            tmp.outlineColor = new Color32(0, 0, 0, 200);
            FontManager.ApplyTo(tmp);

            var trt = tmp.rectTransform;
            trt.anchorMin = Vector2.zero;
            trt.anchorMax = Vector2.one;
            trt.sizeDelta = Vector2.zero;
        }

        #endregion

        #region Utility

        private static Sprite GetFirstFrame(string characterKey)
        {
            var all = Resources.LoadAll<Sprite>($"Sprites/{characterKey}_spritesheet");
            if (all != null && all.Length > 0) return all[0];

            var tex = Resources.Load<Texture2D>($"Sprites/{characterKey}_spritesheet");
            if (tex != null)
            {
                int fs = tex.width >= 96 ? 32 : 16;
                int topRow = tex.height - fs;
                return Sprite.Create(tex,
                    new Rect(0, topRow, fs, fs),
                    new Vector2(0.5f, 0f), fs);
            }

            return MakePixelSprite(new Color(0.5f, 0.5f, 0.8f));
        }

        private static bool IsKorean()
        {
            return GameManager.Instance?.CurrentLanguage == "ko";
        }

        private static Sprite MakePixelSprite(Color color)
        {
            var tex = new Texture2D(1, 1);
            tex.filterMode = FilterMode.Point;
            tex.SetPixel(0, 0, color);
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, 1, 1), Vector2.one * 0.5f, 1f);
        }

        #endregion
    }
}
