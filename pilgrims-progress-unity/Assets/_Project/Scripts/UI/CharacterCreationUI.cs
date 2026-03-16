using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PilgrimsProgress.Core;
using PilgrimsProgress.Player;

namespace PilgrimsProgress.UI
{
    public class CharacterCreationUI : MonoBehaviour
    {
        [Header("Panel")]
        [SerializeField] private GameObject _panel;
        [SerializeField] private CanvasGroup _canvasGroup;

        [Header("Title")]
        [SerializeField] private TextMeshProUGUI _titleText;

        [Header("Preview")]
        [SerializeField] private Image _previewImage;
        [SerializeField] private RectTransform _previewContainer;

        [Header("Name Input")]
        [SerializeField] private TMP_InputField _nameInput;
        [SerializeField] private TextMeshProUGUI _nameLabel;
        [SerializeField] private TextMeshProUGUI _nameHint;

        [Header("Skin Tone")]
        [SerializeField] private TextMeshProUGUI _skinLabel;
        [SerializeField] private Button _skinLeftButton;
        [SerializeField] private Button _skinRightButton;
        [SerializeField] private Image[] _skinDots;

        [Header("Hair Style")]
        [SerializeField] private TextMeshProUGUI _hairStyleLabel;
        [SerializeField] private Button _hairStyleLeftButton;
        [SerializeField] private Button _hairStyleRightButton;
        [SerializeField] private TextMeshProUGUI _hairStyleName;

        [Header("Hair Color")]
        [SerializeField] private TextMeshProUGUI _hairColorLabel;
        [SerializeField] private Button _hairColorLeftButton;
        [SerializeField] private Button _hairColorRightButton;
        [SerializeField] private Image[] _hairColorDots;

        [Header("Outfit")]
        [SerializeField] private TextMeshProUGUI _outfitLabel;
        [SerializeField] private Button _outfitLeftButton;
        [SerializeField] private Button _outfitRightButton;
        [SerializeField] private Image[] _outfitDots;

        [Header("Confirm")]
        [SerializeField] private Button _confirmButton;
        [SerializeField] private TextMeshProUGUI _confirmLabel;

        [Header("Back")]
        [SerializeField] private Button _backButton;

        private PlayerCustomization _editing = new PlayerCustomization();
        private PlayerCustomizationManager _manager;
        private CustomizationPresets _presets;
        private bool _uiGenerated;

        public event System.Action OnConfirmed;
        public event System.Action OnBack;

        private void Awake()
        {
            if (_panel != null)
                _panel.SetActive(false);
        }

        public void Show()
        {
            _manager = PlayerCustomizationManager.Instance;
            if (_manager == null)
                ServiceLocator.TryGet<PlayerCustomizationManager>(out _manager);
            _presets = _manager != null ? _manager.Presets : CustomizationPresets.CreateDefault();
            _editing = new PlayerCustomization();

            if (!_uiGenerated && _previewImage == null)
            {
                GenerateUI();
                _uiGenerated = true;
                KoreanFontSetup.ApplyToAll();
            }

            SetupListeners();
            UpdateLocalization();
            UpdatePreview();
            UpdateAllSelectors();
            ValidateConfirm();

            if (_panel != null)
            {
                _panel.SetActive(true);
                _panel.transform.SetAsLastSibling();
            }
        }

        public void Hide()
        {
            if (_panel != null)
                _panel.SetActive(false);
        }

        private void SetupListeners()
        {
            if (_nameInput != null)
            {
                _nameInput.onValueChanged.RemoveAllListeners();
                _nameInput.text = _editing.PlayerName;
                _nameInput.characterLimit = PlayerCustomization.MaxNameLength;
                _nameInput.onValueChanged.AddListener(OnNameChanged);
            }

            SetupCycleButtons(_skinLeftButton, _skinRightButton,
                () => CycleSkin(-1), () => CycleSkin(1));
            SetupCycleButtons(_hairStyleLeftButton, _hairStyleRightButton,
                () => CycleHairStyle(-1), () => CycleHairStyle(1));
            SetupCycleButtons(_hairColorLeftButton, _hairColorRightButton,
                () => CycleHairColor(-1), () => CycleHairColor(1));
            SetupCycleButtons(_outfitLeftButton, _outfitRightButton,
                () => CycleOutfit(-1), () => CycleOutfit(1));

            if (_confirmButton != null)
            {
                _confirmButton.onClick.RemoveAllListeners();
                _confirmButton.onClick.AddListener(OnConfirmClicked);
            }

            if (_backButton != null)
            {
                _backButton.onClick.RemoveAllListeners();
                _backButton.onClick.AddListener(() => OnBack?.Invoke());
            }
        }

