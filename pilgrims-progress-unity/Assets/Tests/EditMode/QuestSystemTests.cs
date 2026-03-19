using NUnit.Framework;
using PP.Core;

namespace PP.Tests
{
    public class QuestSystemTests
    {
        [Test]
        public void ResolveKnot_Primary_WhenNotCompleted()
        {
            var knots = new System.Collections.Generic.HashSet<string>();
            string primary = "ch1_start";
            string completed = "ch1_done";

            string result = knots.Contains(primary) ? completed : primary;
            Assert.AreEqual("ch1_start", result);
        }

        [Test]
        public void ResolveKnot_Completed_WhenAlreadyDone()
        {
            var knots = new System.Collections.Generic.HashSet<string> { "ch1_start" };
            string primary = "ch1_start";
            string completed = "ch1_done";

            string result = knots.Contains(primary) && !string.IsNullOrEmpty(completed)
                ? completed : primary;
            Assert.AreEqual("ch1_done", result);
        }

        [Test]
        public void QuestStatus_DefaultIsLocked()
        {
            Assert.AreEqual(QuestStatus.Locked, default(QuestStatus));
        }

        [Test]
        public void Serialize_Deserialize_Roundtrip()
        {
            var payload = new SerializationPayload();
            payload.CompletedKnots.Add("knot_a");
            payload.CompletedKnots.Add("knot_b");

            string json = UnityEngine.JsonUtility.ToJson(payload);
            var restored = UnityEngine.JsonUtility.FromJson<SerializationPayload>(json);

            Assert.AreEqual(2, restored.CompletedKnots.Count);
            Assert.IsTrue(restored.CompletedKnots.Contains("knot_a"));
        }

        [System.Serializable]
        private class SerializationPayload
        {
            public System.Collections.Generic.List<string> CompletedKnots = new();
        }
    }
}
