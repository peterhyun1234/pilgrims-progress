namespace PP.Core
{
    public enum GamePhase
    {
        Boot,
        LanguageSelect,
        MainMenu,
        Prologue,
        Gameplay,
        Paused,
        Epilogue
    }

    public enum GameMode
    {
        Exploration,
        Dialogue,
        Combat,
        Challenge,
        Cutscene,
        Menu
    }

    public struct GamePhaseChangedEvent : IEvent
    {
        public GamePhase Previous;
        public GamePhase Current;
    }

    public struct GameModeChangedEvent : IEvent
    {
        public GameMode Previous;
        public GameMode Current;
    }

    public struct DialogueStartedEvent : IEvent
    {
        public string KnotName;
        public string SpeakerId;
    }

    public struct DialogueEndedEvent : IEvent { }

    public struct QuestUpdatedEvent : IEvent
    {
        public string QuestId;
        public QuestStatus Status;
    }

    public enum QuestStatus
    {
        Locked,
        Available,
        Active,
        Completed
    }

    public struct PlayerDamagedEvent : IEvent
    {
        public float Damage;
        public UnityEngine.Vector2 HitDirection;
    }

    public struct ScreenShakeEvent : IEvent
    {
        public float Intensity;
        public float Duration;
    }

    public struct HitstopEvent : IEvent
    {
        public float Duration;
    }

    public struct ControlSchemeChangedEvent : IEvent
    {
        public ControlScheme Scheme;
    }

    public enum ControlScheme
    {
        KeyboardMouse,
        Gamepad,
        Touch
    }
}