        private void SetupCycleButtons(Button left, Button right,
            UnityEngine.Events.UnityAction onLeft, UnityEngine.Events.UnityAction onRight)
        {
            if (left != null)
            {
                left.onClick.RemoveAllListeners();
                left.onClick.AddListener(onLeft);
            }
            if (right != null)
            {
                right.onClick.RemoveAllListeners();
                right.onClick.AddListener(onRight);
            }
        }

        private void OnNameChanged(string newName)
        {
            _editing.PlayerName = newName;
            ValidateConfirm();
        }

        private void CycleSkin(int dir)
        {
            _editing.SkinToneIndex = Wrap(_editing.SkinToneIndex + dir, _presets.SkinTones.Length);
            UpdatePreview();
            UpdateDots(_skinDots, _editing.SkinToneIndex, _presets.SkinTones);
        }

        private void CycleHairStyle(int dir)
        {
            _editing.HairStyleIndex = Wrap(_editing.HairStyleIndex + dir, _presets.HairStyles.Length);
            UpdatePreview();
            if (_hairStyleName != null)
                _hairStyleName.text = _presets.HairStyles[_editing.HairStyleIndex].Name;
        }

        private void CycleHairColor(int dir)
        {
            _editing.HairColorIndex = Wrap(_editing.HairColorIndex + dir, _presets.HairColors.Length);
            UpdatePreview();
            UpdateDots(_hairColorDots, _editing.HairColorIndex, _presets.HairColors);
        }

        private void CycleOutfit(int dir)
        {
            _editing.OutfitColorIndex = Wrap(_editing.OutfitColorIndex + dir, _presets.OutfitColors.Length);
            UpdatePreview();
            UpdateDots(_outfitDots, _editing.OutfitColorIndex, _presets.OutfitColors);
        }

        private void UpdatePreview()
        {
            if (_previewImage == null) return;

            var sprite = CharacterSpriteBuilder.BuildPreview(_editing, _presets);
            if (sprite != null)
                _previewImage.sprite = sprite;
        }

        private void UpdateAllSelectors()
        {
            UpdateDots(_skinDots, _editing.SkinToneIndex, _presets.SkinTones);
            UpdateDots(_hairColorDots, _editing.HairColorIndex, _presets.HairColors);
            UpdateDots(_outfitDots, _editing.OutfitColorIndex, _presets.OutfitColors);

            if (_hairStyleName != null && _presets.HairStyles.Length > 0)
                _hairStyleName.text = _presets.HairStyles[_editing.HairStyleIndex].Name;
        }

        private void UpdateDots(Image[] dots, int selectedIndex, Color[] colors)
        {
            if (dots == null) return;

            for (int i = 0; i < dots.Length; i++)
            {
                if (dots[i] == null) continue;

                if (i < colors.Length)
                {
                    dots[i].gameObject.SetActive(true);
                    dots[i].color = colors[i];

                    float scale = (i == selectedIndex) ? 1.3f : 0.9f;
                    dots[i].transform.localScale = Vector3.one * scale;
                }
                else
                {
                    dots[i].gameObject.SetActive(false);
                }
            }
        }

        private void ValidateConfirm()
        {
            if (_confirmButton != null)
                _confirmButton.interactable = _editing.IsNameValid();
        }

        private void OnConfirmClicked()
        {
            if (!_editing.IsNameValid()) return;

            _editing.PlayerName = _editing.GetTrimmedName();
            _manager?.SetCustomization(_editing);

            Hide();
            OnConfirmed?.Invoke();
        }

        private void UpdateLocalization()
        {
            var loc = ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) ? lm : null;
            bool isKo = loc != null && loc.CurrentLanguage == "ko";

