using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PilgrimsProgress.Core;
using PilgrimsProgress.Save;

namespace PilgrimsProgress.UI
{
    public class SaveLoadUI : MonoBehaviour
    {
        [Header("Panel")]
        [SerializeField] private GameObject _panel;
        [SerializeField] private TextMeshProUGUI _titleText;

        [Header("Slots")]
        [SerializeField] private Button[] _slotButtons;
        [SerializeField] private TextMeshProUGUI[] _slotLabels;
        [SerializeField] private TextMeshProUGUI[] _slotInfoTexts;

        [Header("Confirmation")]
        [SerializeField] private GameObject _confirmPanel;
        [SerializeField] private TextMeshProUGUI _confirmText;
        [SerializeField] private Button _confirmYes;
        [SerializeField] private Button _confirmNo;

        [Header("Navigation")]
        [SerializeField] private Button _closeButton;

        private bool _isSaveMode;
        private string _selectedSlot;

        private void Start()
        {
            if (_closeButton != null)
                _closeButton.onClick.AddListener(Close);

            if (_confirmYes != null)
                _confirmYes.onClick.AddListener(OnConfirmYes);

            if (_confirmNo != null)
                _confirmNo.onClick.AddListener(OnConfirmNo);

            if (_confirmPanel != null)
                _confirmPanel.SetActive(false);

            SetupSlotButtons();
        }

        public void OpenSave()
        {
            _isSaveMode = true;
            Open();
        }

        public void OpenLoad()
        {
            _isSaveMode = false;
            Open();
        }

        private void Open()
        {
            if (_panel != null) _panel.SetActive(true);

            var loc = ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) ? lm : null;
            if (_titleText != null && loc != null)
            {
                _titleText.text = _isSaveMode ? loc.Get("save_title") : loc.Get("load_title");
            }

            RefreshSlots();
        }

        public void Close()
        {
            if (_panel != null) _panel.SetActive(false);
        }

        private void SetupSlotButtons()
        {
            if (_slotButtons == null) return;

            string[] slotIds = { SaveManager.AutoSlotId, "slot_1", "slot_2", "slot_3" };

            for (int i = 0; i < _slotButtons.Length && i < slotIds.Length; i++)
            {
                string slotId = slotIds[i];
                int index = i;
                _slotButtons[i].onClick.AddListener(() => OnSlotClicked(slotId, index));
            }
        }

        private void RefreshSlots()
        {
            var saveManager = ServiceLocator.Get<SaveManager>();
            if (saveManager == null) return;

            var loc = ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) ? lm : null;
            var infos = saveManager.GetAllSlotInfos();

            for (int i = 0; i < _slotButtons.Length && i < infos.Length; i++)
            {
                var info = infos[i];

                if (i == 0 && _isSaveMode)
                {
                    _slotButtons[i].interactable = false;
                }
                else
                {
                    _slotButtons[i].interactable = _isSaveMode || !info.IsEmpty;
                }

                if (_slotLabels != null && i < _slotLabels.Length && loc != null)
                {
                    _slotLabels[i].text = i == 0
                        ? loc.Get("save_auto")
                        : $"{loc.Get("save_slot")} {i}";
                }

                if (_slotInfoTexts != null && i < _slotInfoTexts.Length && loc != null)
                {
                    _slotInfoTexts[i].text = info.IsEmpty
                        ? loc.Get("save_empty")
                        : $"Ch.{info.Chapter} | {info.SaveDate}";
                }
            }
        }

        private void OnSlotClicked(string slotId, int index)
        {
            _selectedSlot = slotId;
            ShowConfirmation();
        }

        private void ShowConfirmation()
        {
            if (_confirmPanel != null) _confirmPanel.SetActive(true);

            var loc = ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) ? lm : null;
            if (_confirmText != null && loc != null)
            {
                _confirmText.text = _isSaveMode ? loc.Get("save_confirm") : loc.Get("load_confirm");
            }
        }

        private void OnConfirmYes()
        {
            var saveManager = ServiceLocator.Get<SaveManager>();
            if (saveManager == null) return;

            if (_isSaveMode)
            {
                saveManager.SaveToSlot(_selectedSlot);
            }
            else
            {
                saveManager.LoadFromSlot(_selectedSlot);
            }

            if (_confirmPanel != null) _confirmPanel.SetActive(false);
            RefreshSlots();
        }

        private void OnConfirmNo()
        {
            if (_confirmPanel != null) _confirmPanel.SetActive(false);
        }
    }
}
