using UnityEngine;
using UnityEngine.Tilemaps;

namespace PilgrimsProgress.Scene
{
    /// <summary>
    /// Generates a simple placeholder tilemap at runtime for testing.
    /// Creates a walkable area with walls around the border.
    /// </summary>
    public class PlaceholderTileGenerator : MonoBehaviour
    {
        [Header("Map Size")]
        [SerializeField] private int _width = 30;
        [SerializeField] private int _height = 20;

        [Header("Tilemaps")]
        [SerializeField] private Tilemap _groundTilemap;
        [SerializeField] private Tilemap _wallTilemap;

        [Header("Colors")]
        [SerializeField] private Color _groundColor = new Color(0.6f, 0.75f, 0.45f);
        [SerializeField] private Color _wallColor = new Color(0.4f, 0.35f, 0.3f);
        [SerializeField] private Color _pathColor = new Color(0.8f, 0.7f, 0.5f);

        private void Start()
        {
            if (_groundTilemap == null || _wallTilemap == null) return;
            GenerateMap();
        }

        private void GenerateMap()
        {
            var groundTile = CreateColorTile(_groundColor);
            var wallTile = CreateColorTile(_wallColor);
            var pathTile = CreateColorTile(_pathColor);

            int halfW = _width / 2;
            int halfH = _height / 2;

            for (int x = -halfW; x < halfW; x++)
            {
                for (int y = -halfH; y < halfH; y++)
                {
                    var pos = new Vector3Int(x, y, 0);

                    bool isBorder = x == -halfW || x == halfW - 1 || y == -halfH || y == halfH - 1;

                    if (isBorder)
                    {
                        _wallTilemap.SetTile(pos, wallTile);
                    }
                    else
                    {
                        bool isPath = (Mathf.Abs(y) <= 1) || (Mathf.Abs(x) <= 1 && y > 0);
                        _groundTilemap.SetTile(pos, isPath ? pathTile : groundTile);
                    }
                }
            }

            var wallCollider = _wallTilemap.GetComponent<TilemapCollider2D>();
            if (wallCollider == null)
                _wallTilemap.gameObject.AddComponent<TilemapCollider2D>();
        }

        private Tile CreateColorTile(Color color)
        {
            var tile = ScriptableObject.CreateInstance<Tile>();
            var tex = new Texture2D(16, 16);
            var pixels = new Color[16 * 16];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = color;
            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;

            tile.sprite = Sprite.Create(tex, new Rect(0, 0, 16, 16), new Vector2(0.5f, 0.5f), 16f);
            tile.color = Color.white;
            return tile;
        }

        public Vector2 GetBoundsMin()
        {
            return new Vector2(-_width / 2f, -_height / 2f);
        }

        public Vector2 GetBoundsMax()
        {
            return new Vector2(_width / 2f, _height / 2f);
        }
    }
}
