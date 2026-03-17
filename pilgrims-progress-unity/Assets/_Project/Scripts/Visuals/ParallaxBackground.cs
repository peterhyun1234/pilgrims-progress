using UnityEngine;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.Visuals
{
    public class ParallaxBackground : MonoBehaviour
    {
        private Transform _cameraTransform;
        private Vector3 _lastCameraPos;

        private SpriteRenderer _farLayer;
        private SpriteRenderer _midLayer;

        private const float FarFactor = 0.05f;
        private const float MidFactor = 0.15f;

        public void Initialize(MapTheme theme)
        {
            var cam = Camera.main;
            if (cam == null) return;
            _cameraTransform = cam.transform;
            _lastCameraPos = _cameraTransform.position;

            CreateLayers(theme);
        }

        private void CreateLayers(MapTheme theme)
        {
            var (farColor, midColor) = GetLayerColors(theme);

            _farLayer = CreateLayer("FarParallax", -5, farColor, 2.5f);
            _midLayer = CreateLayer("MidParallax", -3, midColor, 1.5f);
        }

        private SpriteRenderer CreateLayer(string name, int sortOrder, Color color, float scale)
        {
            var go = new GameObject(name);
            go.transform.SetParent(transform, false);
            go.transform.localScale = Vector3.one * scale;

            var sr = go.AddComponent<SpriteRenderer>();
            sr.sortingOrder = sortOrder;

            int w = 128, h = 64;
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            tex.filterMode = FilterMode.Point;

            var rng = new System.Random(name.GetHashCode());
            for (int y = 0; y < h; y++)
            {
                float t = (float)y / h;
                for (int x = 0; x < w; x++)
                {
                    float heightNoise = Mathf.Sin(x * 0.12f) * 0.15f
                        + Mathf.Sin(x * 0.05f + 1f) * 0.1f;
                    float threshold = 0.3f + heightNoise;

                    if (t < threshold)
                    {
                        float blend = Mathf.Clamp01((threshold - t) * 5f);
                        var c = Color.Lerp(Color.clear, color, blend * (0.8f + (float)rng.NextDouble() * 0.2f));
                        tex.SetPixel(x, y, c);
                    }
                    else
                    {
                        tex.SetPixel(x, y, Color.clear);
                    }
                }
            }

            tex.Apply();
            sr.sprite = Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), 16f);

            return sr;
        }

        private void LateUpdate()
        {
            if (_cameraTransform == null) return;

            Vector3 delta = _cameraTransform.position - _lastCameraPos;
            _lastCameraPos = _cameraTransform.position;

            if (_farLayer != null)
                _farLayer.transform.position += new Vector3(delta.x * FarFactor, delta.y * FarFactor * 0.5f, 0f);
            if (_midLayer != null)
                _midLayer.transform.position += new Vector3(delta.x * MidFactor, delta.y * MidFactor * 0.5f, 0f);
        }

        private static (Color far, Color mid) GetLayerColors(MapTheme theme)
        {
            switch (theme)
            {
                case MapTheme.DarkValley:
                    return (new Color(0.08f, 0.05f, 0.12f), new Color(0.12f, 0.08f, 0.15f));
                case MapTheme.Celestial:
                    return (new Color(0.25f, 0.20f, 0.35f), new Color(0.30f, 0.28f, 0.42f));
                case MapTheme.Village:
                case MapTheme.Enchanted:
                    return (new Color(0.10f, 0.15f, 0.12f), new Color(0.14f, 0.18f, 0.15f));
                case MapTheme.City:
                case MapTheme.Market:
                    return (new Color(0.12f, 0.10f, 0.15f), new Color(0.18f, 0.15f, 0.20f));
                case MapTheme.Hill:
                    return (new Color(0.12f, 0.14f, 0.10f), new Color(0.16f, 0.18f, 0.13f));
                default:
                    return (new Color(0.10f, 0.12f, 0.08f), new Color(0.15f, 0.16f, 0.12f));
            }
        }
    }
}
