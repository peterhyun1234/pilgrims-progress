using NUnit.Framework;
using PilgrimsProgress.Challenge;

namespace PilgrimsProgress.Tests
{
    [TestFixture]
    public class QTETests
    {
        [Test]
        public void QTEResult_Has_Three_Values()
        {
            var values = System.Enum.GetValues(typeof(QTEResult));
            Assert.AreEqual(3, values.Length);
        }

        [Test]
        public void QTEResult_Success_Is_Zero()
        {
            Assert.AreEqual(0, (int)QTEResult.Success);
        }

        [Test]
        public void QTEResult_Failure_Is_One()
        {
            Assert.AreEqual(1, (int)QTEResult.Failure);
        }

        [Test]
        public void QTEResult_Partial_Is_Two()
        {
            Assert.AreEqual(2, (int)QTEResult.Partial);
        }
    }
}
