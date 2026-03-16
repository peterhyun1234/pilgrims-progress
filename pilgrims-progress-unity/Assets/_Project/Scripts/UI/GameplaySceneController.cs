using UnityEngine;
using PilgrimsProgress.Core;
using PilgrimsProgress.Narrative;

namespace PilgrimsProgress.UI
{
    public class GameplaySceneController : MonoBehaviour
    {
        [Header("Ink Story")]
        [SerializeField] private TextAsset _inkJsonAsset;

        [Header("UI Components")]
        [SerializeField] private DialogueUI _dialogueUI;
        [SerializeField] private StatsUI _statsUI;
        [SerializeField] private CharacterPortraitUI _portraitUI;
        [SerializeField] private BackgroundRenderer _backgroundRenderer;
        [SerializeField] private PrologueUI _prologueUI;

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

            if (_backgroundRenderer != null)
            {
                _dialogueController.OnLocationChanged += HandleLocationChange;
                _dialogueController.OnBgmChanged += HandleBgmChange;
                _dialogueController.OnSfxRequested += HandleSfx;
            }

            _dialogueController.OnStatChanged += HandleStatChange;
            _dialogueController.OnBurdenChanged += HandleBurdenChange;

            if (_inkJsonAsset != null && _inkService != null)
            {
                _inkService.LoadStory(_inkJsonAsset);

                var gm = GameManager.Instance;
                if (gm != null && gm.CurrentState == GameState.Prologue)
                {
                    if (_prologueUI != null)
                    {
                        _prologueUI.gameObject.SetActive(true);
                    }
                    else
                    {
                        gm.SetState(GameState.Gameplay);
                        _inkService.Continue();
                    }
                }
                else
                {
                    _inkService.Continue();
                }
            }
        }

        private void HandleLocationChange(string locationId)
        {
            Debug.Log($"[Gameplay] Location changed: {locationId}");
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
