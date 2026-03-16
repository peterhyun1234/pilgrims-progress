using NUnit.Framework;

namespace PilgrimsProgress.Tests
{
    [TestFixture]
    public class PlayerSpeedTests
    {
        private const float BaseSpeed = 5f;
        private const float MinMultiplier = 0.3f;
        private const float BurdenFactor = 0.007f;

        private float CalculateSpeed(int burden)
        {
            float burdenMod = 1f - (burden * BurdenFactor);
            return BaseSpeed * UnityEngine.Mathf.Max(MinMultiplier, burdenMod);
        }

        [Test]
        public void Speed_At_Zero_Burden_Is_Full()
        {
            float speed = CalculateSpeed(0);
            Assert.AreEqual(BaseSpeed, speed, 0.01f);
        }

        [Test]
        public void Speed_At_Max_Burden_Is_Clamped_To_Min()
        {
            float speed = CalculateSpeed(100);
            Assert.AreEqual(BaseSpeed * MinMultiplier, speed, 0.01f);
        }

        [Test]
        public void Speed_At_Half_Burden_Is_Intermediate()
        {
            float speed = CalculateSpeed(50);
            float expected = BaseSpeed * (1f - 50 * BurdenFactor);
            Assert.AreEqual(expected, speed, 0.01f);
            Assert.Greater(speed, BaseSpeed * MinMultiplier);
            Assert.Less(speed, BaseSpeed);
        }

        [Test]
        public void Speed_Decreases_As_Burden_Increases()
        {
            float speed20 = CalculateSpeed(20);
            float speed50 = CalculateSpeed(50);
            float speed80 = CalculateSpeed(80);

            Assert.Greater(speed20, speed50);
            Assert.Greater(speed50, speed80);
        }

        [Test]
        public void Speed_Never_Below_Minimum()
        {
            for (int burden = 0; burden <= 200; burden += 10)
            {
                float speed = CalculateSpeed(burden);
                Assert.GreaterOrEqual(speed, BaseSpeed * MinMultiplier);
            }
        }
    }
}
