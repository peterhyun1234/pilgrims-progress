using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.UI
{
    public class SettingsUI : MonoBehaviour
    {
        [Header("Volume Sliders")]
        [SerializeField] private Slider _masterSlider;
        [SerializeField] private Slider _bgmSlider;
        [SerializeField] private Slider _sfxSlider;
        [SerializeField] private Slider _ambientSlider;

        [Header("Labels")]
        [SerializeField] private TextMeshProUGUI _titleLabel;
        [SerializeField] private TextMeshProUGUI _masterLabel;
        [SerializeField] private TextMeshProUGUI _bgmLabel;
        [SerializeField] private TextMeshProUGUI _sfxLabel;
        [SerializeField] private TextMeshProUGUI _ambientLabel;

        [Header("Navigation")]
        [SerializeField] private Button _backButton;
        [SerializeField] private TextMeshProUGUI _backLabel;

        [Header("Panels")]
        [SerializeField] private GameObject _mainButtonsPanel;

        private Audio.AudioManager _audioManager;

        private void OnEnable()
        {
            _audioManager = ServiceLocator.TryGet<Audio.AudioManager>(out var am) ? am : null;

            if (_audioManager != null)
            {
                if (_masterSlider != null)
                {
                    _masterSlider.value = _audioManager.MasterVolume;
                    _masterSlider.onValueChanged.AddListener(OnMasterChanged);
                }
                if (_bgmSlider != null)
                {
                    _bgmSlider.value = _audioManager.BGMVolume;
                    _bgmSlider.onValueChanged.AddListener(OnBGMChanged);
                }
                if (_sfxSlider != null)
                {
                    _sfxSlider.value = _audioManager.SFXVolume;
                    _sfxSlider.onValueChanged.AddListener(OnSFXChanged);
                }
                if (_ambientSlider != null)
                {
                    _ambientSlider.value = _audioManager.AmbientVolume;
                    _ambientSlider.onValueChanged.AddListener(OnAmbientChanged);
                }
            }

            if (_backButton != null)
            {
                _backButton.onClick.AddListener(OnBack);
            }

            UpdateLocalization();
        }

        private void OnDisable()
        {
            if (_masterSlider != null) _masterSlider.onValueChanged.RemoveListener(OnMasterChanged);
            if (_bgmSlider != null) _bgmSlider.onValueChanged.RemoveListener(OnBGMChanged);
            if (_sfxSlider != null) _sfxSlider.onValueChanged.RemoveListener(OnSFXChanged);
            if (_ambientSlider != null) _ambientSlider.onValueChanged.RemoveListener(OnAmbientChanged);
        }

        private void OnMasterChanged(float value) => _audioManager?.SetMasterVolume(value);
        private void OnBGMChanged(float value) => _audioManager?.SetBGMVolume(value);
        private void OnSFXChanged(float value) => _audioManager?.SetSFXVolume(value);
        private void OnAmbientChanged(float value) => _audioManager?.SetAmbientVolume(value);

        private void OnBack()
        {
            gameObject.SetActive(false);
            if (_mainButtonsPanel != null) _mainButtonsPanel.SetActive(true);
        }

        private void UpdateLocalization()
        {
            var loc = ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) ? lm : null;
            if (loc == null) return;

            if (_titleLabel != null) _titleLabel.text = loc.Get("settings_title");
            if (_masterLabel != null) _masterLabel.text = loc.Get("settings_master_volume");
            if (_bgmLabel != null) _bgmLabel.text = loc.Get("settings_bgm_volume");
            if (_sfxLabel != null) _sfxLabel.text = loc.Get("settings_sfx_volume");
            if (_ambientLabel != null) _ambientLabel.text = loc.Get("settings_ambient_volume");
            if (_backLabel != null) _backLabel.text = loc.Get("settings_back");
        }
    }
}
