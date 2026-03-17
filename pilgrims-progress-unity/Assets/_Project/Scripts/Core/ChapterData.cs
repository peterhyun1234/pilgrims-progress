using UnityEngine;

namespace PilgrimsProgress.Core
{
    [System.Serializable]
    public struct NPCSpawnData
    {
        public string Name;
        public string NpcId;
        public string InkKnot;
        public Vector3 Position;
        public int Order;
        public bool Required;

        public NPCSpawnData(string name, string npcId, string inkKnot, Vector3 position, int order = 0, bool required = true)
        {
            Name = name;
            NpcId = npcId;
            InkKnot = inkKnot;
            Position = position;
            Order = order;
            Required = required;
        }
    }

    [System.Serializable]
    public class ChapterData
    {
        public int ChapterNumber;
        public string NameKR;
        public string NameEN;
        public string InkKnot;
        public int MapWidth;
        public int MapHeight;
        public Vector3 PlayerSpawn;
        public Vector3 ExitPosition;
        public NPCSpawnData[] NPCs;
        public MapTheme Theme;
    }

    public enum MapTheme
    {
        City,
        Fields,
        Village,
        Gate,
        Interior,
        Hill,
        DarkValley,
        Market,
        Castle,
        Enchanted,
        Celestial
    }

    public static class ChapterDatabase
    {
        public static ChapterData Get(int chapter)
        {
            switch (chapter)
            {
                case 1: return Chapter1();
                case 2: return Chapter2();
                case 3: return Chapter3();
                case 4: return Chapter4();
                case 5: return Chapter5();
                case 6: return Chapter6();
                case 7: return Chapter7();
                case 8: return Chapter8();
                case 9: return Chapter9();
                case 10: return Chapter10();
                case 11: return Chapter11();
                case 12: return Chapter12();
                default: return Chapter1();
            }
        }

        private static ChapterData Chapter1() => new ChapterData
        {
            ChapterNumber = 1,
            NameKR = "멸망의 도시",
            NameEN = "City of Destruction",
            InkKnot = "ch01_city_of_destruction",
            MapWidth = 40, MapHeight = 30,
            PlayerSpawn = new Vector3(0, -8, 0),
            ExitPosition = new Vector3(0, 13, 0),
            Theme = MapTheme.City,
            NPCs = new[]
            {
                new NPCSpawnData("Evangelist", "evangelist", "ch01_evangelist", new Vector3(5, 0, 0), 1),
                new NPCSpawnData("Obstinate", "obstinate", "ch01_obstinate", new Vector3(-5, 3, 0), 2),
                new NPCSpawnData("Pliable", "pliable", "ch01_pliable", new Vector3(-3, 5, 0), 3),
            }
        };

        private static ChapterData Chapter2() => new ChapterData
        {
            ChapterNumber = 2,
            NameKR = "낙심의 늪",
            NameEN = "Slough of Despond",
            InkKnot = "ch02_slough_of_despond",
            MapWidth = 50, MapHeight = 25,
            PlayerSpawn = new Vector3(-20, 0, 0),
            ExitPosition = new Vector3(22, 0, 0),
            Theme = MapTheme.Fields,
            NPCs = new[]
            {
                new NPCSpawnData("Help", "help", "ch02_help", new Vector3(0, 3, 0), 1),
            }
        };

        private static ChapterData Chapter3() => new ChapterData
        {
            ChapterNumber = 3,
            NameKR = "세상지혜씨",
            NameEN = "Mr. Worldly Wiseman",
            InkKnot = "ch03_worldly_wiseman",
            MapWidth = 35, MapHeight = 30,
            PlayerSpawn = new Vector3(-12, -10, 0),
            ExitPosition = new Vector3(12, 12, 0),
            Theme = MapTheme.Village,
            NPCs = new[]
            {
                new NPCSpawnData("Worldly Wiseman", "worldly_wiseman", "ch03_worldly_wiseman", new Vector3(-3, 0, 0), 1),
                new NPCSpawnData("Evangelist", "evangelist", "ch03_evangelist_return", new Vector3(5, 5, 0), 2),
            }
        };

        private static ChapterData Chapter4() => new ChapterData
        {
            ChapterNumber = 4,
            NameKR = "좁은 문",
            NameEN = "The Wicket Gate",
            InkKnot = "ch04_wicket_gate",
            MapWidth = 25, MapHeight = 20,
            PlayerSpawn = new Vector3(0, -7, 0),
            ExitPosition = new Vector3(0, 8, 0),
            Theme = MapTheme.Gate,
            NPCs = new[]
            {
                new NPCSpawnData("Good-will", "goodwill", "ch04_goodwill", new Vector3(0, 3, 0), 1),
            }
        };

        private static ChapterData Chapter5() => new ChapterData
        {
            ChapterNumber = 5,
            NameKR = "해석자의 집",
            NameEN = "Interpreter's House",
            InkKnot = "ch05_interpreter",
            MapWidth = 30, MapHeight = 25,
            PlayerSpawn = new Vector3(-10, -8, 0),
            ExitPosition = new Vector3(12, 10, 0),
            Theme = MapTheme.Interior,
            NPCs = new[]
            {
                new NPCSpawnData("Interpreter", "interpreter", "ch05_interpreter", new Vector3(0, 3, 0), 1),
            }
        };

