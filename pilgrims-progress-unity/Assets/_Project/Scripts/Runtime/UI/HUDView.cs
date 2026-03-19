using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PP.Core;

namespace PP.UI
{
    public class HUDView : MonoBehaviour
    {
        [Header("Stat Bars")]
        [SerializeField] private PixelStatBar _faithBar;
        [SerializeField] private PixelStatBar _courageBar;
        [SerializeField] private PixelStatBar _wisdomBar;
        [SerializeField] private PixelStatBar _burdenBar;

        [Header("Chapter")]
        [SerializeField] private TextMeshProUGUI _chapterText;

        [Header("Minimap")]
        [SerializeField] private RawImage _minimapImage;

        private void OnEnable()
        {
            EventBus.Subscribe<GameModeChangedEvent>(OnModeChanged);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<GameModeChangedEvent>(OnModeChanged);
        }

        private void OnModeChanged(GameModeChangedEvent evt)
        {
            bool show = evt.Current == GameMode.Exploration;
            gameObject.SetActive(show);
        }

        public void UpdateFaith(float normalized) => _faithBar?.SetValue(normalized);
        public void UpdateCourage(float normalized) => _courageBar?.SetValue(normalized);
        public void UpdateWisdom(float normalized) => _wisdomBar?.SetValue(normalized);
        public void UpdateBurden(float normalized) => _burdenBar?.SetValue(normalized);

        public void SetChapterText(string text)
        {
            if (_chapterText != null) _chapterText.text = text;
        }
    }
}
