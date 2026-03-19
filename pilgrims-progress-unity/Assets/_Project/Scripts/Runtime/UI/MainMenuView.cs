using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using TMPro;
using PP.Core;

namespace PP.UI
{
    public class MainMenuView : MonoBehaviour
    {
        private Canvas _canvas;
        private Button _continueBtn;

        private void Start()
        {
            FontManager.GetKoreanFont();
            BuildUI();

            if (_continueBtn != null)
                _continueBtn.interactable = PP.Save.SaveManager.Instance?.HasSave() ?? false;
        }

        private bool IsKorean => GameManager.Instance?.CurrentLanguage == "ko";

        private void BuildUI()
        {
            var canvasGo = new GameObject("MainMenuCanvas");
            canvasGo.transform.SetParent(transform, false);
            _canvas = canvasGo.AddComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _canvas.sortingOrder = 10;

            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;

            canvasGo.AddComponent<GraphicRaycaster>();

            CreateFullscreenBG(canvasGo.transform);
            CreateVignette(canvasGo.transform);
            CreateTitleSection(canvasGo.transform);
            CreateMenuButtons(canvasGo.transform);
            CreateCredits(canvasGo.transform);

            FontManager.ApplyToAll(canvasGo);
        }

        private void CreateFullscreenBG(Transform parent)
        {
            var go = new GameObject("BG");
            go.transform.SetParent(parent, false);
            var img = go.AddComponent<Image>();
            img.color = new Color(0.035f, 0.025f, 0.055f, 1f);
            img.raycastTarget = false;
            StretchFull(img.rectTransform);
        }

        private void CreateVignette(Transform parent)
        {
            var go = new GameObject("Vignette");
            go.transform.SetParent(parent, false);
            var img = go.AddComponent<Image>();
            img.color = new Color(0.06f, 0.04f, 0.08f, 0.3f);
            img.raycastTarget = false;
            StretchFull(img.rectTransform);
        }

        private void CreateTitleSection(Transform parent)
        {
            var title = MakeText(parent, "Title",
                IsKorean ? "천로역정" : "Pilgrim's Progress",
                48, new Color(0.95f, 0.88f, 0.55f), FontStyles.Bold);
            var trt = title.GetComponent<RectTransform>();
            trt.anchorMin = new Vector2(0.1f, 0.72f);
            trt.anchorMax = new Vector2(0.9f, 0.82f);
            trt.sizeDelta = Vector2.zero;

            var subtitle = MakeText(parent, "Subtitle",
                IsKorean ? "The Pilgrim's Progress" : "천로역정",
                20, new Color(0.55f, 0.50f, 0.40f, 0.7f));
            var srt = subtitle.GetComponent<RectTransform>();
            srt.anchorMin = new Vector2(0.1f, 0.67f);
            srt.anchorMax = new Vector2(0.9f, 0.72f);
            srt.sizeDelta = Vector2.zero;

            var divider = new GameObject("Divider");
            divider.transform.SetParent(parent, false);
            var dimg = divider.AddComponent<Image>();
            dimg.color = new Color(0.95f, 0.88f, 0.55f, 0.2f);
            dimg.raycastTarget = false;
            var drt = dimg.rectTransform;
            drt.anchorMin = new Vector2(0.35f, 0.665f);
            drt.anchorMax = new Vector2(0.65f, 0.667f);
            drt.sizeDelta = Vector2.zero;
        }

        private void CreateMenuButtons(Transform parent)
        {
            float startY = 0.55f;
            float gap = 0.075f;

            MakeMenuButton(parent, "NewGame",
                IsKorean ? "새 여정 시작" : "New Game",
                new Vector2(0.5f, startY), OnNewGame);

            _continueBtn = MakeMenuButton(parent, "Continue",
                IsKorean ? "이어하기" : "Continue",
                new Vector2(0.5f, startY - gap), OnContinue);

            MakeMenuButton(parent, "Settings",
                IsKorean ? "설정" : "Settings",
                new Vector2(0.5f, startY - gap * 2), OnSettings);

            MakeMenuButton(parent, "Language",
                IsKorean ? "언어 변경" : "Language",
                new Vector2(0.5f, startY - gap * 3), OnLanguageChange);
        }

