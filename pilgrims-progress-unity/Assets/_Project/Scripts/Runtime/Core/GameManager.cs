using UnityEngine;
using PP.StateMachine;

namespace PP.Core
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        public StateMachine<GamePhase> PhaseMachine { get; private set; }
        public StateMachine<GameMode> ModeMachine { get; private set; }

        public GamePhase CurrentPhase => PhaseMachine.CurrentKey;
        public GameMode CurrentMode => ModeMachine.CurrentKey;

        public string CurrentLanguage
        {
            get => PlayerPrefs.GetString("pp_language", "ko");
            set { PlayerPrefs.SetString("pp_language", value); PlayerPrefs.Save(); }
        }

        public bool HasLanguageBeenSelected
        {
            get => PlayerPrefs.GetInt("pp_lang_selected", 0) == 1;
            set { PlayerPrefs.SetInt("pp_lang_selected", value ? 1 : 0); PlayerPrefs.Save(); }
        }

        public string PlayerName
        {
            get => PlayerPrefs.GetString("pp_player_name", "Christian");
            set { PlayerPrefs.SetString("pp_player_name", value); PlayerPrefs.Save(); }
        }

        public int CurrentChapter
        {
            get => PlayerPrefs.GetInt("pp_chapter", 0);
            set { PlayerPrefs.SetInt("pp_chapter", value); PlayerPrefs.Save(); }
        }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            BuildPhaseMachine();
            BuildModeMachine();

            ServiceLocator.Register(this);
        }

        private void BuildPhaseMachine()
        {
            PhaseMachine = new StateMachine<GamePhase>();

            PhaseMachine.AddState(GamePhase.Boot, new EmptyState());
            PhaseMachine.AddState(GamePhase.LanguageSelect, new EmptyState());
            PhaseMachine.AddState(GamePhase.MainMenu, new EmptyState());
            PhaseMachine.AddState(GamePhase.Prologue, new EmptyState());
            PhaseMachine.AddState(GamePhase.Gameplay, new EmptyState());
            PhaseMachine.AddState(GamePhase.Paused, new EmptyState());
            PhaseMachine.AddState(GamePhase.Epilogue, new EmptyState());

            PhaseMachine.AddTransition(GamePhase.Boot, GamePhase.LanguageSelect);
            PhaseMachine.AddTransition(GamePhase.Boot, GamePhase.MainMenu);
            PhaseMachine.AddTransition(GamePhase.Boot, GamePhase.Gameplay);
            PhaseMachine.AddTransition(GamePhase.LanguageSelect, GamePhase.MainMenu);
            PhaseMachine.AddTransition(GamePhase.MainMenu, GamePhase.Prologue);
            PhaseMachine.AddTransition(GamePhase.MainMenu, GamePhase.Gameplay);
            PhaseMachine.AddTransition(GamePhase.MainMenu, GamePhase.LanguageSelect);
            PhaseMachine.AddTransition(GamePhase.Prologue, GamePhase.Gameplay);
            PhaseMachine.AddTransition(GamePhase.Prologue, GamePhase.MainMenu);
            PhaseMachine.AddBidirectional(GamePhase.Gameplay, GamePhase.Paused);
            PhaseMachine.AddTransition(GamePhase.Gameplay, GamePhase.Epilogue);
            PhaseMachine.AddTransition(GamePhase.Gameplay, GamePhase.MainMenu);
            PhaseMachine.AddTransition(GamePhase.Paused, GamePhase.MainMenu);
            PhaseMachine.AddTransition(GamePhase.Epilogue, GamePhase.MainMenu);

            PhaseMachine.OnTransition += (prev, curr) =>
            {
                EventBus.Publish(new GamePhaseChangedEvent { Previous = prev, Current = curr });
            };

            PhaseMachine.Initialize(GamePhase.Boot);
        }

        private void BuildModeMachine()
        {
            ModeMachine = new StateMachine<GameMode>();

            ModeMachine.AddState(GameMode.Exploration, new EmptyState());
            ModeMachine.AddState(GameMode.Dialogue, new EmptyState());
            ModeMachine.AddState(GameMode.Combat, new EmptyState());
            ModeMachine.AddState(GameMode.Challenge, new EmptyState());
            ModeMachine.AddState(GameMode.Cutscene, new EmptyState());
            ModeMachine.AddState(GameMode.Menu, new EmptyState());

            ModeMachine.AddBidirectional(GameMode.Exploration, GameMode.Dialogue);
            ModeMachine.AddBidirectional(GameMode.Exploration, GameMode.Combat);
            ModeMachine.AddBidirectional(GameMode.Exploration, GameMode.Challenge);
            ModeMachine.AddBidirectional(GameMode.Exploration, GameMode.Cutscene);
            ModeMachine.AddBidirectional(GameMode.Exploration, GameMode.Menu);
            ModeMachine.AddTransition(GameMode.Dialogue, GameMode.Menu);
            ModeMachine.AddTransition(GameMode.Menu, GameMode.Dialogue);
            ModeMachine.AddTransition(GameMode.Combat, GameMode.Cutscene);
            ModeMachine.AddTransition(GameMode.Cutscene, GameMode.Dialogue);

            ModeMachine.OnTransition += (prev, curr) =>
            {
                EventBus.Publish(new GameModeChangedEvent { Previous = prev, Current = curr });
            };

            ModeMachine.Initialize(GameMode.Exploration);
        }

        public bool SetPhase(GamePhase phase) => PhaseMachine.TryTransition(phase);
        public bool SetMode(GameMode mode) => ModeMachine.TryTransition(mode);

        public bool EnterDialogue()
        {
            if (!SetMode(GameMode.Dialogue)) return false;
            SetPlayerMovement(false);
            return true;
        }

        public bool ExitDialogue()
        {
            if (!SetMode(GameMode.Exploration)) return false;
            SetPlayerMovement(true);
            return true;
        }

        public bool EnterCombat()
        {
            if (!SetMode(GameMode.Combat)) return false;
            return true;
        }

        public bool ExitCombat()
        {
            if (!SetMode(GameMode.Exploration)) return false;
            return true;
        }

        public bool EnterPause()
        {
            if (!SetPhase(GamePhase.Paused)) return false;
            Time.timeScale = 0f;
            return true;
        }

        public bool ExitPause()
        {
            if (!SetPhase(GamePhase.Gameplay)) return false;
            Time.timeScale = 1f;
            return true;
        }

        private void SetPlayerMovement(bool canMove)
        {
            if (ServiceLocator.TryGet<Player.PlayerController>(out var player))
                player.SetCanMove(canMove);
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }
    }

    internal class EmptyState : IState
    {
        public void Enter() { }
        public void Update() { }
        public void FixedUpdate() { }
        public void Exit() { }
    }
}
