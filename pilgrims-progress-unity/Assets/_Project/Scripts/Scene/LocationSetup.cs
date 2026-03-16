using UnityEngine;
using PilgrimsProgress.Core;
using PilgrimsProgress.Narrative;
using PilgrimsProgress.Player;

namespace PilgrimsProgress.Scene
{
    /// <summary>
    /// Placed on each location scene root. Handles scene-specific initialization:
    /// loading the correct Ink story, setting location BGM, configuring camera bounds,
    /// and spawning the player at the correct spawn point.
    /// </summary>
    public class LocationSetup : MonoBehaviour
    {
        [Header("Location Info")]
        [SerializeField] private string _locationId;
        [SerializeField] private string _locationNameKo;
        [SerializeField] private string _locationNameEn;

        [Header("Ink")]
        [SerializeField] private TextAsset _inkJsonAsset;
        [SerializeField] private string _startKnot;

        [Header("Audio")]
        [SerializeField] private string _bgmId;
        [SerializeField] private Audio.AudioDataSO _audioData;

        [Header("Camera Bounds")]
        [SerializeField] private Vector2 _boundsMin;
        [SerializeField] private Vector2 _boundsMax;

        [Header("Player")]
        [SerializeField] private GameObject _playerPrefab;
        [SerializeField] private SpawnPoint _defaultSpawnPoint;

        private void Start()
        {
            SetupInk();
            SetupAudio();
            SpawnPlayer();
            SetupCamera();
            SetupDialogueController();
            ShowLocationName();
        }

        private void SetupInk()
        {
            var ink = ServiceLocator.Get<InkService>();
            if (ink == null || _inkJsonAsset == null) return;

            ink.LoadStory(_inkJsonAsset);

            if (!string.IsNullOrEmpty(_startKnot))
                ink.JumpToKnot(_startKnot);
        }

        private void SetupAudio()
        {
            var audio = ServiceLocator.Get<Audio.AudioManager>();
            if (audio == null) return;

            if (_audioData != null)
                _audioData.RegisterAll(audio);

            if (!string.IsNullOrEmpty(_bgmId))
                audio.PlayBGM(_bgmId);
        }

        private void SpawnPlayer()
        {
            if (_playerPrefab == null) return;

            string spawnId = PlayerPrefs.GetString("SpawnPoint", "");
            SpawnPoint sp = null;

            if (!string.IsNullOrEmpty(spawnId))
                sp = SpawnPoint.FindById(spawnId);

            if (sp == null)
                sp = _defaultSpawnPoint;

            Vector3 pos = sp != null ? sp.transform.position : Vector3.zero;

            var existing = FindFirstObjectByType<PlayerController>();
            if (existing != null)
            {
                existing.transform.position = pos;
                return;
            }

            Instantiate(_playerPrefab, pos, Quaternion.identity);
            PlayerPrefs.DeleteKey("SpawnPoint");
        }

        private void SetupCamera()
        {
            var cam = FindFirstObjectByType<TopDownCamera>();
            if (cam == null) return;

            var player = FindFirstObjectByType<PlayerController>();
            if (player != null)
                cam.SetTarget(player.transform);

            if (_boundsMin != _boundsMax)
                cam.SetBounds(_boundsMin, _boundsMax);
        }

        private void SetupDialogueController()
        {
            if (GetComponent<DialogueController>() == null)
            {
                var dc = gameObject.AddComponent<DialogueController>();
                dc.OnBgmChanged += bgm =>
                {
                    var audio = ServiceLocator.Get<Audio.AudioManager>();
                    audio?.PlayBGM(bgm);
                };
                dc.OnSfxRequested += sfx =>
                {
                    var audio = ServiceLocator.Get<Audio.AudioManager>();
                    audio?.PlaySFX(sfx);
                };
                dc.OnStatChanged += (stat, delta) =>
                {
                    ServiceLocator.Get<StatsManager>()?.ModifyStat(stat, delta);
                };
                dc.OnBurdenChanged += delta =>
                {
                    ServiceLocator.Get<StatsManager>()?.ModifyBurden(delta);
                };
            }
        }

        private void ShowLocationName()
        {
            var hud = FindFirstObjectByType<UI.ExplorationHUD>();
            if (hud == null) return;

            var loc = ServiceLocator.Get<Localization.LocalizationManager>();
            string name = (loc != null && loc.CurrentLanguage == "ko") ? _locationNameKo : _locationNameEn;
            hud.SetLocationName(name);
        }
    }
}
