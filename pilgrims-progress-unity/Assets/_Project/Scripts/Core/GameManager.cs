using UnityEngine;

namespace PilgrimsProgress.Core
{
    public enum GameState
    {
        Boot,
        LanguageSelect,
        MainMenu,
        Prologue,
        Gameplay,
        Epilogue,
        Paused
    }

    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        public GameState CurrentState { get; private set; } = GameState.Boot;

        public string CurrentLanguage
        {
            get => PlayerPrefs.GetString("Language", "ko");
            set => PlayerPrefs.SetString("Language", value);
        }

        public bool HasLanguageBeenSelected
        {
            get => PlayerPrefs.GetInt("LanguageSelected", 0) == 1;
            set => PlayerPrefs.SetInt("LanguageSelected", value ? 1 : 0);
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
            ServiceLocator.Register(this);
        }

        public void SetState(GameState newState)
        {
            var previousState = CurrentState;
            CurrentState = newState;
            Debug.Log($"[GameManager] State: {previousState} -> {newState}");
        }

        public void SetLanguage(string langCode)
        {
            CurrentLanguage = langCode;
            HasLanguageBeenSelected = true;
            PlayerPrefs.Save();
        }
    }
}
