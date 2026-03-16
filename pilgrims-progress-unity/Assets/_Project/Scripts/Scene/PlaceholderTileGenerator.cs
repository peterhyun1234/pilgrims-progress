using UnityEngine;
using UnityEngine.Tilemaps;
using PilgrimsProgress.Visuals;

namespace PilgrimsProgress.Scene
{
    public class PlaceholderTileGenerator : MonoBehaviour
    {
        [Header("Map Size")]
        [SerializeField] private int _width = 30;
        [SerializeField] private int _height = 20;

        [Header("Tilemaps")]
        [SerializeField] private Tilemap _groundTilemap;
        [SerializeField] private Tilemap _wallTilemap;

        private Tile[] _grassTiles;
        private Tile _pathTile;
        private Tile _wallTile;
        private Tile _waterTile;
        private Tile _flowerTile;
        private Tile _bridgeTile;

        private void Start()
        {
            if (_groundTilemap == null || _wallTilemap == null) return;
            GenerateTiles();
            GenerateMap();
        }

        private void GenerateTiles()
        {
            _grassTiles = new Tile[4];
            for (int i = 0; i < 4; i++)
                _grassTiles[i] = ProceduralAssets.CreateGrassTile(i);

            _pathTile = ProceduralAssets.CreatePathTile();
            _wallTile = ProceduralAssets.CreateWallTile();
            _waterTile = ProceduralAssets.CreateWaterTile();
            _flowerTile = ProceduralAssets.CreateFlowerTile(new Color(0.85f, 0.35f, 0.35f));
            _bridgeTile = ProceduralAssets.CreateBridgeTile();
        }

        private void GenerateMap()
        {
            int halfW = _width / 2;
            int halfH = _height / 2;
            var rng = new System.Random(12345);

            for (int x = -halfW; x < halfW; x++)
            {
                for (int y = -halfH; y < halfH; y++)
                {
                    var pos = new Vector3Int(x, y, 0);
                    bool isBorder = x == -halfW || x == halfW - 1
                        || y == -halfH || y == halfH - 1;

                    if (isBorder)
                    {
                        _wallTilemap.SetTile(pos, _wallTile);
                        continue;
                    }

                    // Main horizontal path
                    bool isMainPath = Mathf.Abs(y) <= 1;
                    // Vertical path going north
                    bool isVertPath = Mathf.Abs(x) <= 1 && y > 0;
                    // Side path going east
                    bool isSidePath = y >= 3 && y <= 4 && x > 2;

                    if (isMainPath || isVertPath || isSidePath)
                    {
                        _groundTilemap.SetTile(pos, _pathTile);
                    }
                    // Small pond in bottom-right
                    else if (x > 6 && x < 12 && y > -8 && y < -4)
                    {
                        float distFromCenter = Mathf.Sqrt(
                            Mathf.Pow(x - 9, 2) + Mathf.Pow(y - (-6), 2));
                        if (distFromCenter < 2.5f)
                            _groundTilemap.SetTile(pos, _waterTile);
                        else
                            _groundTilemap.SetTile(pos, _grassTiles[rng.Next(_grassTiles.Length)]);
                    }
                    // Flower patches
                    else if ((x > -10 && x < -6 && y > 4 && y < 8) ||
                             (x > 4 && x < 7 && y > 5 && y < 8))
                    {
                        _groundTilemap.SetTile(pos, rng.Next(3) == 0 ? _flowerTile
                            : _grassTiles[rng.Next(_grassTiles.Length)]);
                    }
                    // Interior walls/buildings
                    else if (IsBuilding(x, y))
                    {
                        _wallTilemap.SetTile(pos, _wallTile);
                    }
                    else
                    {
                        _groundTilemap.SetTile(pos, _grassTiles[rng.Next(_grassTiles.Length)]);
                    }
                }
            }

            // Bridge over pond area (if path crosses water)
            for (int bx = 6; bx <= 12; bx++)
            {
                if (Mathf.Abs(-6) <= 1) continue;
                var bridgePos = new Vector3Int(bx, -5, 0);
                if (_groundTilemap.GetTile(bridgePos) == _waterTile)
                    _groundTilemap.SetTile(bridgePos, _bridgeTile);
            }

            var wallCollider = _wallTilemap.GetComponent<TilemapCollider2D>();
            if (wallCollider == null)
                _wallTilemap.gameObject.AddComponent<TilemapCollider2D>();
        }

        private bool IsBuilding(int x, int y)
        {
            // Small house/building in upper-left area
            if (x >= -12 && x <= -8 && y >= 5 && y <= 8)
            {
                bool isDoor = x == -10 && y == 5;
                return !isDoor;
            }
            // Another structure on the right
            if (x >= 8 && x <= 12 && y >= 3 && y <= 6)
            {
                bool isDoor = x == 10 && y == 3;
                return !isDoor;
            }
            return false;
        }

        public Vector2 GetBoundsMin() => new Vector2(-_width / 2f, -_height / 2f);
        public Vector2 GetBoundsMax() => new Vector2(_width / 2f, _height / 2f);
    }
}
