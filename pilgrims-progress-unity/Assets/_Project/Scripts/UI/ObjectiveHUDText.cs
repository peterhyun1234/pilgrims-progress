using UnityEngine;
using TMPro;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.UI
{
    public class ObjectiveHUDText : MonoBehaviour
    {
        private TextMeshProUGUI _objectiveText;
        private ChapterData _chapterData;

        public void Initialize(ChapterData data)
        {
            _chapterData = data;
            BuildUI();
        }

        private void BuildUI()
        {
            var go = new GameObject("ObjectiveText");
            go.transform.SetParent(transform, false);
            _objectiveText = go.AddComponent<TextMeshProUGUI>();
            _objectiveText.fontSize = 14;
            _objectiveText.color = new Color(1f, 0.9f, 0.6f, 0.8f);
            _objectiveText.alignment = TextAlignmentOptions.MidlineRight;
            _objectiveText.enableWordWrapping = false;
            var rt = _objectiveText.rectTransform;
            rt.anchorMin = new Vector2(0.50f, 0.88f);
            rt.anchorMax = new Vector2(0.98f, 0.92f);
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;
        }

        private void Update()
        {
            if (_objectiveText == null) return;

            var orderMgr = NPCOrderManager.Instance;
            if (orderMgr == null) return;

            var lm = ServiceLocator.TryGet<Localization.LocalizationManager>(out var l) ? l : null;
            bool isKo = lm != null && lm.CurrentLanguage == "ko";

            var target = orderMgr.GetCurrentTargetNPC();
            if (target != null)
            {
                string npcName = DialogueUI.GetLocalizedName(target.Value.Name, isKo ? "ko" : "en");
                _objectiveText.text = isKo
                    ? $"\u25B6 {npcName}\uc744(\ub97c) \ub9cc\ub098\uc138\uc694"
                    : $"\u25B6 Find {npcName}";
            }
            else if (orderMgr.AreAllRequiredCompleted())
            {
                _objectiveText.text = isKo ? "\u25B6 출구로 이동하세요" : "\u25B6 Head to the exit";
            }
            else
            {
                _objectiveText.text = "";
            }
        }
    }
}
