using NUnit.Framework;
using PilgrimsProgress.Interaction;

namespace PilgrimsProgress.Tests
{
    [TestFixture]
    public class InteractionTests
    {
        [Test]
        public void Interactable_SingleUse_BlocksSecondInteraction()
        {
            var go = new UnityEngine.GameObject("TestInteractable");
            var interactable = go.AddComponent<TestInteractable>();
            interactable.SetSingleUse(true);

            var playerGo = new UnityEngine.GameObject("Player");
            var playerRb = playerGo.AddComponent<UnityEngine.Rigidbody2D>();
            var player = playerGo.AddComponent<Player.PlayerController>();

            interactable.Interact(player);
            Assert.AreEqual(1, interactable.InteractCount);

            interactable.Interact(player);
            Assert.AreEqual(1, interactable.InteractCount, "Single-use should block second interaction");

            UnityEngine.Object.DestroyImmediate(go);
            UnityEngine.Object.DestroyImmediate(playerGo);
        }

        [Test]
        public void Interactable_MultiUse_AllowsRepeatedInteraction()
        {
            var go = new UnityEngine.GameObject("TestInteractable");
            var interactable = go.AddComponent<TestInteractable>();
            interactable.SetSingleUse(false);

            var playerGo = new UnityEngine.GameObject("Player");
            var playerRb = playerGo.AddComponent<UnityEngine.Rigidbody2D>();
            var player = playerGo.AddComponent<Player.PlayerController>();

            interactable.Interact(player);
            interactable.Interact(player);
            interactable.Interact(player);
            Assert.AreEqual(3, interactable.InteractCount);

            UnityEngine.Object.DestroyImmediate(go);
            UnityEngine.Object.DestroyImmediate(playerGo);
        }

        [Test]
        public void Interactable_ResetUsage_AllowsReuse()
        {
            var go = new UnityEngine.GameObject("TestInteractable");
            var interactable = go.AddComponent<TestInteractable>();
            interactable.SetSingleUse(true);

            var playerGo = new UnityEngine.GameObject("Player");
            var playerRb = playerGo.AddComponent<UnityEngine.Rigidbody2D>();
            var player = playerGo.AddComponent<Player.PlayerController>();

            interactable.Interact(player);
            Assert.AreEqual(1, interactable.InteractCount);
            Assert.IsFalse(interactable.CanInteract);

            interactable.ResetUsage();
            Assert.IsTrue(interactable.CanInteract);

            interactable.Interact(player);
            Assert.AreEqual(2, interactable.InteractCount);

            UnityEngine.Object.DestroyImmediate(go);
            UnityEngine.Object.DestroyImmediate(playerGo);
        }
    }

    public class TestInteractable : Interactable
    {
        public int InteractCount { get; private set; }

        protected override void OnInteract(Player.PlayerController player)
        {
            InteractCount++;
        }

        public void SetSingleUse(bool singleUse)
        {
            var field = typeof(Interactable).GetField("_singleUse",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            field?.SetValue(this, singleUse);
        }
    }
}
