using UnityEngine;
using UnityEngine.Tilemaps;
using PilgrimsProgress.Core;
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

        [Header("Theme")]
        [SerializeField] private MapTheme _theme = MapTheme.Fields;

        private Tile[] _grassTiles;
        private Tile _pathTile;
        private Tile _wallTile;
        private Tile _waterTile;
        private Tile[] _flowerTiles;
        private Tile _bridgeTile;

        private Tilemap _decorTilemap;

        private void Start()
        {
            if (_groundTilemap == null || _wallTilemap == null) return;
            GenerateTiles();
            EnsureDecorTilemap();
            GenerateMap();
        }

        private void EnsureDecorTilemap()
        {
            var grid = _groundTilemap.GetComponentInParent<Grid>();
            if (grid == null) return;
            var decorGo = new GameObject("DecorTilemap");
            decorGo.transform.SetParent(grid.transform, false);
            _decorTilemap = decorGo.AddComponent<Tilemap>();
            var renderer = decorGo.AddComponent<TilemapRenderer>();
            renderer.sortingOrder = 2;
        }

        private void GenerateTiles()
        {
            _grassTiles = new Tile[6];
            for (int i = 0; i < 6; i++)
                _grassTiles[i] = ProceduralAssets.CreateGrassTile(i, _theme);

            _pathTile = ProceduralAssets.CreatePathTile(_theme);
            _wallTile = ProceduralAssets.CreateWallTile(_theme);
            _waterTile = ProceduralAssets.CreateWaterTile();

            _flowerTiles = new Tile[3];
            _flowerTiles[0] = ProceduralAssets.CreateFlowerTile(new Color(0.85f, 0.35f, 0.35f), _theme);
            _flowerTiles[1] = ProceduralAssets.CreateFlowerTile(new Color(0.90f, 0.78f, 0.30f), _theme);
            _flowerTiles[2] = ProceduralAssets.CreateFlowerTile(new Color(0.55f, 0.40f, 0.80f), _theme);

            _bridgeTile = ProceduralAssets.CreateBridgeTile();
        }

        private void GenerateMap()
        {
            switch (_theme)
            {
                case MapTheme.City:
                    GenerateCityMap();
                    break;
                case MapTheme.DarkValley:
                    GenerateDarkValleyMap();
                    break;
                case MapTheme.Gate:
                    GenerateGateMap();
                    break;
                case MapTheme.Interior:
                    GenerateInteriorMap();
                    break;
                case MapTheme.Hill:
                    GenerateHillMap();
                    break;
                case MapTheme.Market:
                    GenerateMarketMap();
                    break;
                case MapTheme.Castle:
                    GenerateCastleMap();
                    break;
                case MapTheme.Celestial:
                    GenerateCelestialMap();
                    break;
                default:
                    GenerateFieldsMap();
                    break;
            }

            var wallCollider = _wallTilemap.GetComponent<TilemapCollider2D>();
            if (wallCollider == null)
                _wallTilemap.gameObject.AddComponent<TilemapCollider2D>();
        }

        private Tile RndGrass(System.Random rng) => _grassTiles[rng.Next(_grassTiles.Length)];
        private Tile RndFlower(System.Random rng) => _flowerTiles[rng.Next(_flowerTiles.Length)];

        private void PlaceDecorTile(int x, int y, Tile tile)
        {
            if (_decorTilemap != null)
                _decorTilemap.SetTile(new Vector3Int(x, y, 0), tile);
        }

        private void GenerateFieldsMap()
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

                    bool isMainPath = Mathf.Abs(y) <= 1;
                    bool isPathEdge = Mathf.Abs(y) == 2 && rng.Next(3) == 0;

                    float pondCx = 9f, pondCy = -6f, pondR = 3f;
                    float pdx = x - pondCx, pdy = y - pondCy;
                    bool isPond = pdx * pdx + pdy * pdy < pondR * pondR;
                    bool isPondEdge = !isPond && pdx * pdx + pdy * pdy < (pondR + 1) * (pondR + 1);

                    if (isMainPath)
                        _groundTilemap.SetTile(pos, _pathTile);
                    else if (isPathEdge)
                        _groundTilemap.SetTile(pos, RndFlower(rng));
                    else if (isPond)
                        _groundTilemap.SetTile(pos, _waterTile);
                    else if (isPondEdge)
                        _groundTilemap.SetTile(pos, RndFlower(rng));
                    else if (rng.Next(20) == 0)
                        _groundTilemap.SetTile(pos, RndFlower(rng));
                    else
                        _groundTilemap.SetTile(pos, RndGrass(rng));
                }
            }
        }

        private void GenerateCityMap()
        {
            int halfW = _width / 2;
            int halfH = _height / 2;
            var rng = new System.Random(11111);

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

                    bool isHorizontalRoad = Mathf.Abs(y) <= 1;
                    bool isVerticalRoad = Mathf.Abs(x) <= 1;
                    bool isSideStreet = (Mathf.Abs(y - 6) <= 0 && x > -8 && x < 8) ||
                                        (Mathf.Abs(y + 6) <= 0 && x > -8 && x < 8);

                    if (isHorizontalRoad || isVerticalRoad || isSideStreet)
                    {
                        _groundTilemap.SetTile(pos, _pathTile);
                    }
                    else if (IsCityBuilding(x, y, halfW, halfH))
                    {
                        _wallTilemap.SetTile(pos, _wallTile);
                    }
                    else
                    {
                        _groundTilemap.SetTile(pos, RndGrass(rng));
                    }
                }
            }
        }

        private bool IsCityBuilding(int x, int y, int halfW, int halfH)
        {
            if (x >= -10 && x <= -6 && y >= 3 && y <= 5 && !(x == -8 && y == 3)) return true;
            if (x >= 4 && x <= 8 && y >= 3 && y <= 5 && !(x == 6 && y == 3)) return true;
            if (x >= -10 && x <= -6 && y >= -5 && y <= -3 && !(x == -8 && y == -3)) return true;
            if (x >= 4 && x <= 8 && y >= -5 && y <= -3 && !(x == 6 && y == -3)) return true;
            if (x >= -14 && x <= -12 && y >= 8 && y <= 12 && !(x == -13 && y == 8)) return true;
            if (x >= 10 && x <= 14 && y >= 8 && y <= 12 && !(x == 12 && y == 8)) return true;
            return false;
        }

        private void GenerateDarkValleyMap()
        {
            int halfW = _width / 2;
            int halfH = _height / 2;
            var rng = new System.Random(66666);

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

                    bool isNarrowPath = Mathf.Abs(y) <= 1 + (int)(Mathf.Sin(x * 0.3f) * 0.5f);
                    bool isCliff = Mathf.Abs(y) > 3 + (int)(Mathf.Sin(x * 0.5f));

                    if (isNarrowPath)
                        _groundTilemap.SetTile(pos, _pathTile);
                    else if (isCliff)
                        _wallTilemap.SetTile(pos, _wallTile);
                    else
                        _groundTilemap.SetTile(pos, RndGrass(rng));
                }
            }
        }

        private void GenerateGateMap()
        {
            int halfW = _width / 2;
            int halfH = _height / 2;
            var rng = new System.Random(44444);

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

                    bool isGateWall = y == 2 && Mathf.Abs(x) > 1;
                    bool isPath = Mathf.Abs(x) <= 1;

                    if (isGateWall)
                        _wallTilemap.SetTile(pos, _wallTile);
                    else if (isPath)
                        _groundTilemap.SetTile(pos, _pathTile);
                    else if (rng.Next(15) == 0)
                        _groundTilemap.SetTile(pos, RndFlower(rng));
                    else
                        _groundTilemap.SetTile(pos, RndGrass(rng));
                }
            }
        }

        private void GenerateInteriorMap()
        {
            int halfW = _width / 2;
            int halfH = _height / 2;

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

                    bool isRoomWall = IsInteriorRoomWall(x, y);
                    if (isRoomWall)
                        _wallTilemap.SetTile(pos, _wallTile);
                    else
                        _groundTilemap.SetTile(pos, _pathTile);
                }
            }
        }

        private bool IsInteriorRoomWall(int x, int y)
        {
            bool hCorridor = Mathf.Abs(y) <= 1;
            bool vCorridor = Mathf.Abs(x) <= 1;
            if (hCorridor || vCorridor) return false;

            bool isInnerWallH = (y == 5 || y == -5) && Mathf.Abs(x) > 1;
            bool isInnerWallV = (x == 7 || x == -7) && Mathf.Abs(y) > 1;

            if (isInnerWallH)
            {
                if (Mathf.Abs(x - 5) <= 1 || Mathf.Abs(x + 5) <= 1) return false;
                return true;
            }
            if (isInnerWallV)
            {
                if (Mathf.Abs(y - 4) <= 1 || Mathf.Abs(y + 4) <= 1) return false;
                return true;
            }
            return false;
        }

        private void GenerateHillMap()
        {
            int halfW = _width / 2;
            int halfH = _height / 2;
            var rng = new System.Random(77777);

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

                    bool isSteepPath = Mathf.Abs(x) <= 2;
                    int sideCliffWidth = Mathf.Max(3, (int)(halfW * 0.4f - Mathf.Abs(y) * 0.3f));
                    bool isSideCliff = Mathf.Abs(x) > halfW - sideCliffWidth - 1;

                    if (isSteepPath)
                        _groundTilemap.SetTile(pos, _pathTile);
                    else if (isSideCliff)
                        _wallTilemap.SetTile(pos, _wallTile);
                    else if (rng.Next(6) == 0)
                        _groundTilemap.SetTile(pos, RndFlower(rng));
                    else
                        _groundTilemap.SetTile(pos, RndGrass(rng));
                }
            }
        }

        private void GenerateMarketMap()
        {
            int halfW = _width / 2;
            int halfH = _height / 2;
            var rng = new System.Random(10101);

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

                    bool isMainStreet = Mathf.Abs(y) <= 2;
                    bool isSideStreet = Mathf.Abs(x) <= 1 && Mathf.Abs(y) > 2;
                    bool isStall = IsMarketStall(x, y);

                    if (isMainStreet || isSideStreet)
                        _groundTilemap.SetTile(pos, _pathTile);
                    else if (isStall)
                        _wallTilemap.SetTile(pos, _wallTile);
                    else
                        _groundTilemap.SetTile(pos, RndGrass(rng));
                }
            }
        }

        private bool IsMarketStall(int x, int y)
        {
            if (y >= 4 && y <= 6 && (x >= -12 && x <= -10 || x >= -6 && x <= -4 ||
                x >= 4 && x <= 6 || x >= 10 && x <= 12))
                return true;
            if (y >= -6 && y <= -4 && (x >= -12 && x <= -10 || x >= -6 && x <= -4 ||
                x >= 4 && x <= 6 || x >= 10 && x <= 12))
                return true;
            return false;
        }

        private void GenerateCastleMap()
        {
            int halfW = _width / 2;
            int halfH = _height / 2;
            var rng = new System.Random(11911);

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

                    bool isCastleArea = x >= -8 && x <= 2 && y >= -5 && y <= 5;
                    bool isMountainArea = x >= 3 && y >= 3;

                    if (isCastleArea)
                    {
                        bool isCastleWall = (x == -8 || x == 2 || y == -5 || y == 5)
                            && !(x == -3 && y == -5);
                        if (isCastleWall)
                            _wallTilemap.SetTile(pos, _wallTile);
                        else
                            _groundTilemap.SetTile(pos, _pathTile);
                    }
                    else if (isMountainArea)
                    {
                        bool isMtnPath = Mathf.Abs(x - 8) <= 1;
                        if (isMtnPath)
                            _groundTilemap.SetTile(pos, _pathTile);
                        else if (rng.Next(4) == 0)
                            _groundTilemap.SetTile(pos, RndFlower(rng));
                        else
                            _groundTilemap.SetTile(pos, RndGrass(rng));
                    }
                    else
                    {
                        bool isPath = Mathf.Abs(y) <= 1 || Mathf.Abs(x) <= 1;
                        if (isPath)
                            _groundTilemap.SetTile(pos, _pathTile);
                        else
                            _groundTilemap.SetTile(pos, RndGrass(rng));
                    }
                }
            }
        }

        private void GenerateCelestialMap()
        {
            int halfW = _width / 2;
            int halfH = _height / 2;
            var rng = new System.Random(12121);

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

                    bool isPath = Mathf.Abs(y) <= 1;
                    bool isRiver = x >= 8 && x <= 10 && Mathf.Abs(y) > 1;
                    bool isRiverCrossing = x >= 8 && x <= 10 && Mathf.Abs(y) <= 1;

                    if (isRiver)
                        _groundTilemap.SetTile(pos, _waterTile);
                    else if (isRiverCrossing)
                        _groundTilemap.SetTile(pos, _bridgeTile);
                    else if (isPath)
                        _groundTilemap.SetTile(pos, _pathTile);
                    else if (rng.Next(4) == 0)
                        _groundTilemap.SetTile(pos, RndFlower(rng));
                    else
                        _groundTilemap.SetTile(pos, RndGrass(rng));
                }
            }
        }

        public Vector2 GetBoundsMin() => new Vector2(-_width / 2f, -_height / 2f);
        public Vector2 GetBoundsMax() => new Vector2(_width / 2f, _height / 2f);
    }
}
