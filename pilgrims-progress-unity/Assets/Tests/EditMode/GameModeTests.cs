using NUnit.Framework;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.Tests
{
    [TestFixture]
    public class GameModeEnumTests
    {
        [Test]
        public void GameMode_Has_Expected_Values()
        {
            Assert.AreEqual(0, (int)GameMode.Exploration);
            Assert.AreEqual(1, (int)GameMode.Dialogue);
            Assert.AreEqual(2, (int)GameMode.Challenge);
            Assert.AreEqual(3, (int)GameMode.Cutscene);
            Assert.AreEqual(4, (int)GameMode.Menu);
        }

        [Test]
        public void GameMode_All_Modes_Covered()
        {
            var values = System.Enum.GetValues(typeof(GameMode));
            Assert.AreEqual(5, values.Length);
        }
    }

    [TestFixture]
    public class GameStateEnumTests
    {
        [Test]
        public void GameState_Has_Expected_Values()
        {
            Assert.AreEqual(0, (int)GameState.Boot);
            Assert.AreEqual(1, (int)GameState.LanguageSelect);
            Assert.AreEqual(2, (int)GameState.MainMenu);
            Assert.AreEqual(3, (int)GameState.Prologue);
            Assert.AreEqual(4, (int)GameState.Gameplay);
            Assert.AreEqual(5, (int)GameState.Epilogue);
            Assert.AreEqual(6, (int)GameState.Paused);
        }

        [Test]
        public void GameState_All_States_Covered()
        {
            var values = System.Enum.GetValues(typeof(GameState));
            Assert.AreEqual(7, values.Length);
        }
    }
}
