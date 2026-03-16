using UnityEngine;
using UnityEngine.Tilemaps;
using PilgrimsProgress.Core;
using PilgrimsProgress.Interaction;
using PilgrimsProgress.Player;
using PilgrimsProgress.Narrative;

namespace PilgrimsProgress.Scene
{
    /// <summary>
    /// Builds a complete playable location from a LocationConfig at runtime.
    /// Creates tilemap, spawns NPCs/items/portals, sets up camera bounds.
    /// </summary>
    public class LocationBuilder : MonoBehaviour
    {
        [Header("Config")]
        [SerializeField] private LocationConfig _config;

        [Header("Ink Story")]
        [SerializeField] private TextAsset _inkJsonAsset;

        [Header("Audio")]
        [SerializeField] private Audio.AudioDataSO _audioData;

        private void Start()
        {
            if (_config == null) return;

            BuildTilemap();
            SpawnNPCs();
            SpawnPortals();
            SpawnItems();
            SetupPlayer();
            SetupInk();
            SetupAudio();
            SetupDialogueController();
            MarkVisited();

            var gm = GameManager.Instance;
            if (gm != null) gm.SetState(GameState.Gameplay);
        }

        private void BuildTilemap()
        {
            var gridGo = new GameObject("Grid");
            var grid = gridGo.AddComponent<Grid>();
            grid.cellSize = new Vector3(1, 1, 0);

            var groundGo = new GameObject("Ground");
            groundGo.transform.SetParent(gridGo.transform);
            var groundTm = groundGo.AddComponent<Tilemap>();
            groundGo.AddComponent<TilemapRenderer>().sortingOrder = 0;

            var wallGo = new GameObject("Walls");
            wallGo.transform.SetParent(gridGo.transform);
            var wallTm = wallGo.AddComponent<Tilemap>();
            wallGo.AddComponent<TilemapRenderer>().sortingOrder = 1;
            wallGo.AddComponent<TilemapCollider2D>();
            wallGo.AddComponent<Rigidbody2D>().bodyType = RigidbodyType2D.Static;

            var groundTile = CreateTile(_config.GroundColor);
            var wallTile = CreateTile(_config.WallColor);
            var pathTile = CreateTile(_config.PathColor);

            int w = _config.MapWidth;
            int h = _config.MapHeight;
            int halfW = w / 2;
            int halfH = h / 2;

            for (int x = -halfW; x < halfW; x++)
            {
                for (int y = -halfH; y < halfH; y++)
                {
                    var pos = new Vector3Int(x, y, 0);
                    bool isBorder = x == -halfW || x == halfW - 1 || y == -halfH || y == halfH - 1;

                    if (isBorder)
                    {
                        wallTm.SetTile(pos, wallTile);
                    }
                    else
                    {
                        bool isPath = Mathf.Abs(y) <= 1;
                        groundTm.SetTile(pos, isPath ? pathTile : groundTile);
                    }
                }
            }

            var cam = FindFirstObjectByType<TopDownCamera>();
            if (cam != null)
                cam.SetBounds(new Vector2(-halfW, -halfH), new Vector2(halfW, halfH));
        }

        private void SpawnNPCs()
        {
            if (_config.NPCs == null) return;

            foreach (var npc in _config.NPCs)
            {
                var go = new GameObject($"NPC_{npc.NpcId}");
                go.transform.position = (Vector3)npc.Position;
                go.layer = LayerMask.NameToLayer("Default");

                var npcComp = go.AddComponent<NPCInteractable>();
                SetPrivateField(npcComp, "_npcId", npc.NpcId);
                SetPrivateField(npcComp, "_inkKnotName", npc.InkKnotName);

                var setup = go.AddComponent<PlaceholderNPCSetup>();
                SetPrivateField(setup, "_npcColor", npc.SpriteColor);

                go.AddComponent<BoxCollider2D>();
            }
        }

        private void SpawnPortals()
        {
            if (_config.Portals == null) return;

            foreach (var portal in _config.Portals)
            {
                var go = new GameObject($"Portal_to_{portal.TargetLocationId}");
                go.transform.position = (Vector3)portal.Position;

                var portalComp = go.AddComponent<PortalInteractable>();
                SetPrivateField(portalComp, "_targetSceneName", portal.TargetLocationId);
                SetPrivateField(portalComp, "_spawnPointId", portal.SpawnPointId);
                SetPrivateField(portalComp, "_autoTrigger", portal.AutoTrigger);

                if (!string.IsNullOrEmpty(portal.RequiredQuestFlag))
                {
                    SetPrivateField(portalComp, "_requiresQuestComplete", true);
                    SetPrivateField(portalComp, "_requiredQuestFlag", portal.RequiredQuestFlag);
                }

                var sr = go.AddComponent<SpriteRenderer>();
                var tex = new Texture2D(16, 16);
                var pixels = new Color[256];
                for (int x = 0; x < 16; x++)
                    for (int y = 0; y < 16; y++)
                    {
                        bool isArch = (y >= 8 && (x <= 3 || x >= 12)) || (y >= 14) ||
                                     (y >= 0 && y < 8 && (x <= 1 || x >= 14));
                        pixels[y * 16 + x] = isArch ? new Color(0.5f, 0.4f, 0.3f) : Color.clear;
                    }
                tex.SetPixels(pixels);
                tex.Apply();
                tex.filterMode = FilterMode.Point;
                sr.sprite = Sprite.Create(tex, new Rect(0, 0, 16, 16), new Vector2(0.5f, 0.25f), 16f);
                sr.sortingOrder = 5;

                var bc = go.AddComponent<BoxCollider2D>();
                bc.isTrigger = portal.AutoTrigger;
                bc.size = new Vector2(1f, 1.5f);

                go.tag = "Portal";
            }
        }

