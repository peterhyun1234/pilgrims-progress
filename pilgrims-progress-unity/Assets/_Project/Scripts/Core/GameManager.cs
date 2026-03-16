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
            get => PlayerPrefs.GetString("pp_language", "ko");
            set => PlayerPrefs.SetString("pp_language", value);
        }

        public bool HasLanguageBeenSelected
        {
            get => PlayerPrefs.GetInt("pp_language_selected", 0) == 1;
            set => PlayerPrefs.SetInt("pp_language_selected", value ? 1 : 0);
        }

        public bool IsFirstRun => PlayerPrefs.GetInt("pp_first_run_done", 0) == 0;

        public string PlayerName
        {
            get => PlayerPrefs.GetString("pp_player_name", "Christian");
            set { PlayerPrefs.SetString("pp_player_name", value); PlayerPrefs.Save(); }
        }

        public int CurrentChapter
        {
            get => PlayerPrefs.GetInt("pp_current_chapter", 0);
            set { PlayerPrefs.SetInt("pp_current_chapter", value); PlayerPrefs.Save(); }
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
            MigrateOldPlayerPrefs();
        }

        private void MigrateOldPlayerPrefs()
        {
            if (PlayerPrefs.HasKey("Language") && !PlayerPrefs.HasKey("pp_language"))
            {
                PlayerPrefs.SetString("pp_language", PlayerPrefs.GetString("Language"));
                PlayerPrefs.DeleteKey("Language");
            }
            if (PlayerPrefs.HasKey("LanguageSelected") && !PlayerPrefs.HasKey("pp_language_selected"))
            {
                PlayerPrefs.SetInt("pp_language_selected", PlayerPrefs.GetInt("LanguageSelected"));
                PlayerPrefs.DeleteKey("LanguageSelected");
            }
            PlayerPrefs.Save();
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

        public void CompleteFirstRun()
        {
            PlayerPrefs.SetInt("pp_first_run_done", 1);
            PlayerPrefs.Save();
        }

        public bool HasSaveData()
        {
            return PlayerPrefs.HasKey("SaveSlot_Auto");
        }
    }
}
