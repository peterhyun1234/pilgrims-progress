using UnityEngine;
using TMPro;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.UI
{
    public class CollectionUI : MonoBehaviour
    {
        [SerializeField] private TextMeshProUGUI _titleText;
        [SerializeField] private Transform _cardContainer;
        [SerializeField] private GameObject _cardPrefab;

        private void OnEnable()
        {
            var loc = ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) ? lm : null;
            if (_titleText != null && loc != null)
            {
                _titleText.text = loc.Get("menu_collection");
            }
        }
    }
}
