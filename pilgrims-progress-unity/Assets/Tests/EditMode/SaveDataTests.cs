using NUnit.Framework;
using UnityEngine;
using PilgrimsProgress.Save;
using PilgrimsProgress.Narrative;

namespace PilgrimsProgress.Tests
{
    [TestFixture]
    public class SaveDataTests
    {
        [Test]
        public void Default_Constructor_Initializes_Fields()
        {
            var data = new SaveData();

            Assert.IsNotNull(data.SaveDate);
            Assert.IsNotNull(data.Stats);
            Assert.IsNotNull(data.BibleCardsUnlocked);
            Assert.AreEqual(20, data.BibleCardsUnlocked.Length);
            Assert.IsNotNull(data.CollectionEntries);
            Assert.AreEqual(0, data.CollectionEntries.Length);
        }

        [Test]
        public void Default_Stats_Match_CharacterStats_Defaults()
        {
            var data = new SaveData();

            Assert.AreEqual(30, data.Stats.Faith);
            Assert.AreEqual(20, data.Stats.Courage);
            Assert.AreEqual(20, data.Stats.Wisdom);
            Assert.AreEqual(80, data.Stats.Burden);
        }

        [Test]
        public void JsonUtility_Roundtrip_Preserves_Data()
        {
            var original = new SaveData
            {
                SlotId = "slot_1",
                Chapter = 3,
                PlayTimeSeconds = 1234.5f,
                Language = "ko",
                GuestSessionId = "test-guid-123"
            };
            original.Stats.Faith = 75;
            original.Stats.Burden = 10;
            original.BibleCardsUnlocked[0] = true;
            original.BibleCardsUnlocked[5] = true;

            string json = JsonUtility.ToJson(original);
            var restored = JsonUtility.FromJson<SaveData>(json);

            Assert.AreEqual("slot_1", restored.SlotId);
            Assert.AreEqual(3, restored.Chapter);
            Assert.AreEqual(1234.5f, restored.PlayTimeSeconds, 0.01f);
            Assert.AreEqual("ko", restored.Language);
            Assert.AreEqual("test-guid-123", restored.GuestSessionId);
            Assert.AreEqual(75, restored.Stats.Faith);
            Assert.AreEqual(10, restored.Stats.Burden);
            Assert.IsTrue(restored.BibleCardsUnlocked[0]);
            Assert.IsTrue(restored.BibleCardsUnlocked[5]);
            Assert.IsFalse(restored.BibleCardsUnlocked[1]);
        }

        [Test]
        public void SaveSlotInfo_Default_IsEmpty_True()
        {
            var info = new SaveSlotInfo("test_slot");

            Assert.AreEqual("test_slot", info.SlotId);
            Assert.IsTrue(info.IsEmpty);
        }

        [Test]
        public void SaveSlotInfo_JsonUtility_Roundtrip()
        {
            var original = new SaveSlotInfo("auto")
            {
                SaveDate = "2026-03-14 10:00:00",
                Chapter = 2,
                PlayTimeSeconds = 600f,
                IsEmpty = false
            };

            string json = JsonUtility.ToJson(original);
            var restored = JsonUtility.FromJson<SaveSlotInfo>(json);

            Assert.AreEqual("auto", restored.SlotId);
            Assert.AreEqual(2, restored.Chapter);
            Assert.AreEqual(600f, restored.PlayTimeSeconds, 0.01f);
            Assert.IsFalse(restored.IsEmpty);
        }
    }
}
