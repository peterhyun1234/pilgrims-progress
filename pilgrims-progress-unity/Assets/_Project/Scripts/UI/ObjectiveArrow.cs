using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.UI
{
    public class ObjectiveArrow : MonoBehaviour
    {
        private RectTransform _arrowRect;
        private TextMeshProUGUI _distanceText;
        private TextMeshProUGUI _nameText;
        private Image _arrowImage;
        private Transform _playerTransform;
        private CanvasGroup _canvasGroup;

        private const float EdgePadding = 80f;
        private const float ShowDistance = 3f;
        private const float PulseSpeed = 2f;

        public void Initialize(Transform player)
        {
            _playerTransform = player;
            BuildUI();
        }

        private void BuildUI()
        {
            var go = new GameObject("ObjectiveArrowUI");
            go.transform.SetParent(transform, false);
            _canvasGroup = go.AddComponent<CanvasGroup>();

            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.sizeDelta = Vector2.zero;

            var arrowGo = new GameObject("Arrow");
            arrowGo.transform.SetParent(go.transform, false);
            _arrowImage = arrowGo.AddComponent<Image>();
            _arrowImage.color = new Color(1f, 0.85f, 0.3f, 0.9f);
            _arrowRect = _arrowImage.rectTransform;
            _arrowRect.sizeDelta = new Vector2(30, 30);

            var arrowTex = CreateArrowTexture();
            _arrowImage.sprite = Sprite.Create(arrowTex,
                new Rect(0, 0, arrowTex.width, arrowTex.height),
                new Vector2(0.5f, 0.5f));

            var nameGo = new GameObject("ObjectiveName");
            nameGo.transform.SetParent(go.transform, false);
            _nameText = nameGo.AddComponent<TextMeshProUGUI>();
            _nameText.fontSize = 14;
            _nameText.color = new Color(1f, 0.9f, 0.5f);
            _nameText.alignment = TextAlignmentOptions.Center;
            _nameText.enableWordWrapping = false;
            var nameRt = _nameText.rectTransform;
            nameRt.sizeDelta = new Vector2(200, 24);

            var distGo = new GameObject("Distance");
            distGo.transform.SetParent(go.transform, false);
            _distanceText = distGo.AddComponent<TextMeshProUGUI>();
            _distanceText.fontSize = 12;
            _distanceText.color = new Color(1f, 1f, 1f, 0.7f);
            _distanceText.alignment = TextAlignmentOptions.Center;
            _distanceText.enableWordWrapping = false;
            var distRt = _distanceText.rectTransform;
            distRt.sizeDelta = new Vector2(100, 20);
        }

        private void Update()
        {
            var orderMgr = NPCOrderManager.Instance;
            if (orderMgr == null || _playerTransform == null)
            {
                SetVisible(false);
                return;
            }

            var targetPos = orderMgr.GetCurrentTargetPosition();
            if (targetPos == null)
            {
                if (orderMgr.AreAllRequiredCompleted())
                    UpdateExitArrow();
                else
                    SetVisible(false);
                return;
            }

            UpdateArrow(targetPos.Value, GetTargetName(orderMgr));
        }

        private void UpdateExitArrow()
        {
            var chapterMgr = ChapterManager.Instance;
            if (chapterMgr == null || chapterMgr.CurrentChapter >= ChapterManager.TotalChapters)
            {
                SetVisible(false);
                return;
            }

            var data = ChapterDatabase.Get(chapterMgr.CurrentChapter);
            var lm = ServiceLocator.TryGet<Localization.LocalizationManager>(out var l) ? l : null;
            string label = lm != null && lm.CurrentLanguage == "ko" ? "출구" : "Exit";
            UpdateArrow(data.ExitPosition, label);
        }

        private void UpdateArrow(Vector3 worldTarget, string label)
        {
            if (_playerTransform == null) return;

            Vector3 dir = worldTarget - _playerTransform.position;
            float dist = dir.magnitude;

            if (dist < ShowDistance)
            {
                SetVisible(false);
                return;
            }

            SetVisible(true);

            float angle = Mathf.Atan2(dir.y, dir.x) * Mathf.Rad2Deg;
            _arrowRect.rotation = Quaternion.Euler(0, 0, angle - 90f);

            var cam = Camera.main;
            if (cam == null) return;

            Vector3 screenPos = cam.WorldToScreenPoint(worldTarget);
            float sw = Screen.width;
            float sh = Screen.height;

            bool onScreen = screenPos.x > EdgePadding && screenPos.x < sw - EdgePadding
                         && screenPos.y > EdgePadding && screenPos.y < sh - EdgePadding
                         && screenPos.z > 0;

            if (!onScreen)
            {
                Vector3 center = new Vector3(sw / 2f, sh / 2f, 0);
                Vector3 fromCenter = screenPos - center;
                float maxX = (sw / 2f) - EdgePadding;
                float maxY = (sh / 2f) - EdgePadding;
                float scale = Mathf.Min(maxX / Mathf.Abs(fromCenter.x + 0.001f),
                                         maxY / Mathf.Abs(fromCenter.y + 0.001f));
                screenPos = center + fromCenter * Mathf.Min(scale, 1f);
            }

            _arrowRect.position = screenPos;
            _nameText.rectTransform.position = screenPos + Vector3.up * 28f;
            _distanceText.rectTransform.position = screenPos + Vector3.down * 22f;

            _nameText.text = label;
            _distanceText.text = $"{dist:F0}m";

            float pulse = 0.7f + 0.3f * Mathf.Sin(Time.time * PulseSpeed);
            _arrowImage.color = new Color(1f, 0.85f, 0.3f, pulse);
        }

        private string GetTargetName(NPCOrderManager orderMgr)
        {
            var target = orderMgr.GetCurrentTargetNPC();
            if (target == null) return "";

            var lm = ServiceLocator.TryGet<Localization.LocalizationManager>(out var l) ? l : null;
            string lang = lm != null ? lm.CurrentLanguage : "en";
            return DialogueUI.GetLocalizedName(target.Value.Name, lang);
        }

        private void SetVisible(bool visible)
        {
            if (_canvasGroup != null)
                _canvasGroup.alpha = visible ? 1f : 0f;
        }

        private static Texture2D CreateArrowTexture()
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];

            for (int x = 0; x < s; x++)
            {
                for (int y = 0; y < s; y++)
                {
                    int i = y * s + x;
                    bool isArrow = (y >= s / 2) && Mathf.Abs(x - s / 2) <= (y - s / 2 + 1);
                    bool isStem = (y < s / 2 && y >= 2) && (x >= s / 2 - 2 && x <= s / 2 + 1);
                    pixels[i] = (isArrow || isStem) ? Color.white : Color.clear;
                }
            }

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return tex;
        }
    }
}