            if (_titleText != null)
                _titleText.text = isKo ? "순례자를 만드세요" : "Create Your Pilgrim";
            if (_nameLabel != null)
                _nameLabel.text = isKo ? "이름" : "Name";
            if (_nameHint != null)
                _nameHint.text = isKo ? "1~12자" : "1-12 chars";
            if (_skinLabel != null)
                _skinLabel.text = isKo ? "피부" : "Skin";
            if (_hairStyleLabel != null)
                _hairStyleLabel.text = isKo ? "머리 모양" : "Hair Style";
            if (_hairColorLabel != null)
                _hairColorLabel.text = isKo ? "머리 색" : "Hair Color";
            if (_outfitLabel != null)
                _outfitLabel.text = isKo ? "의상" : "Outfit";
            if (_confirmLabel != null)
                _confirmLabel.text = isKo ? "순례 시작" : "Begin Journey";
        }

        private int Wrap(int value, int count)
        {
            if (count <= 0) return 0;
            return ((value % count) + count) % count;
        }

        private void GenerateUI()
        {
            var gold = new Color(0.90f, 0.78f, 0.45f);
            var goldDim = new Color(0.65f, 0.55f, 0.30f);

            if (_panel == null)
            {
                // Find the root canvas to parent this panel to
                var rootCanvas = GetComponentInParent<Canvas>();
                var parentTransform = rootCanvas != null ? rootCanvas.transform : transform;

                _panel = new GameObject("CharacterCreationPanel");
                _panel.transform.SetParent(parentTransform, false);
                var rt = _panel.AddComponent<RectTransform>();
                rt.anchorMin = Vector2.zero;
                rt.anchorMax = Vector2.one;
                rt.sizeDelta = Vector2.zero;
                rt.anchoredPosition = Vector2.zero;
            }

            var canvasGo = _panel;

            var bg = CreateImage(canvasGo.transform, "Background",
                Vector2.zero, Vector2.one, new Color(0.05f, 0.04f, 0.10f, 0.97f));

            // Title with golden text
            _titleText = CreateTMP(canvasGo.transform, "Title", 40, gold,
                new Vector2(0.05f, 0.89f), new Vector2(0.95f, 0.97f));
            _titleText.fontStyle = FontStyles.Bold;

            // Decorative line under title
            var decoLine = CreateImage(canvasGo.transform, "TitleDeco",
                new Vector2(0.30f, 0.885f), new Vector2(0.70f, 0.888f), goldDim);
            decoLine.raycastTarget = false;

            // Preview area with border
            var previewBorder = CreateImage(canvasGo.transform, "PreviewBorder",
                new Vector2(0.06f, 0.20f), new Vector2(0.40f, 0.87f),
                new Color(0.20f, 0.16f, 0.28f, 0.6f));
            previewBorder.raycastTarget = false;

            var previewBg = CreateImage(canvasGo.transform, "PreviewBg",
                new Vector2(0.07f, 0.21f), new Vector2(0.39f, 0.86f),
                new Color(0.10f, 0.08f, 0.16f));

            var previewGo = new GameObject("Preview");
            previewGo.transform.SetParent(previewBg.transform, false);
            _previewImage = previewGo.AddComponent<Image>();
            _previewImage.preserveAspect = true;
            var pRect = _previewImage.rectTransform;
            pRect.anchorMin = new Vector2(0.10f, 0.10f);
            pRect.anchorMax = new Vector2(0.90f, 0.90f);
            pRect.sizeDelta = Vector2.zero;
            pRect.anchoredPosition = Vector2.zero;

            // Options panel (right side)
            float optY = 0.82f;
            float optStep = 0.115f;
            float optLeft = 0.42f;
            float optRight = 0.94f;

            // Name row
            _nameLabel = CreateTMP(canvasGo.transform, "NameLabel", 20, gold,
                new Vector2(optLeft, optY - 0.03f), new Vector2(optLeft + 0.10f, optY + 0.03f));
            _nameLabel.alignment = TextAlignmentOptions.MidlineRight;

            var inputGo = new GameObject("NameInput");
            inputGo.transform.SetParent(canvasGo.transform, false);
            var inputBg = inputGo.AddComponent<Image>();
            inputBg.color = new Color(0.14f, 0.12f, 0.20f);
            var inputRect = inputBg.rectTransform;
            inputRect.anchorMin = new Vector2(optLeft + 0.12f, optY - 0.028f);
            inputRect.anchorMax = new Vector2(optRight, optY + 0.028f);
            inputRect.sizeDelta = Vector2.zero;
            inputRect.anchoredPosition = Vector2.zero;

            var textArea = new GameObject("Text Area");
            textArea.transform.SetParent(inputGo.transform, false);
            var taRect = textArea.AddComponent<RectTransform>();
            taRect.anchorMin = new Vector2(0.04f, 0.05f);
            taRect.anchorMax = new Vector2(0.96f, 0.95f);
            taRect.sizeDelta = Vector2.zero;
            taRect.anchoredPosition = Vector2.zero;

            var inputTextGo = new GameObject("Text");
            inputTextGo.transform.SetParent(textArea.transform, false);
            var inputTMP = inputTextGo.AddComponent<TextMeshProUGUI>();
            inputTMP.fontSize = 20;
            inputTMP.color = Color.white;
            var itRect = inputTMP.rectTransform;
            itRect.anchorMin = Vector2.zero;
            itRect.anchorMax = Vector2.one;
            itRect.sizeDelta = Vector2.zero;
            itRect.anchoredPosition = Vector2.zero;

            _nameInput = inputGo.AddComponent<TMP_InputField>();
            _nameInput.textComponent = inputTMP;
            _nameInput.textViewport = taRect;

            _nameHint = CreateTMP(canvasGo.transform, "NameHint", 13,
                new Color(0.6f, 0.55f, 0.5f),
                new Vector2(optRight - 0.10f, optY - 0.055f),
                new Vector2(optRight, optY - 0.03f));
            _nameHint.alignment = TextAlignmentOptions.TopRight;

            optY -= optStep;

            // Skin
            CreateOptionRow(canvasGo.transform, "Skin", ref _skinLabel, ref _skinLeftButton,
                ref _skinRightButton, optLeft, optRight, optY, out _skinDots, _presets.SkinTones.Length);

            optY -= optStep;

            // Hair Style
            _hairStyleLabel = CreateTMP(canvasGo.transform, "HairStyleLabel", 20, gold,
                new Vector2(optLeft, optY - 0.03f), new Vector2(optLeft + 0.12f, optY + 0.03f));
            _hairStyleLabel.alignment = TextAlignmentOptions.MidlineRight;

            _hairStyleLeftButton = CreateArrowButton(canvasGo.transform, "HairStyleLeft",
                new Vector2(optLeft + 0.14f, optY - 0.025f),
                new Vector2(optLeft + 0.19f, optY + 0.025f), "<");
            _hairStyleRightButton = CreateArrowButton(canvasGo.transform, "HairStyleRight",
                new Vector2(optRight - 0.07f, optY - 0.025f),
                new Vector2(optRight - 0.02f, optY + 0.025f), ">");

            _hairStyleName = CreateTMP(canvasGo.transform, "HairStyleName", 18, Color.white,
                new Vector2(optLeft + 0.21f, optY - 0.025f),
                new Vector2(optRight - 0.09f, optY + 0.025f));

            optY -= optStep;

            // Hair Color
            CreateOptionRow(canvasGo.transform, "HairColor", ref _hairColorLabel, ref _hairColorLeftButton,
                ref _hairColorRightButton, optLeft, optRight, optY, out _hairColorDots, _presets.HairColors.Length);

            optY -= optStep;

            // Outfit
            CreateOptionRow(canvasGo.transform, "Outfit", ref _outfitLabel, ref _outfitLeftButton,
                ref _outfitRightButton, optLeft, optRight, optY, out _outfitDots, _presets.OutfitColors.Length);

            // Confirm button (green, centered bottom)
            var confirmGo = new GameObject("ConfirmBtn");
            confirmGo.transform.SetParent(canvasGo.transform, false);
            var confirmImg = confirmGo.AddComponent<Image>();
            confirmImg.color = new Color(0.18f, 0.40f, 0.25f);
            var cRect = confirmImg.rectTransform;
            cRect.anchorMin = new Vector2(0.30f, 0.06f);
            cRect.anchorMax = new Vector2(0.70f, 0.14f);
            cRect.sizeDelta = Vector2.zero;
            cRect.anchoredPosition = Vector2.zero;
            _confirmButton = confirmGo.AddComponent<Button>();
            _confirmButton.targetGraphic = confirmImg;

            _confirmLabel = CreateTMP(confirmGo.transform, "ConfirmLabel", 24, Color.white,
                Vector2.zero, Vector2.one);
            _confirmLabel.fontStyle = FontStyles.Bold;

            // Back button (top-left)
            var backGo = new GameObject("BackBtn");
            backGo.transform.SetParent(canvasGo.transform, false);
            var backImg = backGo.AddComponent<Image>();
            backImg.color = new Color(0.22f, 0.18f, 0.18f, 0.8f);
            var bRect = backImg.rectTransform;
            bRect.anchorMin = new Vector2(0.02f, 0.92f);
            bRect.anchorMax = new Vector2(0.10f, 0.98f);
            bRect.sizeDelta = Vector2.zero;
            bRect.anchoredPosition = Vector2.zero;
            _backButton = backGo.AddComponent<Button>();
            _backButton.targetGraphic = backImg;

            var backLabel = CreateTMP(backGo.transform, "BackLabel", 18, new Color(0.8f, 0.7f, 0.6f),
                Vector2.zero, Vector2.one);
            backLabel.text = "\u25C0";
        }

