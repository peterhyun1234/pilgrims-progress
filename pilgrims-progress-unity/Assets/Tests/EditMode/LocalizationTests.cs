using NUnit.Framework;
using System.Collections.Generic;
using System.Reflection;

namespace PilgrimsProgress.Tests
{
    [TestFixture]
    public class LocalizationTests
    {
        /// <summary>
        /// Tests the localization string table logic without MonoBehaviour.
        /// Uses a lightweight helper to simulate LocalizationManager.Get().
        /// </summary>
        private Dictionary<string, Dictionary<string, string>> _tables;
        private string _currentLang;

        [SetUp]
        public void Setup()
        {
            _tables = new Dictionary<string, Dictionary<string, string>>
            {
                {
                    "ko", new Dictionary<string, string>
                    {
                        { "game_title", "천로역정" },
                        { "menu_new_game", "새 게임" },
                        { "stat_faith", "믿음" },
                        { "prologue_line1", "나는 꿈을 꾸었노라..." }
                    }
                },
                {
                    "en", new Dictionary<string, string>
                    {
                        { "game_title", "The Pilgrim's Progress" },
                        { "menu_new_game", "New Game" },
                        { "stat_faith", "Faith" },
                        { "prologue_line1", "I dreamed a dream..." }
                    }
                }
            };
            _currentLang = "ko";
        }

        private string Get(string key)
        {
            if (_tables.TryGetValue(_currentLang, out var table))
            {
                if (table.TryGetValue(key, out var value))
                    return value;
            }
            if (_currentLang != "en" && _tables.TryGetValue("en", out var fallback))
            {
                if (fallback.TryGetValue(key, out var value))
                    return value;
            }
            return $"[{key}]";
        }

        [Test]
        public void Get_Korean_Returns_Korean_String()
        {
            _currentLang = "ko";
            Assert.AreEqual("천로역정", Get("game_title"));
        }

        [Test]
        public void Get_English_Returns_English_String()
        {
            _currentLang = "en";
            Assert.AreEqual("The Pilgrim's Progress", Get("game_title"));
        }

        [Test]
        public void Get_Missing_Key_Returns_Bracketed_Key()
        {
            Assert.AreEqual("[nonexistent_key]", Get("nonexistent_key"));
        }

        [Test]
        public void Get_Korean_Missing_Key_Falls_Back_To_English()
        {
            _tables["en"]["only_in_english"] = "English Only";
            _currentLang = "ko";
            Assert.AreEqual("English Only", Get("only_in_english"));
        }

        [Test]
        public void Get_English_Missing_Key_Does_Not_Fallback()
        {
            _tables["ko"]["only_in_korean"] = "한국어 전용";
            _currentLang = "en";
            Assert.AreEqual("[only_in_korean]", Get("only_in_korean"));
        }

        [Test]
        public void Language_Switch_Changes_Output()
        {
            _currentLang = "ko";
            var korean = Get("menu_new_game");
            _currentLang = "en";
            var english = Get("menu_new_game");

            Assert.AreEqual("새 게임", korean);
            Assert.AreEqual("New Game", english);
            Assert.AreNotEqual(korean, english);
        }

        [Test]
        public void All_Korean_Keys_Have_English_Counterparts()
        {
            foreach (var key in _tables["ko"].Keys)
            {
                Assert.IsTrue(_tables["en"].ContainsKey(key),
                    $"Korean key '{key}' should have an English counterpart");
            }
        }

        [Test]
        public void All_English_Keys_Have_Korean_Counterparts()
        {
            foreach (var key in _tables["en"].Keys)
            {
                Assert.IsTrue(_tables["ko"].ContainsKey(key),
                    $"English key '{key}' should have a Korean counterpart");
            }
        }

        [Test]
        public void Unsupported_Language_Falls_Back_To_English()
        {
            _currentLang = "fr";
            Assert.AreEqual("The Pilgrim's Progress", Get("game_title"));
        }

        [Test]
        public void Get_Stats_Returns_Localized_Names()
        {
            _currentLang = "ko";
            Assert.AreEqual("믿음", Get("stat_faith"));

            _currentLang = "en";
            Assert.AreEqual("Faith", Get("stat_faith"));
        }

        [Test]
        public void Get_Prologue_Returns_Localized_Lines()
        {
            _currentLang = "ko";
            Assert.IsTrue(Get("prologue_line1").Contains("꿈"));

            _currentLang = "en";
            Assert.IsTrue(Get("prologue_line1").Contains("dream"));
        }
    }
}
