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
            StartCoroutine(InitializeServices());
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

            var transitionGo = new GameObject("[TransitionController]");
            DontDestroyOnLoad(transitionGo);
            if (FindFirstObjectByType<Scene.TransitionController>() == null)
            {
                transitionGo.AddComponent<Scene.TransitionController>();
            }

            yield return null;

            var gm = GameManager.Instance;
            string activeScene = SceneManager.GetActiveScene().name;

            if (activeScene == "MainMenu" || activeScene == "Gameplay")
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
