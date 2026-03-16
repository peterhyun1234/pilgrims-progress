using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.UI
{
    /// <summary>
    /// Parchment-style world map showing location progress.
    /// Visited locations appear in color, unvisited as silhouettes.
    /// </summary>
    public class WorldMapUI : MonoBehaviour
    {
        [Header("Panel")]
        [SerializeField] private GameObject _mapPanel;
        [SerializeField] private CanvasGroup _canvasGroup;

        [Header("Location Nodes")]
        [SerializeField] private List<LocationNode> _locationNodes = new List<LocationNode>();

        [Header("Player Icon")]
        [SerializeField] private RectTransform _playerIcon;

        [Header("Progress")]
        [SerializeField] private TextMeshProUGUI _progressText;

        private bool _isOpen;

        [System.Serializable]
        public class LocationNode
        {
            public string LocationId;
            public string NameKo;
            public string NameEn;
            public RectTransform NodeTransform;
            public Image NodeImage;
            public TextMeshProUGUI Label;
            public Color VisitedColor = Color.white;
            public Color UnvisitedColor = new Color(0.3f, 0.3f, 0.3f, 0.5f);
        }

        private void Start()
        {
            if (_mapPanel != null)
                _mapPanel.SetActive(false);
        }

        private void Update()
        {
            if (UnityEngine.InputSystem.Keyboard.current != null &&
                UnityEngine.InputSystem.Keyboard.current.mKey.wasPressedThisFrame)
            {
                ToggleMap();
            }
        }

        public void ToggleMap()
        {
            _isOpen = !_isOpen;

            if (_mapPanel != null)
                _mapPanel.SetActive(_isOpen);

            if (_isOpen)
                RefreshMap();

            var modeManager = ServiceLocator.Get<GameModeManager>();
            if (modeManager != null)
            {
                if (_isOpen)
                    modeManager.EnterMenuMode();
                else
                    modeManager.ExitMenuMode();
            }
        }

        public void RefreshMap()
        {
            int visited = 0;

            foreach (var node in _locationNodes)
            {
                bool isVisited = PlayerPrefs.GetInt($"visited_{node.LocationId}", 0) == 1;

                if (node.NodeImage != null)
                    node.NodeImage.color = isVisited ? node.VisitedColor : node.UnvisitedColor;

                if (node.Label != null)
                {
                    var loc = ServiceLocator.Get<Localization.LocalizationManager>();
                    node.Label.text = (loc != null && loc.CurrentLanguage == "ko") ? node.NameKo : node.NameEn;
                    node.Label.color = isVisited ? Color.white : new Color(1, 1, 1, 0.3f);
                }

                if (isVisited) visited++;
            }

            string currentLocationId = PlayerPrefs.GetString("CurrentLocation", "");
            if (_playerIcon != null)
            {
                foreach (var node in _locationNodes)
                {
                    if (node.LocationId == currentLocationId && node.NodeTransform != null)
                    {
                        _playerIcon.position = node.NodeTransform.position + Vector3.up * 30f;
                        break;
                    }
                }
            }

            if (_progressText != null)
            {
                float pct = _locationNodes.Count > 0 ? (visited / (float)_locationNodes.Count) * 100f : 0f;
                _progressText.text = $"{pct:F0}%";
            }
        }

        public static void MarkLocationVisited(string locationId)
        {
            PlayerPrefs.SetInt($"visited_{locationId}", 1);
            PlayerPrefs.SetString("CurrentLocation", locationId);
            PlayerPrefs.Save();
        }
    }
}