        private void CreateOptionRow(Transform parent, string name,
            ref TextMeshProUGUI label, ref Button leftBtn, ref Button rightBtn,
            float left, float right, float y, out Image[] dots, int dotCount)
        {
            var gold = new Color(0.90f, 0.78f, 0.45f);
            label = CreateTMP(parent, $"{name}Label", 20, gold,
                new Vector2(left, y - 0.03f), new Vector2(left + 0.12f, y + 0.03f));
            label.alignment = TextAlignmentOptions.MidlineRight;

            leftBtn = CreateArrowButton(parent, $"{name}Left",
                new Vector2(left + 0.14f, y - 0.025f), new Vector2(left + 0.19f, y + 0.025f), "<");
            rightBtn = CreateArrowButton(parent, $"{name}Right",
                new Vector2(right - 0.07f, y - 0.025f), new Vector2(right - 0.02f, y + 0.025f), ">");

            dots = new Image[dotCount];
            float dotSpan = (right - 0.08f) - (left + 0.20f);
            float dotStep = dotCount > 1 ? dotSpan / (dotCount - 1) : 0;

            for (int i = 0; i < dotCount; i++)
            {
                float dx = left + 0.20f + i * dotStep;
                var dotGo = new GameObject($"{name}Dot{i}");
                dotGo.transform.SetParent(parent, false);
                dots[i] = dotGo.AddComponent<Image>();
                var dr = dots[i].rectTransform;
                dr.anchorMin = new Vector2(dx - 0.012f, y - 0.015f);
                dr.anchorMax = new Vector2(dx + 0.012f, y + 0.015f);
                dr.sizeDelta = Vector2.zero;
                dr.anchoredPosition = Vector2.zero;
                dr.localScale = Vector3.one;
            }
        }

