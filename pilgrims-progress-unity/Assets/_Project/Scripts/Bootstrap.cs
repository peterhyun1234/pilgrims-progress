using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace PilgrimsProgress.Core
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
            UI.KoreanFontSetup.Initialize();
            SceneManager.sceneLoaded += OnSceneLoaded;
            StartCoroutine(InitializeServices());
        }

        private void OnDestroy()
        {
            SceneManager.sceneLoaded -= OnSceneLoaded;
        }

        private static void OnSceneLoaded(UnityEngine.SceneManagement.Scene scene, LoadSceneMode mode)
        {
            switch (scene.name)
            {
                case "MainMenu":
                    if (Object.FindFirstObjectByType<Scene.MainMenuSceneSetup>() == null)
                    {
                        var go = new GameObject("[MainMenuSetup]");
                        go.AddComponent<Scene.MainMenuSceneSetup>();
                    }
                    break;
                case "Gameplay":
                    if (Object.FindFirstObjectByType<Scene.GameplaySceneSetup>() == null)
                    {
                        var go = new GameObject("[GameplaySetup]");
                        go.AddComponent<Scene.GameplaySceneSetup>();
                    }
                    break;
            }
        }

        private IEnumerator InitializeServices()
        {
            CreateManager<GameManager>("[GameManager]");
            CreateManager<Narrative.InkService>("[InkService]");
            CreateManager<Narrative.StatsManager>("[StatsManager]");
            CreateManager<Audio.AudioManager>("[AudioManager]");
            CreateManager<Localization.LocalizationManager>("[LocalizationManager]");
            CreateManager<Save.SaveManager>("[SaveManager]");
            CreateManager<Auth.AuthManager>("[AuthManager]");
            CreateManager<Scene.SceneLoader>("[SceneLoader]");
            CreateManager<GameModeManager>("[GameModeManager]");
            CreateManager<Challenge.QTEManager>("[QTEManager]");
            CreateManager<Player.PlayerCustomizationManager>("[PlayerCustomizationManager]");

            var transitionGo = new GameObject("[TransitionController]");
            DontDestroyOnLoad(transitionGo);
            if (FindFirstObjectByType<Scene.TransitionController>() == null)
            {
                transitionGo.AddComponent<Scene.TransitionController>();
            }

            yield return null;

            var gm = GameManager.Instance;
            string activeScene = SceneManager.GetActiveScene().name;

            if (activeScene == "MainMenu")
            {
                if (!gm.HasLanguageBeenSelected)
                    gm.SetState(GameState.LanguageSelect);
                else
                    gm.SetState(GameState.MainMenu);
                yield break;
            }

            if (activeScene == "Gameplay")
            {
                yield break;
            }

            if (!gm.HasLanguageBeenSelected)
            {
                gm.SetState(GameState.LanguageSelect);
            }
            else
            {
                gm.SetState(GameState.MainMenu);
            }

            SceneManager.LoadScene("MainMenu");
        }

        private T CreateManager<T>(string name) where T : MonoBehaviour
        {
            var existing = FindFirstObjectByType<T>();
            if (existing != null) return existing;

            var go = new GameObject(name);
            DontDestroyOnLoad(go);
            return go.AddComponent<T>();
        }
    }
}
