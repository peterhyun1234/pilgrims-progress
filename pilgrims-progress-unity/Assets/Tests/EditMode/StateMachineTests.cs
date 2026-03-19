using NUnit.Framework;
using PP.StateMachine;

namespace PP.Tests
{
    public class StateMachineTests
    {
        private enum TestState { A, B, C }

        private class CountState : IState
        {
            public int EnterCount;
            public int ExitCount;
            public int UpdateCount;
            public void Enter() => EnterCount++;
            public void Update() => UpdateCount++;
            public void FixedUpdate() { }
            public void Exit() => ExitCount++;
        }

        [Test]
        public void Initialize_EntersStartState()
        {
            var sm = new StateMachine<TestState>();
            var stateA = new CountState();
            sm.AddState(TestState.A, stateA);
            sm.Initialize(TestState.A);

            Assert.AreEqual(TestState.A, sm.CurrentKey);
            Assert.AreEqual(1, stateA.EnterCount);
        }

        [Test]
        public void TryTransition_ValidTransition_Succeeds()
        {
            var sm = new StateMachine<TestState>();
            var a = new CountState();
            var b = new CountState();
            sm.AddState(TestState.A, a);
            sm.AddState(TestState.B, b);
            sm.AddTransition(TestState.A, TestState.B);
            sm.Initialize(TestState.A);

            bool result = sm.TryTransition(TestState.B);
            Assert.IsTrue(result);
            Assert.AreEqual(TestState.B, sm.CurrentKey);
            Assert.AreEqual(1, a.ExitCount);
            Assert.AreEqual(1, b.EnterCount);
        }

        [Test]
        public void TryTransition_InvalidTransition_Fails()
        {
            var sm = new StateMachine<TestState>();
            sm.AddState(TestState.A, new CountState());
            sm.AddState(TestState.C, new CountState());
            sm.AddTransition(TestState.A, TestState.B);
            sm.Initialize(TestState.A);

            bool result = sm.TryTransition(TestState.C);
            Assert.IsFalse(result);
            Assert.AreEqual(TestState.A, sm.CurrentKey);
        }

        [Test]
        public void TryTransition_SameState_ReturnsFalse()
        {
            var sm = new StateMachine<TestState>();
            sm.AddState(TestState.A, new CountState());
            sm.Initialize(TestState.A);

            bool result = sm.TryTransition(TestState.A);
            Assert.IsFalse(result);
        }

        [Test]
        public void AddBidirectional_AllowsBothDirections()
        {
            var sm = new StateMachine<TestState>();
            sm.AddState(TestState.A, new CountState());
            sm.AddState(TestState.B, new CountState());
            sm.AddBidirectional(TestState.A, TestState.B);
            sm.Initialize(TestState.A);

            Assert.IsTrue(sm.TryTransition(TestState.B));
            Assert.IsTrue(sm.TryTransition(TestState.A));
        }

        [Test]
        public void OnTransition_FiresEvent()
        {
            var sm = new StateMachine<TestState>();
            sm.AddState(TestState.A, new CountState());
            sm.AddState(TestState.B, new CountState());
            sm.AddTransition(TestState.A, TestState.B);
            sm.Initialize(TestState.A);

            TestState from = TestState.A, to = TestState.A;
            sm.OnTransition += (f, t) => { from = f; to = t; };

            sm.TryTransition(TestState.B);
            Assert.AreEqual(TestState.A, from);
            Assert.AreEqual(TestState.B, to);
        }

        [Test]
        public void Update_DelegatesToCurrentState()
        {
            var sm = new StateMachine<TestState>();
            var state = new CountState();
            sm.AddState(TestState.A, state);
            sm.Initialize(TestState.A);

            sm.Update();
            sm.Update();
            Assert.AreEqual(2, state.UpdateCount);
        }

        [Test]
        public void ForceTransition_BypassesRules()
        {
            var sm = new StateMachine<TestState>();
            sm.AddState(TestState.A, new CountState());
            sm.AddState(TestState.C, new CountState());
            sm.Initialize(TestState.A);

            sm.ForceTransition(TestState.C);
            Assert.AreEqual(TestState.C, sm.CurrentKey);
        }
    }
}
