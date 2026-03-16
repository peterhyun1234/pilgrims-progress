using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.Tests
{
    [TestFixture]
    public class ServiceLocatorTests
    {
        private interface ITestService { string Name { get; } }
        private class TestServiceA : ITestService { public string Name => "A"; }
        private class TestServiceB : ITestService { public string Name => "B"; }

        [SetUp]
        public void SetUp()
        {
            ServiceLocator.Reset();
        }

        [TearDown]
        public void TearDown()
        {
            ServiceLocator.Reset();
        }

        [Test]
        public void Register_And_Get_Returns_Same_Instance()
        {
            var service = new TestServiceA();
            ServiceLocator.Register<ITestService>(service);

            var retrieved = ServiceLocator.Get<ITestService>();

            Assert.AreSame(service, retrieved);
        }

        [Test]
        public void Get_Unregistered_Service_Returns_Null()
        {
            LogAssert.Expect(LogType.Error, new System.Text.RegularExpressions.Regex("Service not found"));
            var result = ServiceLocator.Get<ITestService>();

            Assert.IsNull(result);
        }

        [Test]
        public void TryGet_Registered_Returns_True_And_Service()
        {
            var service = new TestServiceA();
            ServiceLocator.Register<ITestService>(service);

            bool found = ServiceLocator.TryGet<ITestService>(out var retrieved);

            Assert.IsTrue(found);
            Assert.AreSame(service, retrieved);
        }

        [Test]
        public void TryGet_Unregistered_Returns_False_And_Null()
        {
            bool found = ServiceLocator.TryGet<ITestService>(out var retrieved);

            Assert.IsFalse(found);
            Assert.IsNull(retrieved);
        }

        [Test]
        public void Register_Overwrite_Uses_Latest()
        {
            var first = new TestServiceA();
            var second = new TestServiceA();

            ServiceLocator.Register<ITestService>(first);
            ServiceLocator.Register<ITestService>(second);

            var retrieved = ServiceLocator.Get<ITestService>();

            Assert.AreSame(second, retrieved);
        }

        [Test]
        public void Reset_Clears_All_Services()
        {
            ServiceLocator.Register<ITestService>(new TestServiceA());

            ServiceLocator.Reset();

            LogAssert.Expect(LogType.Error, new System.Text.RegularExpressions.Regex("Service not found"));
            Assert.IsNull(ServiceLocator.Get<ITestService>());
        }

        [Test]
        public void Register_Multiple_Types_Independently()
        {
            var serviceA = new TestServiceA();
            var serviceB = new TestServiceB();

            ServiceLocator.Register(serviceA);
            ServiceLocator.Register(serviceB);

            Assert.AreSame(serviceA, ServiceLocator.Get<TestServiceA>());
            Assert.AreSame(serviceB, ServiceLocator.Get<TestServiceB>());
        }
    }
}
