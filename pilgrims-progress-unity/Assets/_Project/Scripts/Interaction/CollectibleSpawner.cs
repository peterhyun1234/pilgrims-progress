using UnityEngine;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.Interaction
{
    public static class CollectibleSpawner
    {
        public static void SpawnForChapter(ChapterData data)
        {
            var rng = new System.Random(data.ChapterNumber * 137);
            int halfW = data.MapWidth / 2 - 4;
            int halfH = data.MapHeight / 2 - 4;

            var buffTypes = GetBuffsForChapter(data.ChapterNumber);
            var debuffTypes = GetDebuffsForChapter(data.ChapterNumber);

            int buffCount = Mathf.Clamp(data.MapWidth / 10 + 1, 2, 5);
            int debuffCount = Mathf.Clamp(data.MapWidth / 15, 1, 3);

            for (int i = 0; i < buffCount; i++)
            {
                var type = buffTypes[rng.Next(buffTypes.Length)];
                var pos = FindSafePosition(rng, halfW, halfH, data);
                SpawnItem(type, pos);
            }

            for (int i = 0; i < debuffCount; i++)
            {
                var type = debuffTypes[rng.Next(debuffTypes.Length)];
                var pos = FindSafePosition(rng, halfW, halfH, data);
                SpawnItem(type, pos);
            }
        }

        private static Vector3 FindSafePosition(System.Random rng, int halfW, int halfH, ChapterData data)
        {
            for (int attempt = 0; attempt < 20; attempt++)
            {
                float x = rng.Next(-halfW, halfW) + (float)rng.NextDouble();
                float y = rng.Next(-halfH, halfH) + (float)rng.NextDouble();
                var pos = new Vector3(x, y, 0);

                if (Vector3.Distance(pos, data.PlayerSpawn) < 3f) continue;
                if (Vector3.Distance(pos, data.ExitPosition) < 3f) continue;

                bool tooCloseToNPC = false;
                if (data.NPCs != null)
                {
                    foreach (var npc in data.NPCs)
                    {
                        if (Vector3.Distance(pos, npc.Position) < 2f)
                        {
                            tooCloseToNPC = true;
                            break;
                        }
                    }
                }
                if (tooCloseToNPC) continue;

                return pos;
            }
            return new Vector3(halfW * 0.5f, halfH * 0.5f, 0);
        }

        private static void SpawnItem(CollectibleType type, Vector3 position)
        {
            var go = new GameObject($"Collectible_{type}");
            go.transform.position = position;

            var sr = go.AddComponent<SpriteRenderer>();
            sr.sortingOrder = 8;

            go.AddComponent<CircleCollider2D>();
            var rb = go.AddComponent<Rigidbody2D>();
            rb.bodyType = RigidbodyType2D.Kinematic;

            var item = go.AddComponent<CollectibleItem>();
            item.Initialize(type);
        }

        private static CollectibleType[] GetBuffsForChapter(int chapter)
        {
            return chapter switch
            {
                1 => new[] { CollectibleType.FaithScroll, CollectibleType.PrayerCandle },
                2 => new[] { CollectibleType.CourageShield, CollectibleType.HealingFruit },
                3 => new[] { CollectibleType.WisdomBook, CollectibleType.FaithScroll },
                4 => new[] { CollectibleType.PrayerCandle, CollectibleType.FaithScroll },
                5 => new[] { CollectibleType.WisdomBook, CollectibleType.PrayerCandle },
                6 => new[] { CollectibleType.HealingFruit, CollectibleType.FaithScroll, CollectibleType.PrayerCandle },
                7 => new[] { CollectibleType.CourageShield, CollectibleType.WisdomBook },
                8 => new[] { CollectibleType.CourageShield, CollectibleType.HealingFruit },
                9 => new[] { CollectibleType.PrayerCandle, CollectibleType.FaithScroll },
                10 => new[] { CollectibleType.WisdomBook, CollectibleType.CourageShield },
                11 => new[] { CollectibleType.FaithScroll, CollectibleType.HealingFruit },
                12 => new[] { CollectibleType.HealingFruit, CollectibleType.PrayerCandle, CollectibleType.FaithScroll },
                _ => new[] { CollectibleType.FaithScroll }
            };
        }

        private static CollectibleType[] GetDebuffsForChapter(int chapter)
        {
            return chapter switch
            {
                1 => new[] { CollectibleType.BurdenStone },
                2 => new[] { CollectibleType.BurdenStone, CollectibleType.PoisonThorn },
                3 => new[] { CollectibleType.TemptationGem },
                4 => new[] { CollectibleType.BurdenStone },
                5 => new[] { CollectibleType.TemptationGem },
                6 => new CollectibleType[0],
                7 => new[] { CollectibleType.PoisonThorn },
                8 => new[] { CollectibleType.PoisonThorn, CollectibleType.BurdenStone },
                9 => new[] { CollectibleType.BurdenStone, CollectibleType.PoisonThorn },
                10 => new[] { CollectibleType.TemptationGem, CollectibleType.BurdenStone },
                11 => new[] { CollectibleType.BurdenStone },
                12 => new[] { CollectibleType.TemptationGem },
                _ => new[] { CollectibleType.BurdenStone }
            };
        }
    }
}
