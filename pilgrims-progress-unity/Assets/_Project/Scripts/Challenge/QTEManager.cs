using System;
using System.Collections;
using UnityEngine;
using PilgrimsProgress.Core;
using PilgrimsProgress.Narrative;

namespace PilgrimsProgress.Challenge
{
    public enum QTEResult { Success, Failure, Partial }

    /// <summary>
    /// Central manager for QTE (Quick Time Event) challenges.
    /// Listens for CHALLENGE tags from the Ink system and dispatches
    /// to the appropriate challenge handler.
    /// </summary>
    public class QTEManager : MonoBehaviour
    {
        public static QTEManager Instance { get; private set; }

        public event Action<string> OnChallengeStarted;
        public event Action<string, QTEResult> OnChallengeCompleted;

        [Header("Challenge Prefabs")]
        [SerializeField] private GameObject _arrowDodgePrefab;
        [SerializeField] private GameObject _timingAttackPrefab;
        [SerializeField] private GameObject _balanceChallengePrefab;
        [SerializeField] private GameObject _mashChallengePrefab;

        private BaseChallenge _activeChallenge;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            var ink = ServiceLocator.Get<InkService>();
            if (ink != null)
                ink.OnTagProcessed += HandleTag;
        }

        private void OnDestroy()
        {
            var ink = ServiceLocator.Get<InkService>();
            if (ink != null)
                ink.OnTagProcessed -= HandleTag;
        }

        private void HandleTag(InkTag tag)
        {
            if (tag.Type != "CHALLENGE") return;
            StartChallenge(tag.Value);
        }

        public void StartChallenge(string challengeId)
        {
            if (_activeChallenge != null) return;

            var modeManager = ServiceLocator.Get<GameModeManager>();
            modeManager?.EnterChallengeMode();

            OnChallengeStarted?.Invoke(challengeId);

            switch (challengeId)
            {
                case "slough_escape":
                    SpawnChallenge(_mashChallengePrefab, challengeId);
                    break;
                case "apollyon_arrows":
                    SpawnChallenge(_arrowDodgePrefab, challengeId);
                    break;
                case "apollyon_battle":
                    SpawnChallenge(_timingAttackPrefab, challengeId);
                    break;
                case "valley_balance":
                    SpawnChallenge(_balanceChallengePrefab, challengeId);
                    break;
                default:
                    Debug.LogWarning($"[QTEManager] Unknown challenge: {challengeId}");
                    EndChallenge(challengeId, QTEResult.Success);
                    break;
            }
        }

        private void SpawnChallenge(GameObject prefab, string challengeId)
        {
            if (prefab == null)
            {
                Debug.LogWarning($"[QTEManager] No prefab for challenge: {challengeId}, auto-passing");
                EndChallenge(challengeId, QTEResult.Success);
                return;
            }

            var go = Instantiate(prefab, transform);
            _activeChallenge = go.GetComponent<BaseChallenge>();

            if (_activeChallenge != null)
            {
                _activeChallenge.Initialize(challengeId, this);
            }
        }

        public void EndChallenge(string challengeId, QTEResult result)
        {
            if (_activeChallenge != null)
            {
                Destroy(_activeChallenge.gameObject);
                _activeChallenge = null;
            }

            OnChallengeCompleted?.Invoke(challengeId, result);

            var modeManager = ServiceLocator.Get<GameModeManager>();
            modeManager?.ExitChallengeMode();

            var ink = ServiceLocator.Get<InkService>();
            if (ink != null && ink.IsStoryActive)
            {
                ink.Continue();
            }
        }
    }
}
