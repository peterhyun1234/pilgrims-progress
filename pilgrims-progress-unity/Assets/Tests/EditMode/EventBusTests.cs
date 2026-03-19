using NUnit.Framework;
using PP.Core;

namespace PP.Tests
{
    public class EventBusTests
    {
        private struct TestEvent : IEvent
        {
            public int Value;
        }

        [SetUp]
        public void SetUp()
        {
            EventBus.Clear();
        }

        [Test]
        public void Subscribe_And_Publish_InvokesHandler()
        {
            int received = 0;
            EventBus.Subscribe<TestEvent>(e => received = e.Value);
            EventBus.Publish(new TestEvent { Value = 7 });
            Assert.AreEqual(7, received);
        }

        [Test]
        public void Unsubscribe_StopsReceiving()
        {
            int count = 0;
            void Handler(TestEvent e) => count++;

            EventBus.Subscribe<TestEvent>(Handler);
            EventBus.Publish(new TestEvent());
            Assert.AreEqual(1, count);

            EventBus.Unsubscribe<TestEvent>(Handler);
            EventBus.Publish(new TestEvent());
            Assert.AreEqual(1, count);
        }

        [Test]
        public void Clear_RemovesAllListeners()
        {
            int count = 0;
            EventBus.Subscribe<TestEvent>(_ => count++);
            EventBus.Clear();
            EventBus.Publish(new TestEvent());
            Assert.AreEqual(0, count);
        }

        [Test]
        public void Multiple_Subscribers_AllReceive()
        {
            int a = 0, b = 0;
            EventBus.Subscribe<TestEvent>(_ => a++);
            EventBus.Subscribe<TestEvent>(_ => b++);
            EventBus.Publish(new TestEvent());
            Assert.AreEqual(1, a);
            Assert.AreEqual(1, b);
        }
    }
}
