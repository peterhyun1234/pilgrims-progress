#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;

namespace PilgrimsProgress.Editor
{
    public class SpriteImportSettings : AssetPostprocessor
    {
        private void OnPreprocessTexture()
        {
            if (!assetPath.Contains("Sprites/Characters") && !assetPath.Contains("Resources/Sprites"))
                return;

            var importer = (TextureImporter)assetImporter;
            importer.textureType = TextureImporterType.Sprite;
            importer.spritePixelsPerUnit = 16;
            importer.filterMode = FilterMode.Point;
            importer.textureCompression = TextureImporterCompression.Uncompressed;
            importer.mipmapEnabled = false;
            importer.maxTextureSize = 256;

            if (assetPath.Contains("_spritesheet"))
            {
                importer.spriteImportMode = SpriteImportMode.Multiple;
            }
        }
    }
}
#endif
