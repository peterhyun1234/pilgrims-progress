#if UNITY_EDITOR
using System.Collections.Generic;
using UnityEngine;
using UnityEditor;

namespace PP.Editor
{
    public static class SpriteSheetSlicer
    {
        [MenuItem("PP/Setup/Re-slice All Character Spritesheets")]
        public static void ResliceAll()
        {
            string[] folders = new[]
            {
                "Assets/_Project/Resources/Sprites",
                "Assets/_Project/Sprites/Characters"
            };

            int count = 0;
            foreach (var folder in folders)
            {
                string[] guids = AssetDatabase.FindAssets("t:Texture2D", new[] { folder });
                foreach (string guid in guids)
                {
                    string path = AssetDatabase.GUIDToAssetPath(guid);
                    if (!path.Contains("_spritesheet")) continue;
                    if (SliceSheet(path)) count++;
                }
            }

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log($"[SpriteSheetSlicer] Re-sliced {count} spritesheets.");
        }

        private static bool SliceSheet(string assetPath)
        {
            var importer = AssetImporter.GetAtPath(assetPath) as TextureImporter;
            if (importer == null) return false;

            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Multiple;
            importer.filterMode = FilterMode.Point;
            importer.textureCompression = TextureImporterCompression.Uncompressed;
            importer.isReadable = true;

            var tex = AssetDatabase.LoadAssetAtPath<Texture2D>(assetPath);
            if (tex == null) return false;

            int frameSize = (tex.width >= 96) ? 32 : 16;
            int ppu = frameSize;

            importer.spritePixelsPerUnit = ppu;

            int cols = tex.width / frameSize;
            int rows = tex.height / frameSize;

            var spriteSheet = new List<SpriteMetaData>();
            string baseName = System.IO.Path.GetFileNameWithoutExtension(assetPath);

            int index = 0;
            for (int row = rows - 1; row >= 0; row--)
            {
                for (int col = 0; col < cols; col++)
                {
                    var meta = new SpriteMetaData
                    {
                        name = $"{baseName}_{index}",
                        rect = new Rect(col * frameSize, row * frameSize, frameSize, frameSize),
                        alignment = (int)SpriteAlignment.BottomCenter,
                        pivot = new Vector2(0.5f, 0f)
                    };
                    spriteSheet.Add(meta);
                    index++;
                }
            }

            importer.spritesheet = spriteSheet.ToArray();
            EditorUtility.SetDirty(importer);
            importer.SaveAndReimport();

            Debug.Log($"[Slicer] {baseName}: {cols}x{rows} grid, {frameSize}px frames, {index} sprites");
            return true;
        }
    }
}
#endif
