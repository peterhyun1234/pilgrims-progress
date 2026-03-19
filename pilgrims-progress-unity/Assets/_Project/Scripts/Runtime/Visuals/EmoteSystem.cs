using System.Collections;
using UnityEngine;

namespace PP.Visuals
{
    public class EmoteSystem : MonoBehaviour
    {
        [SerializeField] private Sprite[] _emoteSprites;
        [SerializeField] private float _displayDuration = 1.5f;
        [SerializeField] private float _floatHeight = 0.8f;

        public void ShowEmote(Transform target, string emotionType)
        {
            int idx = EmotionToIndex(emotionType);
            if (idx < 0 || _emoteSprites == null || idx >= _emoteSprites.Length) return;
            StartCoroutine(EmoteRoutine(target, _emoteSprites[idx]));
        }

        private IEnumerator EmoteRoutine(Transform target, Sprite sprite)
        {
            var go = new GameObject("Emote");
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = sprite;
            sr.sortingOrder = 100;

            Vector3 startPos = target.position + Vector3.up * 1.2f;
            go.transform.position = startPos;

            float t = 0;
            while (t < _displayDuration)
            {
                t += Time.deltaTime;
                float y = Mathf.Sin(t * 3f) * 0.05f;
                go.transform.position = startPos + Vector3.up * (_floatHeight * (t / _displayDuration)) + Vector3.up * y;

                float alpha = t < _displayDuration * 0.8f ? 1f : Mathf.Lerp(1, 0, (t - _displayDuration * 0.8f) / (_displayDuration * 0.2f));
                sr.color = new Color(1, 1, 1, alpha);
                yield return null;
            }

            Destroy(go);
        }

        private static int EmotionToIndex(string emotion) => emotion?.ToLower() switch
        {
            "angry" or "rage" => 0,
            "sad" or "sorrowful" => 1,
            "happy" or "joyful" => 2,
            "scared" or "fearful" => 3,
            "surprised" => 4,
            "prayerful" => 5,
            _ => -1
        };
    }
}