        private void SpawnItems()
        {
            if (_config.Items == null) return;

            foreach (var item in _config.Items)
            {
                var go = new GameObject($"Item_{item.ItemId}");
                go.transform.position = (Vector3)item.Position;

                var itemComp = go.AddComponent<ItemInteractable>();
                SetPrivateField(itemComp, "_itemId", item.ItemId);
                SetPrivateField(itemComp, "_itemType", item.ItemType);

                var sr = go.AddComponent<SpriteRenderer>();
                var tex = new Texture2D(8, 8);
                var pixels = new Color[64];
                for (int i = 0; i < 64; i++)
                    pixels[i] = new Color(1f, 0.85f, 0.3f, 0.9f);
                tex.SetPixels(pixels);
                tex.Apply();
                tex.filterMode = FilterMode.Point;
                sr.sprite = Sprite.Create(tex, new Rect(0, 0, 8, 8), new Vector2(0.5f, 0.5f), 8f);
                sr.sortingOrder = 8;

                go.AddComponent<BoxCollider2D>().size = new Vector2(0.5f, 0.5f);
            }
        }

        private void SetupPlayer()
        {
            var existing = FindFirstObjectByType<PlayerController>();
            if (existing != null)
            {
                string spawnId = PlayerPrefs.GetString("SpawnPoint", "");
                var sp = !string.IsNullOrEmpty(spawnId) ? SpawnPoint.FindById(spawnId) : null;

                if (sp != null)
                    existing.transform.position = sp.transform.position;

                var cam = FindFirstObjectByType<TopDownCamera>();
                cam?.SetTarget(existing.transform);
                PlayerPrefs.DeleteKey("SpawnPoint");
                return;
            }

            var playerGo = new GameObject("Player");
            playerGo.tag = "Player";
            var rb = playerGo.AddComponent<Rigidbody2D>();
            rb.gravityScale = 0;
            rb.freezeRotation = true;
            rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            playerGo.AddComponent<BoxCollider2D>().size = new Vector2(0.6f, 0.4f);
            playerGo.AddComponent<SpriteRenderer>();
            playerGo.AddComponent<PlayerController>();
            playerGo.AddComponent<PlayerAnimator>();
            playerGo.AddComponent<PlaceholderPlayerSetup>();

            var cam2 = FindFirstObjectByType<TopDownCamera>();
            cam2?.SetTarget(playerGo.transform);
        }

        private void SetupInk()
        {
            var ink = ServiceLocator.Get<InkService>();
            if (ink == null || _inkJsonAsset == null) return;

            ink.LoadStory(_inkJsonAsset);

            if (!string.IsNullOrEmpty(_config.InkKnotName))
                ink.JumpToKnot(_config.InkKnotName);
        }

        private void SetupAudio()
        {
            var audio = ServiceLocator.Get<Audio.AudioManager>();
            if (audio == null) return;

            if (_audioData != null) _audioData.RegisterAll(audio);
            if (!string.IsNullOrEmpty(_config.BgmId)) audio.PlayBGM(_config.BgmId);
        }

        private void SetupDialogueController()
        {
            if (GetComponent<DialogueController>() != null) return;

            var dc = gameObject.AddComponent<DialogueController>();
            dc.OnBgmChanged += bgm => ServiceLocator.Get<Audio.AudioManager>()?.PlayBGM(bgm);
            dc.OnSfxRequested += sfx => ServiceLocator.Get<Audio.AudioManager>()?.PlaySFX(sfx);
            dc.OnStatChanged += (stat, delta) => ServiceLocator.Get<StatsManager>()?.ModifyStat(stat, delta);
            dc.OnBurdenChanged += delta => ServiceLocator.Get<StatsManager>()?.ModifyBurden(delta);
        }

        private void MarkVisited()
        {
            UI.WorldMapUI.MarkLocationVisited(_config.LocationId);
        }

        private Tile CreateTile(Color color)
        {
            var tile = ScriptableObject.CreateInstance<Tile>();
            var tex = new Texture2D(16, 16);
            var pixels = new Color[256];
            for (int i = 0; i < 256; i++) pixels[i] = color;
            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            tile.sprite = Sprite.Create(tex, new Rect(0, 0, 16, 16), new Vector2(0.5f, 0.5f), 16f);
            return tile;
        }

        private void SetPrivateField(object obj, string fieldName, object value)
        {
            var type = obj.GetType();
            while (type != null)
            {
                var field = type.GetField(fieldName,
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                if (field != null)
                {
                    field.SetValue(obj, value);
                    return;
                }
                type = type.BaseType;
            }
        }
    }
}
