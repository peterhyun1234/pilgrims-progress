using UnityEngine;
using PilgrimsProgress.Core;
using PilgrimsProgress.Visuals;

namespace PilgrimsProgress.Player
{
    public class ModularSpriteRenderer : MonoBehaviour
    {
        private const int SpriteSize = 16;

        private SpriteRenderer _bodyRenderer;
        private SpriteRenderer _hairRenderer;
        private SpriteRenderer _outfitRenderer;
        private SpriteRenderer _burdenRenderer;
        private SpriteRenderer _mainRenderer;

        private Sprite _bodySprite;
        private Sprite _hairSprite;
        private Sprite _outfitSprite;
        private Sprite _burdenSprite;

        private PlayerCustomization _lastCustomization;
        private bool _showBurden = true;
        private bool _initialized;

        public void Initialize(SpriteRenderer mainRenderer)
        {
            _mainRenderer = mainRenderer;

            _bodyRenderer = CreateLayer("Body", 10);
            _outfitRenderer = CreateLayer("Outfit", 11);
            _hairRenderer = CreateLayer("Hair", 12);
            _burdenRenderer = CreateLayer("Burden", 13);

            _initialized = true;
            Rebuild();
        }

        private SpriteRenderer CreateLayer(string name, int sortOrder)
        {
            var go = new GameObject($"Layer_{name}");
            go.transform.SetParent(transform, false);
            go.transform.localPosition = Vector3.zero;
            go.transform.localScale = Vector3.one;

            var sr = go.AddComponent<SpriteRenderer>();
            sr.sortingOrder = sortOrder;
            sr.material = ThemeLighting.GetLitMaterial();
            return sr;
        }

        public void SetShowBurden(bool show)
        {
            _showBurden = show;
            if (_burdenRenderer != null)
                _burdenRenderer.enabled = show;
        }

        public void Rebuild()
        {
            if (!_initialized) return;

            var custManager = PlayerCustomizationManager.Instance;
            if (custManager == null)
                ServiceLocator.TryGet<PlayerCustomizationManager>(out custManager);
            if (custManager == null || custManager.Presets == null) return;

            var data = custManager.CurrentCustomization;
            var presets = custManager.Presets;

            Color skin = custManager.GetSkinColor();
            Color hair = custManager.GetHairColor();
            Color outfit = custManager.GetOutfitColor();
            var hairStyle = custManager.GetHairStyle();

            _bodySprite = BuildBodyLayer(skin);
            _outfitSprite = BuildOutfitLayer(outfit);
            _hairSprite = BuildHairLayer(hair, hairStyle);
            _burdenSprite = BuildBurdenLayer();

            _bodyRenderer.sprite = _bodySprite;
            _outfitRenderer.sprite = _outfitSprite;
            _hairRenderer.sprite = _hairSprite;
            _burdenRenderer.sprite = _burdenSprite;
            _burdenRenderer.enabled = _showBurden;

            if (_mainRenderer != null)
                _mainRenderer.enabled = false;

            _lastCustomization = new PlayerCustomization(data);
        }

        private Sprite BuildBodyLayer(Color skin)
        {
            var tex = new Texture2D(SpriteSize, SpriteSize, TextureFormat.RGBA32, false);
            var clear = Color.clear;
            var pixels = new Color[SpriteSize * SpriteSize];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = clear;

            Color skinDark = skin * 0.7f; skinDark.a = 1f;

            for (int x = 5; x <= 10; x++)
            {
                pixels[0 * SpriteSize + x] = skinDark;
                pixels[1 * SpriteSize + x] = skinDark;
            }

            for (int x = 5; x <= 10; x++)
            {
                pixels[10 * SpriteSize + x] = skin;
            }

            for (int y = 11; y <= 14; y++)
            {
                for (int x = 5; x <= 10; x++)
                    pixels[y * SpriteSize + x] = skin;
            }

            pixels[12 * SpriteSize + 6] = skinDark;
            pixels[12 * SpriteSize + 9] = skinDark;
            pixels[11 * SpriteSize + 7] = Color.Lerp(skin, Color.red, 0.2f);

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, SpriteSize, SpriteSize),
                new Vector2(0.5f, 0.25f), SpriteSize);
        }

        private Sprite BuildOutfitLayer(Color outfit)
        {
            var tex = new Texture2D(SpriteSize, SpriteSize, TextureFormat.RGBA32, false);
            var pixels = new Color[SpriteSize * SpriteSize];
            Color outfitDark = outfit * 0.6f; outfitDark.a = 1f;
            Color belt = Color.Lerp(outfit, Color.black, 0.5f); belt.a = 1f;

            for (int y = 2; y <= 4; y++)
                for (int x = 5; x <= 10; x++)
                    pixels[y * SpriteSize + x] = outfitDark;

            for (int y = 5; y <= 9; y++)
                for (int x = 4; x <= 11; x++)
                    pixels[y * SpriteSize + x] = outfit;

            for (int x = 4; x <= 11; x++)
                pixels[7 * SpriteSize + x] = belt;

            for (int y = 5; y <= 8; y++)
            {
                pixels[y * SpriteSize + 3] = outfit;
                pixels[y * SpriteSize + 12] = outfit;
            }

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, SpriteSize, SpriteSize),
                new Vector2(0.5f, 0.25f), SpriteSize);
        }

        private Sprite BuildHairLayer(Color hair, HairPreset style)
        {
            var tex = new Texture2D(SpriteSize, SpriteSize, TextureFormat.RGBA32, false);
            var pixels = new Color[SpriteSize * SpriteSize];

            int topH = style.TopHeight;
            int sideW = style.SideWidth;

            for (int dy = 0; dy < topH; dy++)
            {
                int y = 14 + dy;
                if (y >= SpriteSize) break;
                for (int x = 5; x <= 10; x++)
                    pixels[y * SpriteSize + x] = hair;
            }

            if (sideW > 0)
            {
                for (int y = 12; y <= 14; y++)
                {
                    for (int dx = 1; dx <= sideW; dx++)
                    {
                        int xl = 5 - dx;
                        int xr = 10 + dx;
                        if (xl >= 0) pixels[y * SpriteSize + xl] = hair;
                        if (xr < SpriteSize) pixels[y * SpriteSize + xr] = hair;
                    }
                }
            }

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, SpriteSize, SpriteSize),
                new Vector2(0.5f, 0.25f), SpriteSize);
        }

        private Sprite BuildBurdenLayer()
        {
            var tex = new Texture2D(SpriteSize, SpriteSize, TextureFormat.RGBA32, false);
            var pixels = new Color[SpriteSize * SpriteSize];
            Color burden = new Color(0.45f, 0.35f, 0.20f);

            for (int y = 12; y <= 15; y++)
            {
                if (y >= SpriteSize) break;
                for (int x = 10; x <= 13; x++)
                {
                    if (x >= SpriteSize) break;
                    pixels[y * SpriteSize + x] = burden;
                }
            }

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, SpriteSize, SpriteSize),
                new Vector2(0.5f, 0.25f), SpriteSize);
        }

        public void TintOutfit(Color tint)
        {
            if (_outfitRenderer != null)
                _outfitRenderer.color = tint;
        }

        public void SetAllLayersColor(Color color)
        {
            if (_bodyRenderer != null) _bodyRenderer.color = color;
            if (_hairRenderer != null) _hairRenderer.color = color;
            if (_outfitRenderer != null) _outfitRenderer.color = color;
        }
    }
}
