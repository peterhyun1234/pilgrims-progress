using System;
using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace PilgrimsProgress.Scene
{
    public class SceneLoader : MonoBehaviour
    {
        public static SceneLoader Instance { get; private set; }

        public event Action<float> OnLoadProgress;
        public event Action OnLoadComplete;
        public bool IsLoading { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            Core.ServiceLocator.Register(this);
        }

        public void LoadScene(string sceneName, bool useTransition = true)
        {
            if (IsLoading) return;
            StartCoroutine(LoadSceneAsync(sceneName, useTransition));
        }

        private IEnumerator LoadSceneAsync(string sceneName, bool useTransition)
        {
            IsLoading = true;

            if (useTransition)
            {
                var transition = Core.ServiceLocator.TryGet<TransitionController>(out var tc) ? tc : null;
                if (transition != null)
                {
                    yield return transition.FadeOut();
                }
            }

            var op = SceneManager.LoadSceneAsync(sceneName);
            op.allowSceneActivation = false;

            while (op.progress < 0.9f)
            {
                OnLoadProgress?.Invoke(op.progress);
                yield return null;
            }

            op.allowSceneActivation = true;
            yield return new WaitUntil(() => op.isDone);

            if (useTransition)
            {
                var transition = Core.ServiceLocator.TryGet<TransitionController>(out var tc) ? tc : null;
                if (transition != null)
                {
                    yield return transition.FadeIn();
                }
            }

            IsLoading = false;
            OnLoadComplete?.Invoke();
        }
    }
}