        private void CreateCredits(Transform parent)
        {
            var credit = MakeText(parent, "Credit",
                "Based on John Bunyan's \"The Pilgrim's Progress\" (1678)",
                12, new Color(0.3f, 0.28f, 0.25f, 0.5f));
            var crt = credit.GetComponent<RectTransform>();
            crt.anchorMin = new Vector2(0.1f, 0.02f);
            crt.anchorMax = new Vector2(0.9f, 0.05f);
            crt.sizeDelta = Vector2.zero;
        }

        private void OnNewGame()
        {
            var gm = GameManager.Instance;
            if (gm != null)
            {
                gm.CurrentChapter = 0;
                gm.SetPhase(GamePhase.Gameplay);
            }
            SceneManager.LoadScene("Gameplay");
        }

        private void OnContinue()
        {
            PP.Save.SaveManager.Instance?.Load();
            GameManager.Instance?.SetPhase(GamePhase.Gameplay);
            SceneManager.LoadScene("Gameplay");
        }

        private void OnSettings()
        {
            Debug.Log("[MainMenu] Settings — not yet implemented");
        }

        private void OnLanguageChange()
        {
            var gm = GameManager.Instance;
            if (gm != null)
            {
                gm.HasLanguageBeenSelected = false;
                PlayerPrefs.Save();
            }
            Destroy(gameObject);
            Bootstrap.ShowLanguageSelect();
        }

        #region UI Helpers

        private static GameObject MakeText(Transform parent, string name,
            string text, int fontSize, Color color, FontStyles style = FontStyles.Normal)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var tmp = go.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = fontSize;
            tmp.color = color;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.fontStyle = style;
            tmp.raycastTarget = false;
            return go;
        }

        private static Button MakeMenuButton(Transform parent, string name,
            string label, Vector2 center, UnityEngine.Events.UnityAction onClick)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);

            var img = go.AddComponent<Image>();
            img.color = new Color(0.10f, 0.08f, 0.14f, 0.85f);

            var rt = img.rectTransform;
            float halfW = 0.18f;
            float halfH = 0.025f;
            rt.anchorMin = new Vector2(center.x - halfW, center.y - halfH);
            rt.anchorMax = new Vector2(center.x + halfW, center.y + halfH);
            rt.sizeDelta = Vector2.zero;

            var outline = go.AddComponent<Outline>();
            outline.effectColor = new Color(0.95f, 0.88f, 0.55f, 0.15f);
            outline.effectDistance = new Vector2(1, -1);

            var btn = go.AddComponent<Button>();
            var colors = btn.colors;
            colors.normalColor = new Color(0.10f, 0.08f, 0.14f, 0.85f);
            colors.highlightedColor = new Color(0.18f, 0.14f, 0.26f, 0.95f);
            colors.pressedColor = new Color(0.28f, 0.22f, 0.40f, 1f);
            colors.selectedColor = new Color(0.14f, 0.11f, 0.20f, 0.9f);
            btn.colors = colors;
            btn.onClick.AddListener(onClick);

            var labelGo = new GameObject("Label");
            labelGo.transform.SetParent(go.transform, false);
            var tmp = labelGo.AddComponent<TextMeshProUGUI>();
            tmp.text = label;
            tmp.fontSize = 22;
            tmp.color = new Color(0.90f, 0.83f, 0.58f);
            tmp.alignment = TextAlignmentOptions.Center;
            StretchFull(tmp.rectTransform);

            return btn;
        }

        private static void StretchFull(RectTransform rt)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.sizeDelta = Vector2.zero;
        }

        #endregion
    }
}
