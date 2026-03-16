using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PilgrimsProgress.Core;
using PilgrimsProgress.Narrative;

namespace PilgrimsProgress.UI
{
    public class EpilogueUI : MonoBehaviour
    {
        [Header("VFX")]
        [SerializeField] private ParticleSystem _burdenFallParticles;
        [SerializeField] private ParticleSystem _celebrationParticles;

        [Header("UI")]
        [SerializeField] private CanvasGroup _summaryPanel;
        [SerializeField] private TextMeshProUGUI _summaryTitle;
        [SerializeField] private TextMeshProUGUI _faithSummary;
        [SerializeField] private TextMeshProUGUI _courageSummary;
        [SerializeField] private TextMeshProUGUI _wisdomSummary;
        [SerializeField] private TextMeshProUGUI _demoEndText;
        [SerializeField] private TextMeshProUGUI _bibleVerseText;

        [Header("Return to Menu")]
        [SerializeField] private Button _returnButton;
        [SerializeField] private TextMeshProUGUI _returnLabel;

        [Header("Timing")]
        [SerializeField] private float _vfxDelay = 2f;
        [SerializeField] private float _summaryDelay = 5f;

        private void Start()
        {
            if (_summaryPanel != null) _summaryPanel.alpha = 0f;
            if (_returnButton != null)
            {
                _returnButton.gameObject.SetActive(false);
                _returnButton.onClick.AddListener(ReturnToMainMenu);
            }

            var inkService = ServiceLocator.Get<InkService>();
            if (inkService != null)
            {
                inkService.OnStoryEnd += OnStoryComplete;
            }
        }

        private void OnStoryComplete()
        {
            StartCoroutine(PlayEpilogue());
        }

        private IEnumerator PlayEpilogue()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.SetState(GameState.Epilogue);
            }

            if (_burdenFallParticles != null)
            {
                _burdenFallParticles.Play();
            }

            yield return new WaitForSeconds(_vfxDelay);

            if (_celebrationParticles != null)
            {
                _celebrationParticles.Play();
            }

            yield return new WaitForSeconds(_summaryDelay);

            ShowSummary();

            yield return FadeIn(_summaryPanel, 1.5f);

            yield return new WaitForSeconds(2f);

            if (_returnButton != null)
            {
                _returnButton.gameObject.SetActive(true);
            }
        }

        private void ShowSummary()
        {
            var loc = ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) ? lm : null;
            var stats = ServiceLocator.TryGet<StatsManager>(out var sm) ? sm : null;
            var custManager = ServiceLocator.TryGet<Player.PlayerCustomizationManager>(out var cm) ? cm : null;
            string playerName = custManager != null ? custManager.GetPlayerName() : "Christian";

            if (_summaryTitle != null)
            {
                bool isKo = loc != null && loc.CurrentLanguage == "ko";
                _summaryTitle.text = isKo
                    ? $"{playerName}의 순례 여정"
                    : $"{playerName}'s Pilgrimage";
            }

            if (stats != null)
            {
                if (_faithSummary != null)
                    _faithSummary.text = $"{(loc != null ? loc.Get("stat_faith") : "Faith")}: {stats.Stats.Faith}";
                if (_courageSummary != null)
                    _courageSummary.text = $"{(loc != null ? loc.Get("stat_courage") : "Courage")}: {stats.Stats.Courage}";
                if (_wisdomSummary != null)
                    _wisdomSummary.text = $"{(loc != null ? loc.Get("stat_wisdom") : "Wisdom")}: {stats.Stats.Wisdom}";
            }

            if (_demoEndText != null && loc != null)
            {
                _demoEndText.text = loc.Get("epilogue_demo_end");
            }

            if (_bibleVerseText != null)
            {
                string verse = loc != null && loc.CurrentLanguage == "ko"
                    ? "\"하나님이 세상을 이처럼 사랑하셔서,\n외아들을 주셨으니,\n그를 믿는 사람마다 멸망하지 않고,\n영원한 생명을 얻게 하려는 것이다.\"\n— 요한복음 3:16 (새번역)"
                    : "\"For God so loved the world\nthat he gave his one and only Son,\nthat whoever believes in him\nshall not perish\nbut have eternal life.\"\n— John 3:16 (NIV)";
                _bibleVerseText.text = verse;
            }

            if (_returnLabel != null && loc != null)
            {
                _returnLabel.text = loc.Get("menu_continue");
            }
        }

        private IEnumerator FadeIn(CanvasGroup group, float duration)
        {
            if (group == null) yield break;
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                group.alpha = Mathf.Lerp(0f, 1f, elapsed / duration);
                yield return null;
            }
            group.alpha = 1f;
        }

        private void ReturnToMainMenu()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.SetState(GameState.MainMenu);
            }

            var sceneLoader = ServiceLocator.TryGet<Scene.SceneLoader>(out var sl) ? sl : null;
            if (sceneLoader != null)
            {
                sceneLoader.LoadScene("MainMenu");
            }
            else
            {
                UnityEngine.SceneManagement.SceneManager.LoadScene("MainMenu");
            }
        }

        private void OnDestroy()
        {
            var inkService = ServiceLocator.TryGet<InkService>(out var ink) ? ink : null;
            if (inkService != null)
            {
                inkService.OnStoryEnd -= OnStoryComplete;
            }
        }
    }
}
