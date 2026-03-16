using NUnit.Framework;
using PilgrimsProgress.Narrative;

namespace PilgrimsProgress.Tests
{
    [TestFixture]
    public class CharacterStatsTests
    {
        [Test]
        public void Default_Constructor_Sets_Expected_Values()
        {
            var stats = new CharacterStats();

            Assert.AreEqual(30, stats.Faith);
            Assert.AreEqual(20, stats.Courage);
            Assert.AreEqual(20, stats.Wisdom);
            Assert.AreEqual(80, stats.Burden);
        }

        [Test]
        public void Copy_Constructor_Creates_Independent_Copy()
        {
            var original = new CharacterStats();
            original.Faith = 50;
            original.Courage = 60;

            var copy = new CharacterStats(original);

            Assert.AreEqual(50, copy.Faith);
            Assert.AreEqual(60, copy.Courage);

            copy.Faith = 99;
            Assert.AreEqual(50, original.Faith, "Modifying copy should not affect original");
        }

        [Test]
        public void Constants_Are_Correct()
        {
            Assert.AreEqual(100, CharacterStats.MaxStatValue);
            Assert.AreEqual(0, CharacterStats.MinStatValue);
            Assert.AreEqual(100, CharacterStats.MaxBurden);
        }
    }
}
