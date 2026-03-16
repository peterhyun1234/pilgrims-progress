using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.UI
{
    public class LanguageSelectUI : MonoBehaviour
    {
        [SerializeField] private TextMeshProUGUI _titleText;
        [SerializeField] private Button _koreanButton;
        [SerializeField] private Button _englishButton;
        [SerializeField] private TextMeshProUGUI _koreanLabel;
        [SerializeField] private TextMeshProUGUI _englishLabel;

        private void Start()
        {
            if (_titleText != null) _titleText.text = "언어를 선택하세요 / Select Language";
            if (_koreanLabel != null) _koreanLabel.text = "한국어";
            if (_englishLabel != null) _englishLabel.text = "English";

            if (_koreanButton != null)
                _koreanButton.onClick.AddListener(() => SelectLanguage("ko"));
            if (_englishButton != null)
                _englishButton.onClick.AddListener(() => SelectLanguage("en"));
        }

        private void SelectLanguage(string langCode)
        {
            var loc = ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) ? lm : null;
            loc?.SetLanguage(langCode);

            if (GameManager.Instance != null)
            {
                GameManager.Instance.SetState(GameState.MainMenu);
            }

            gameObject.SetActive(false);
        }
    }
}
