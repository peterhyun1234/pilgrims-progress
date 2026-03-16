using UnityEngine;
using PilgrimsProgress.Core;
using PilgrimsProgress.Player;
using PilgrimsProgress.Scene;

namespace PilgrimsProgress.Interaction
{
    public class PortalInteractable : Interactable
    {
        [Header("Portal")]
        [SerializeField] private string _targetSceneName;
        [SerializeField] private string _spawnPointId;
        [SerializeField] private bool _requiresQuestComplete;
        [SerializeField] private string _requiredQuestFlag;

        [Header("Visuals")]
        [SerializeField] private bool _autoTrigger;

        protected override void OnInteract(PlayerController player)
        {
            if (_requiresQuestComplete && !IsQuestComplete())
            {
                Debug.Log($"[Portal] Quest not complete: {_requiredQuestFlag}");
                return;
            }

            var sceneLoader = ServiceLocator.Get<SceneLoader>();
            if (sceneLoader != null)
            {
                PlayerPrefs.SetString("SpawnPoint", _spawnPointId);
                sceneLoader.LoadScene(_targetSceneName);
            }
        }

        private bool IsQuestComplete()
        {
            if (string.IsNullOrEmpty(_requiredQuestFlag)) return true;

            var ink = ServiceLocator.Get<Narrative.InkService>();
            if (ink == null) return true;

            var val = ink.GetVariable(_requiredQuestFlag);
            if (val is bool b) return b;
            return true;
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (!_autoTrigger) return;
            if (!other.CompareTag("Player")) return;

            var player = other.GetComponent<PlayerController>();
            if (player != null)
                Interact(player);
        }
    }
}
