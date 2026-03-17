using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PilgrimsProgress.Core;
using PilgrimsProgress.Narrative;

namespace PilgrimsProgress.UI
{
    public class BuffIconDisplay : MonoBehaviour
    {
        private readonly List<GameObject> _activeIcons = new List<GameObject>();
        private Transform _container;

        private void Start()
        {
            BuildContainer();

            var stats = StatsManager.Instance;
            if (stats != null)
            {
                stats.OnStatChanged += OnStatChanged;
                stats.OnBurdenChanged += OnBurdenChanged;
            }
        }

        private void BuildContainer()
        {
            var go = new GameObject("BuffIcons");
            go.transform.SetParent(transform, false);
            _container = go.AddComponent<RectTransform>();
            var rt = (RectTransform)_container;
            rt.anchorMin = new Vector2(0.02f, 0.82f);
            rt.anchorMax = new Vector2(0.20f, 0.86f);
            rt.sizeDelta = Vector2.zero;
            rt.anchoredPosition = Vector2.zero;
        }

        private void OnStatChanged(string stat, int oldVal, int newVal)
        {
            int delta = newVal - oldVal;
            if (delta == 0) return;

            Color color;
            string icon;
            if (delta > 0)
            {
                color = stat.ToLower() switch
                {
                    "faith" => new Color(0.95f, 0.85f, 0.3f),
                    "courage" => new Color(0.3f, 0.6f, 0.95f),
                    "wisdom" => new Color(0.4f, 0.85f, 0.4f),
                    _ => Color.white
                };
                icon = $"\u25B2 {stat} +{delta}";
            }
            else
            {
                color = new Color(0.9f, 0.3f, 0.3f);
                icon = $"\u25BC {stat} {delta}";
            }

            ShowFloatingIcon(icon, color);
        }

        private void OnBurdenChanged(int oldVal, int newVal)
        {
            int delta = newVal - oldVal;
            if (delta == 0) return;

            Color color = delta > 0
                ? new Color(0.6f, 0.4f, 0.2f)
                : new Color(0.4f, 0.9f, 0.4f);
            string icon = delta > 0
                ? $"\u25B2 Burden +{delta}"
                : $"\u25BC Burden {delta}";

            ShowFloatingIcon(icon, color);
        }

        private void ShowFloatingIcon(string text, Color color)
        {
            if (_container == null) return;

            var go = new GameObject("BuffIcon");
            go.transform.SetParent(_container, false);
            var tmp = go.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = 14;
            tmp.color = color;
            tmp.alignment = TextAlignmentOptions.MidlineLeft;
            tmp.enableWordWrapping = false;

            var rt = tmp.rectTransform;
            rt.anchorMin = new Vector2(0, 1f - _activeIcons.Count * 0.3f);
            rt.anchorMax = new Vector2(1, 1f - _activeIcons.Count * 0.3f + 0.25f);
            rt.sizeDelta = Vector2.zero;

            _activeIcons.Add(go);
            StartCoroutine(FadeAndRemove(go, tmp));
        }

        private IEnumerator FadeAndRemove(GameObject go, TextMeshProUGUI tmp)
        {
            yield return new WaitForSeconds(2f);

            float t = 0;
            Color startColor = tmp.color;
            while (t < 0.5f)
            {
                t += Time.deltaTime;
                tmp.color = new Color(startColor.r, startColor.g, startColor.b, 1f - t / 0.5f);
                yield return null;
            }

            _activeIcons.Remove(go);
            Destroy(go);
        }

        private void OnDestroy()
        {
            var stats = StatsManager.Instance;
            if (stats != null)
            {
                stats.OnStatChanged -= OnStatChanged;
                stats.OnBurdenChanged -= OnBurdenChanged;
            }
        }
    }
}
