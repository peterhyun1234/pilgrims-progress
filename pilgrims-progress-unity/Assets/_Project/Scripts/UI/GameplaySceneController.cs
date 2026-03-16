using UnityEngine;
using PilgrimsProgress.Core;
using PilgrimsProgress.Narrative;
using PilgrimsProgress.Player;

namespace PilgrimsProgress.UI
{
    /// <summary>
    /// Scene controller for top-down exploration gameplay levels.
    /// Loads the Ink story, wires up dialogue/audio/stats events,
    /// and manages the player spawn point.
    /// </summary>
    public class GameplaySceneController : MonoBehaviour
    {
        [Header("Ink Story")]
        [SerializeField] private TextAsset _inkJsonAsset;

        [Header("Player")]
        [SerializeField] private GameObject _playerPrefab;
        [SerializeField] private SpawnPoint _defaultSpawnPoint;

        [Header("UI Components")]
        [SerializeField] private ExplorationHUD _explorationHUD;

        [Header("Audio Data")]
        [SerializeField] private Audio.AudioDataSO _audioData;

        private InkService _inkService;
        private DialogueController _dialogueController;

        private void Start()
        {
            _inkService = ServiceLocator.Get<InkService>();

            var audioManager = ServiceLocator.TryGet<Audio.AudioManager>(out var am) ? am : null;
            if (audioManager != null && _audioData != null)
            {
                _audioData.RegisterAll(audioManager);
            }

            _dialogueController = gameObject.AddComponent<DialogueController>();
            _dialogueController.OnLocationChanged += HandleLocationChange;
            _dialogueController.OnBgmChanged += HandleBgmChange;
            _dialogueController.OnSfxRequested += HandleSfx;
            _dialogueController.OnStatChanged += HandleStatChange;
            _dialogueController.OnBurdenChanged += HandleBurdenChange;

            if (_inkJsonAsset != null && _inkService != null)
            {
                _inkService.LoadStory(_inkJsonAsset);
            }

            SpawnPlayer();

            var gm = GameManager.Instance;
            if (gm != null)
            {
                gm.SetState(GameState.Gameplay);
            }
        }

        private void SpawnPlayer()
        {
            if (_playerPrefab == null) return;

            string spawnId = PlayerPrefs.GetString("SpawnPoint", "");
            SpawnPoint spawnPoint = null;

            if (!string.IsNullOrEmpty(spawnId))
                spawnPoint = SpawnPoint.FindById(spawnId);

            if (spawnPoint == null)
                spawnPoint = _defaultSpawnPoint;

            Vector3 spawnPos = spawnPoint != null ? spawnPoint.transform.position : Vector3.zero;

            var existing = FindFirstObjectByType<PlayerController>();
            if (existing != null)
            {
                existing.transform.position = spawnPos;
                SetupCamera(existing.transform);
                return;
            }

            var playerGo = Instantiate(_playerPrefab, spawnPos, Quaternion.identity);
            playerGo.name = "Player";
            SetupCamera(playerGo.transform);

            PlayerPrefs.DeleteKey("SpawnPoint");
        }

        private void SetupCamera(Transform playerTransform)
        {
            var cam = FindFirstObjectByType<TopDownCamera>();
            if (cam != null)
            {
                cam.SetTarget(playerTransform);
            }
        }

        private void HandleLocationChange(string locationId)
        {
            if (_explorationHUD != null)
                _explorationHUD.SetLocationName(locationId);
        }

        private void HandleBgmChange(string bgmId)
        {
            var audioManager = ServiceLocator.TryGet<Audio.AudioManager>(out var am) ? am : null;
            audioManager?.PlayBGM(bgmId);
        }

        private void HandleSfx(string sfxId)
        {
            var audioManager = ServiceLocator.TryGet<Audio.AudioManager>(out var am) ? am : null;
            audioManager?.PlaySFX(sfxId);
        }

        private void HandleStatChange(string statName, int delta)
        {
            var stats = ServiceLocator.TryGet<StatsManager>(out var sm) ? sm : null;
            stats?.ModifyStat(statName, delta);
        }

        private void HandleBurdenChange(int delta)
        {
            var stats = ServiceLocator.TryGet<StatsManager>(out var sm) ? sm : null;
            stats?.ModifyBurden(delta);
        }

        private void OnDestroy()
        {
            if (_dialogueController != null)
            {
                _dialogueController.OnLocationChanged -= HandleLocationChange;
                _dialogueController.OnBgmChanged -= HandleBgmChange;
                _dialogueController.OnSfxRequested -= HandleSfx;
                _dialogueController.OnStatChanged -= HandleStatChange;
                _dialogueController.OnBurdenChanged -= HandleBurdenChange;
            }
        }
    }
}
