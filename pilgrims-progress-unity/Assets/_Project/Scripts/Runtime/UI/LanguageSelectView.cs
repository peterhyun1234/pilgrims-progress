using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PP.Core;

namespace PP.UI
{
    public class LanguageSelectView : MonoBehaviour
    {
        private Canvas _canvas;

        private void Start()
        {
            FontManager.GetKoreanFont();
            BuildUI();
        }

        private void BuildUI()
        {
            var canvasGo = new GameObject("LanguageSelectCanvas");
            canvasGo.transform.SetParent(transform, false);
            _canvas = canvasGo.AddComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _canvas.sortingOrder = 100;

            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();

            var bg = new GameObject("BG");
            bg.transform.SetParent(canvasGo.transform, false);
            var bgImg = bg.AddComponent<Image>();
            bgImg.color = new Color(0.025f, 0.02f, 0.04f, 1f);
            bgImg.raycastTarget = true;
            StretchFull(bgImg.rectTransform);

            MakeLabel(canvasGo.transform, "TitleEN", "Select Language",
                32, new Color(0.85f, 0.8f, 0.65f), 0.68f);

            MakeLabel(canvasGo.transform, "TitleKO", "언어를 선택하세요",
                24, new Color(0.6f, 0.55f, 0.45f, 0.7f), 0.62f);

            var divider = new GameObject("Divider");
            divider.transform.SetParent(canvasGo.transform, false);
            var dimg = divider.AddComponent<Image>();
            dimg.color = new Color(0.85f, 0.8f, 0.65f, 0.15f);
            dimg.raycastTarget = false;
            var drt = dimg.rectTransform;
            drt.anchorMin = new Vector2(0.38f, 0.595f);
            drt.anchorMax = new Vector2(0.62f, 0.597f);
            drt.sizeDelta = Vector2.zero;

            MakeLangButton(canvasGo.transform, "BtnEN", "English", 0.50f, "en");
            MakeLangButton(canvasGo.transform, "BtnKO", "한국어", 0.42f, "ko");

            FontManager.ApplyToAll(canvasGo);
        }

        private void SelectLanguage(string langCode)
        {
            var gm = GameManager.Instance;
            if (gm != null)
            {
                gm.CurrentLanguage = langCode;
                gm.HasLanguageBeenSelected = true;
                gm.SetPhase(GamePhase.MainMenu);
            }
            Destroy(gameObject);
            Bootstrap.ShowMainMenu();
        }

        private void MakeLangButton(Transform parent, string name, string label,
            float centerY, string langCode)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);

            var img = go.AddComponent<Image>();
            img.color = new Color(0.10f, 0.08f, 0.14f, 0.9f);

            var rt = img.rectTransform;
            rt.anchorMin = new Vector2(0.32f, centerY - 0.03f);
            rt.anchorMax = new Vector2(0.68f, centerY + 0.03f);
            rt.sizeDelta = Vector2.zero;

            var outline = go.AddComponent<Outline>();
            outline.effectColor = new Color(0.85f, 0.8f, 0.55f, 0.12f);
            outline.effectDistance = new Vector2(1, -1);

            var btn = go.AddComponent<Button>();
            var colors = btn.colors;
            colors.normalColor = new Color(0.10f, 0.08f, 0.14f, 0.9f);
            colors.highlightedColor = new Color(0.18f, 0.14f, 0.26f, 0.95f);
            colors.pressedColor = new Color(0.28f, 0.22f, 0.40f, 1f);
            btn.colors = colors;

            string code = langCode;
            btn.onClick.AddListener(() => SelectLanguage(code));

            var labelGo = new GameObject("Label");
            labelGo.transform.SetParent(go.transform, false);
            var tmp = labelGo.AddComponent<TextMeshProUGUI>();
            tmp.text = label;
            tmp.fontSize = 28;
            tmp.color = new Color(0.92f, 0.86f, 0.6f);
            tmp.alignment = TextAlignmentOptions.Center;
            StretchFull(tmp.rectTransform);
        }

        private static void MakeLabel(Transform parent, string name, string text,
            int fontSize, Color color, float centerY)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var tmp = go.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = fontSize;
            tmp.color = color;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.raycastTarget = false;
            var rt = tmp.rectTransform;
            rt.anchorMin = new Vector2(0.1f, centerY - 0.025f);
            rt.anchorMax = new Vector2(0.9f, centerY + 0.025f);
            rt.sizeDelta = Vector2.zero;
        }

        private static void StretchFull(RectTransform rt)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.sizeDelta = Vector2.zero;
        }
    }
}
