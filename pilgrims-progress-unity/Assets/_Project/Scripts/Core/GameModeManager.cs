using System;
using UnityEngine;
using PilgrimsProgress.Player;
using PilgrimsProgress.Narrative;

namespace PilgrimsProgress.Core
{
    public enum GameMode
    {
        Exploration,
        Dialogue,
        Challenge,
        Cutscene,
        Menu
    }

    public class GameModeManager : MonoBehaviour
    {
        public static GameModeManager Instance { get; private set; }

        public event Action<GameMode, GameMode> OnModeChanged;

        public GameMode CurrentMode { get; private set; } = GameMode.Exploration;

        private Transform _dialogueFocusTarget;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            ServiceLocator.Register(this);
        }

        private void Start()
        {
            var ink = ServiceLocator.Get<InkService>();
            if (ink != null)
            {
                ink.OnStoryEnd += HandleStoryEnd;
            }
        }

        public void EnterDialogueMode(Transform focusTarget = null)
        {
            if (CurrentMode == GameMode.Dialogue) return;

            _dialogueFocusTarget = focusTarget;
            SetMode(GameMode.Dialogue);

            var player = ServiceLocator.Get<PlayerController>();
            if (player != null)
                player.SetCanMove(false);
        }

        public void ExitDialogueMode()
        {
            if (CurrentMode != GameMode.Dialogue) return;

            _dialogueFocusTarget = null;
            SetMode(GameMode.Exploration);

            var player = ServiceLocator.Get<PlayerController>();
            if (player != null)
                player.SetCanMove(true);
        }

        public void EnterChallengeMode()
        {
            SetMode(GameMode.Challenge);

            var player = ServiceLocator.Get<PlayerController>();
            if (player != null)
                player.SetCanMove(false);
        }

        public void ExitChallengeMode()
        {
            SetMode(GameMode.Exploration);

            var player = ServiceLocator.Get<PlayerController>();
            if (player != null)
                player.SetCanMove(true);
        }

        public void EnterMenuMode()
        {
            SetMode(GameMode.Menu);

            var player = ServiceLocator.Get<PlayerController>();
            if (player != null)
                player.SetCanMove(false);
        }

        public void ExitMenuMode()
        {
            SetMode(GameMode.Exploration);

            var player = ServiceLocator.Get<PlayerController>();
            if (player != null)
                player.SetCanMove(true);
        }

        public Transform GetDialogueFocusTarget()
        {
            return _dialogueFocusTarget;
        }

        private void SetMode(GameMode newMode)
        {
            var previous = CurrentMode;
            CurrentMode = newMode;
            OnModeChanged?.Invoke(previous, newMode);
            Debug.Log($"[GameMode] {previous} -> {newMode}");
        }

        private void HandleStoryEnd()
        {
            if (CurrentMode == GameMode.Dialogue)
                ExitDialogueMode();
        }

        private void OnDestroy()
        {
            var ink = ServiceLocator.Get<InkService>();
            if (ink != null)
                ink.OnStoryEnd -= HandleStoryEnd;
        }
    }
}
