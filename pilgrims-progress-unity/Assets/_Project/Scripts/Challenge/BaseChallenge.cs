using UnityEngine;

namespace PilgrimsProgress.Challenge
{
    /// <summary>
    /// Base class for all QTE/challenge mini-games.
    /// </summary>
    public abstract class BaseChallenge : MonoBehaviour
    {
        protected string ChallengeId { get; private set; }
        protected QTEManager Manager { get; private set; }

        public void Initialize(string challengeId, QTEManager manager)
        {
            ChallengeId = challengeId;
            Manager = manager;
            OnInitialize();
        }

        protected abstract void OnInitialize();

        protected void Complete(QTEResult result)
        {
            Manager.EndChallenge(ChallengeId, result);
        }

        protected void CompleteSuccess() => Complete(QTEResult.Success);
        protected void CompleteFail() => Complete(QTEResult.Failure);
    }
}
