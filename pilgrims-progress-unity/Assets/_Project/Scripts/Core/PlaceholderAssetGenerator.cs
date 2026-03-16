using UnityEngine;

namespace PilgrimsProgress.Core
{
    public static class PlaceholderAssetGenerator
    {
        public static Texture2D CreateGradientTexture(int width, int height, Color topColor, Color bottomColor, string label = "")
        {
            var texture = new Texture2D(width, height, TextureFormat.RGBA32, false);
            for (int y = 0; y < height; y++)
            {
                float t = (float)y / height;
                Color color = Color.Lerp(bottomColor, topColor, t);
                for (int x = 0; x < width; x++)
                {
                    texture.SetPixel(x, y, color);
                }
            }
            texture.Apply();
            return texture;
        }

        public static Sprite CreatePlaceholderSprite(int width, int height, Color color)
        {
            var texture = new Texture2D(width, height, TextureFormat.RGBA32, false);
            var pixels = new Color[width * height];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = color;
            texture.SetPixels(pixels);
            texture.Apply();
            return Sprite.Create(texture, new Rect(0, 0, width, height), new Vector2(0.5f, 0.5f));
        }

        public static Texture2D CreateNoiseTexture(int width, int height)
        {
            var texture = new Texture2D(width, height, TextureFormat.RGBA32, false);
            for (int y = 0; y < height; y++)
            {
                for (int x = 0; x < width; x++)
                {
                    float noise = Mathf.PerlinNoise(x * 0.05f, y * 0.05f);
                    texture.SetPixel(x, y, new Color(noise, noise, noise, 1f));
                }
            }
            texture.Apply();
            return texture;
        }
    }
}
