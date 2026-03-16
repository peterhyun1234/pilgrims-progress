using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.UI
{
    public class PrologueUI : MonoBehaviour
    {
        [Header("Text Display")]
        [SerializeField] private TextMeshProUGUI _prologueText;
        [SerializeField] private CanvasGroup _textCanvasGroup;

        [Header("Background")]
        [SerializeField] private Image _background;
        [SerializeField] private CanvasGroup _backgroundCanvasGroup;

        [Header("Timing")]
        [SerializeField] private float _fadeInDuration = 2f;
        [SerializeField] private float _holdDuration = 3f;
        [SerializeField] private float _fadeOutDuration = 1f;
        [SerializeField] private float _typewriterSpeed = 0.06f;

        [Header("Skip")]
        [SerializeField] private Button _skipButton;
        [SerializeField] private TextMeshProUGUI _skipLabel;

        private bool _skipRequested;

        private void Start()
        {
            if (_skipButton != null)
            {
                _skipButton.onClick.AddListener(() => _skipRequested = true);
            }

            if (_skipLabel != null)
            {
                var loc = ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) ? lm : null;
                _skipLabel.text = loc != null ? loc.Get("ui_skip") : "Skip";
            }

            StartCoroutine(PlayPrologue());
        }

        private IEnumerator PlayPrologue()
        {
            var loc = ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) ? lm : null;

            if (_textCanvasGroup != null) _textCanvasGroup.alpha = 0f;
            if (_backgroundCanvasGroup != null) _backgroundCanvasGroup.alpha = 0f;

            yield return FadeCanvasGroup(_backgroundCanvasGroup, 0f, 1f, _fadeInDuration * 2);
            if (_skipRequested) { FinishPrologue(); yield break; }

            string[] lines = new string[]
            {
                loc != null ? loc.Get("prologue_line1") : "I dreamed a dream...",
                loc != null ? loc.Get("prologue_line2") : "In the wilderness of this world",
                loc != null ? loc.Get("prologue_line3") : "A man stood clothed in rags",
                loc != null ? loc.Get("prologue_line4") : "A heavy burden upon his back",
                loc != null ? loc.Get("prologue_line5") : "And a book in his hand."
            };

            foreach (var line in lines)
            {
                if (_skipRequested) { FinishPrologue(); yield break; }

                yield return ShowLine(line);
            }

            yield return new WaitForSeconds(1f);
            FinishPrologue();
        }

        private IEnumerator ShowLine(string text)
        {
            if (_prologueText != null) _prologueText.text = "";
            yield return FadeCanvasGroup(_textCanvasGroup, 0f, 1f, _fadeInDuration * 0.5f);

            if (_prologueText != null)
            {
                for (int i = 0; i < text.Length; i++)
                {
                    if (_skipRequested) 
                    {
                        _prologueText.text = text;
                        break;
                    }
                    _prologueText.text = text.Substring(0, i + 1);
                    yield return new WaitForSecondsRealtime(_typewriterSpeed);
                }
            }

            yield return new WaitForSeconds(_holdDuration);

            yield return FadeCanvasGroup(_textCanvasGroup, 1f, 0f, _fadeOutDuration);
        }

        private IEnumerator FadeCanvasGroup(CanvasGroup group, float from, float to, float duration)
        {
            if (group == null) yield break;

            float elapsed = 0f;
            while (elapsed < duration)
            {
                if (_skipRequested && to < from) break;
                elapsed += Time.unscaledDeltaTime;
                group.alpha = Mathf.Lerp(from, to, elapsed / duration);
                yield return null;
            }
            group.alpha = to;
        }

        private void FinishPrologue()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.SetState(GameState.Gameplay);
            }

            var inkService = ServiceLocator.Get<Narrative.InkService>();
            inkService?.Continue();
        }
    }
}