        private static ChapterData Chapter6() => new ChapterData
        {
            ChapterNumber = 6,
            NameKR = "십자가",
            NameEN = "The Cross",
            InkKnot = "ch06_cross",
            MapWidth = 30, MapHeight = 30,
            PlayerSpawn = new Vector3(0, -12, 0),
            ExitPosition = new Vector3(0, 12, 0),
            Theme = MapTheme.Hill,
            NPCs = new[]
            {
                new NPCSpawnData("Shining One 1", "shining1", "ch06_shining_ones", new Vector3(-2, 6, 0), 1),
                new NPCSpawnData("Shining One 2", "shining2", "ch06_shining_ones", new Vector3(0, 7, 0), 2, false),
                new NPCSpawnData("Shining One 3", "shining3", "ch06_shining_ones", new Vector3(2, 6, 0), 3, false),
            }
        };

        private static ChapterData Chapter7() => new ChapterData
        {
            ChapterNumber = 7,
            NameKR = "어려움의 언덕",
            NameEN = "Hill Difficulty & Palace Beautiful",
            InkKnot = "ch07_hill_difficulty",
            MapWidth = 40, MapHeight = 35,
            PlayerSpawn = new Vector3(0, -14, 0),
            ExitPosition = new Vector3(0, 14, 0),
            Theme = MapTheme.Hill,
            NPCs = new[]
            {
                new NPCSpawnData("Prudence", "prudence", "ch07_prudence", new Vector3(-3, 8, 0), 1),
                new NPCSpawnData("Piety", "piety", "ch07_piety", new Vector3(0, 10, 0), 2),
                new NPCSpawnData("Charity", "charity", "ch07_charity", new Vector3(3, 8, 0), 3),
            }
        };

        private static ChapterData Chapter8() => new ChapterData
        {
            ChapterNumber = 8,
            NameKR = "굴욕의 골짜기",
            NameEN = "Valley of Humiliation",
            InkKnot = "ch08_apollyon",
            MapWidth = 35, MapHeight = 20,
            PlayerSpawn = new Vector3(-14, 0, 0),
            ExitPosition = new Vector3(14, 0, 0),
            Theme = MapTheme.DarkValley,
            NPCs = new[]
            {
                new NPCSpawnData("Apollyon", "apollyon", "ch08_apollyon_battle", new Vector3(0, 0, 0), 1),
            }
        };

        private static ChapterData Chapter9() => new ChapterData
        {
            ChapterNumber = 9,
            NameKR = "사망의 골짜기",
            NameEN = "Valley of Shadow of Death",
            InkKnot = "ch09_shadow_of_death",
            MapWidth = 50, MapHeight = 15,
            PlayerSpawn = new Vector3(-22, 0, 0),
            ExitPosition = new Vector3(22, 0, 0),
            Theme = MapTheme.DarkValley,
            NPCs = new NPCSpawnData[0]
        };

        private static ChapterData Chapter10() => new ChapterData
        {
            ChapterNumber = 10,
            NameKR = "허영의 시장",
            NameEN = "Vanity Fair",
            InkKnot = "ch10_vanity_fair",
            MapWidth = 40, MapHeight = 30,
            PlayerSpawn = new Vector3(-16, -10, 0),
            ExitPosition = new Vector3(16, 12, 0),
            Theme = MapTheme.Market,
            NPCs = new[]
            {
                new NPCSpawnData("Faithful", "faithful", "ch10_faithful", new Vector3(-5, 0, 0), 1),
                new NPCSpawnData("By-ends", "byends", "ch10_byends", new Vector3(3, -3, 0), 2),
                new NPCSpawnData("Hopeful", "hopeful", "ch10_hopeful", new Vector3(8, 5, 0), 3),
            }
        };

        private static ChapterData Chapter11() => new ChapterData
        {
            ChapterNumber = 11,
            NameKR = "의심의 성",
            NameEN = "Doubting Castle & Delectable Mountains",
            InkKnot = "ch11_doubting_castle",
            MapWidth = 35, MapHeight = 35,
            PlayerSpawn = new Vector3(-12, -12, 0),
            ExitPosition = new Vector3(12, 14, 0),
            Theme = MapTheme.Castle,
            NPCs = new[]
            {
                new NPCSpawnData("Giant Despair", "giant_despair", "ch11_giant_despair", new Vector3(-5, 0, 0), 1),
                new NPCSpawnData("Shepherd 1", "shepherd1", "ch11_shepherds", new Vector3(5, 10, 0), 2),
                new NPCSpawnData("Shepherd 2", "shepherd2", "ch11_shepherds", new Vector3(7, 10, 0), 3, false),
            }
        };

        private static ChapterData Chapter12() => new ChapterData
        {
            ChapterNumber = 12,
            NameKR = "천상의 도시",
            NameEN = "Enchanted Ground to Celestial City",
            InkKnot = "ch12_celestial_city",
            MapWidth = 45, MapHeight = 30,
            PlayerSpawn = new Vector3(-18, 0, 0),
            ExitPosition = new Vector3(18, 12, 0),
            Theme = MapTheme.Celestial,
            NPCs = new[]
            {
                new NPCSpawnData("Hopeful", "hopeful", "ch12_hopeful_companion", new Vector3(-16, 1, 0), 1),
                new NPCSpawnData("Ignorance", "ignorance", "ch12_ignorance", new Vector3(-8, -3, 0), 2),
            }
        };
    }
}