        private Button CreateArrowButton(Transform parent, string name,
            Vector2 anchorMin, Vector2 anchorMax, string arrow)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var img = go.AddComponent<Image>();
            img.color = new Color(0.18f, 0.15f, 0.25f, 0.9f);
            var rt = img.rectTransform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;

            var tmp = CreateTMP(go.transform, "Arrow", 22,
                new Color(0.85f, 0.75f, 0.50f), Vector2.zero, Vector2.one);
            tmp.text = arrow;
            tmp.fontStyle = FontStyles.Bold;

            var btn = go.AddComponent<Button>();
            btn.targetGraphic = img;
            return btn;
        }

        private Image CreateImage(Transform parent, string name,
            Vector2 anchorMin, Vector2 anchorMax, Color color)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var img = go.AddComponent<Image>();
            img.color = color;
            var rt = img.rectTransform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;
            return img;
        }

        private TextMeshProUGUI CreateTMP(Transform parent, string name, int size,
            Color color, Vector2 anchorMin, Vector2 anchorMax)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var tmp = go.AddComponent<TextMeshProUGUI>();
            tmp.fontSize = size;
            tmp.color = color;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.enableWordWrapping = true;
            tmp.overflowMode = TextOverflowModes.Ellipsis;
            var rt = tmp.rectTransform;
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;
            return tmp;
        }
    }
}
