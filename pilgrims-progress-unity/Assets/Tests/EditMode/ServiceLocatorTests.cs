using NUnit.Framework;
using PP.Core;

namespace PP.Tests
{
    public class ServiceLocatorTests
    {
        private class MockService { public int Value; }

        [SetUp]
        public void SetUp()
        {
            ServiceLocator.Reset();
        }

        [Test]
        public void Register_And_Get_ReturnsService()
        {
            var svc = new MockService { Value = 42 };
            ServiceLocator.Register(svc);
            var result = ServiceLocator.Get<MockService>();
            Assert.IsNotNull(result);
            Assert.AreEqual(42, result.Value);
        }

        [Test]
        public void TryGet_WhenNotRegistered_ReturnsFalse()
        {
            bool found = ServiceLocator.TryGet<MockService>(out var svc);
            Assert.IsFalse(found);
            Assert.IsNull(svc);
        }

        [Test]
        public void Unregister_RemovesService()
        {
            ServiceLocator.Register(new MockService());
            ServiceLocator.Unregister<MockService>();
            bool found = ServiceLocator.TryGet<MockService>(out _);
            Assert.IsFalse(found);
        }

        [Test]
        public void RegisterTransient_ClearedByClearTransients()
        {
            var svc = new MockService { Value = 99 };
            ServiceLocator.RegisterTransient(svc);
            Assert.IsNotNull(ServiceLocator.Get<MockService>());

            ServiceLocator.ClearTransients();
            bool found = ServiceLocator.TryGet<MockService>(out _);
            Assert.IsFalse(found);
        }

        [Test]
        public void Reset_ClearsAll()
        {
            ServiceLocator.Register(new MockService());
            ServiceLocator.Reset();
            bool found = ServiceLocator.TryGet<MockService>(out _);
            Assert.IsFalse(found);
        }
    }
}
