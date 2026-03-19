using System.Collections;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;

namespace PP.Core
{
    public class Bootstrap : MonoBehaviour
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void AutoInitialize()
        {
            if (GameManager.Instance != null) return;
            var go = new GameObject("[Bootstrap]");
            DontDestroyOnLoad(go);
            go.AddComponent<Bootstrap>();
        }

        private void Awake()
        {
            SceneManager.sceneLoaded += OnSceneLoaded;
            StartCoroutine(InitializeServices());
        }

        private void OnDestroy()
        {
            SceneManager.sceneLoaded -= OnSceneLoaded;
        }

        private IEnumerator InitializeServices()
        {
            // Layer 1 — Core (order matters)
            Create<GameManager>("[GameManager]");
            Create<PP.Input.InputManager>("[InputManager]");

            // Layer 2 — Narrative & Data
            Create<PP.Narrative.InkService>("[InkService]");
            Create<PP.Narrative.DialogueManager>("[DialogueManager]");
            Create<PP.Narrative.QuestSystem>("[QuestSystem]");

            // Layer 3 — Infrastructure
            Create<PP.Save.SaveManager>("[SaveManager]");

            // Layer 4 — Visuals (optional, survives missing prefabs)
            Create<PP.Visuals.GameFeelManager>("[GameFeelManager]");

            yield return null;

            // Platform settings
            var platformConfig = PlatformConfig.LoadForCurrentPlatform();
            if (platformConfig != null) platformConfig.Apply();

            WireEvents();
            LoadInkStory();

            EnsureEventSystem();

            var gm = GameManager.Instance;
            string active = SceneManager.GetActiveScene().name;

            if (active != "MainMenu" && active != "Gameplay")
            {
                SceneManager.LoadScene("MainMenu");
                yield break;
            }

            if (active == "MainMenu")
            {
                if (!gm.HasLanguageBeenSelected)
                {
                    gm.SetPhase(GamePhase.LanguageSelect);
                    ShowLanguageSelect();
                }
                else
                {
                    gm.SetPhase(GamePhase.MainMenu);
                    ShowMainMenu();
                }
            }
        }

        private static void LoadInkStory()
        {
            var inkJson = Resources.Load<TextAsset>("InkStory");
            if (inkJson == null) inkJson = Resources.Load<TextAsset>("main");
            if (inkJson != null)
                PP.Narrative.InkService.Instance?.LoadStory(inkJson);
        }

        private void WireEvents()
        {
            var gm = GameManager.Instance;
            var input = PP.Input.InputManager.Instance;
            if (gm == null || input == null) return;

            EventBus.Subscribe<GameModeChangedEvent>(e =>
            {
                switch (e.Current)
                {
                    case GameMode.Exploration:
                    case GameMode.Combat:
                        input.ActivatePlayerMap();
                        break;
                    case GameMode.Dialogue:
                        input.ActivateDialogueMap();
                        break;
                    case GameMode.Menu:
                    case GameMode.Cutscene:
                        input.ActivateUIMap();
                        break;
                }
            });
        }

        private static void OnSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            ServiceLocator.ClearTransients();
            EnsureEventSystem();

            switch (scene.name)
            {
                case "MainMenu":
                    var gm = GameManager.Instance;
                    if (gm != null && !gm.HasLanguageBeenSelected)
                        ShowLanguageSelect();
                    else
                        ShowMainMenu();
                    break;
                case "Gameplay":
                    EnsureSceneComponent<GameplayInitializer>("[GameplayInit]");
                    break;
            }
        }

        public static void ShowLanguageSelect()
        {
            DestroyExisting<PP.UI.MainMenuView>();
            EnsureSceneComponent<PP.UI.LanguageSelectView>("[LanguageSelect]");
        }

        public static void ShowMainMenu()
        {
            DestroyExisting<PP.UI.LanguageSelectView>();
            EnsureSceneComponent<PP.UI.MainMenuView>("[MainMenuUI]");
        }

        private static void DestroyExisting<T>() where T : MonoBehaviour
        {
            var existing = Object.FindFirstObjectByType<T>();
            if (existing != null) Object.Destroy(existing.gameObject);
        }

        private static void EnsureSceneComponent<T>(string name) where T : MonoBehaviour
        {
            if (Object.FindFirstObjectByType<T>() != null) return;
            var go = new GameObject(name);
            go.AddComponent<T>();
        }

        private static void EnsureEventSystem()
        {
            if (Object.FindFirstObjectByType<EventSystem>() != null) return;
            var go = new GameObject("[EventSystem]");
            go.AddComponent<EventSystem>();
            go.AddComponent<UnityEngine.InputSystem.UI.InputSystemUIInputModule>();
        }

        private T Create<T>(string name) where T : MonoBehaviour
        {
            var existing = FindFirstObjectByType<T>();
            if (existing != null) return existing;
            var go = new GameObject(name);
            DontDestroyOnLoad(go);
            return go.AddComponent<T>();
        }
    }
}
