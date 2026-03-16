using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using PilgrimsProgress.Core;
using PilgrimsProgress.Narrative;

namespace PilgrimsProgress.UI
{
    public class CharacterPortraitUI : MonoBehaviour
    {
        [Header("Portrait Slots")]
        [SerializeField] private Image _leftPortrait;
        [SerializeField] private Image _rightPortrait;

        [Header("Animation")]
        [SerializeField] private float _slideInDuration = 0.3f;
        [SerializeField] private float _slideOutDuration = 0.2f;
        [SerializeField] private float _slideDistance = 200f;
        [SerializeField] private float _breatheAmplitude = 3f;
        [SerializeField] private float _breatheSpeed = 1.5f;

        [Header("Active/Inactive")]
        [SerializeField] private Color _activeColor = Color.white;
        [SerializeField] private Color _inactiveColor = new Color(0.5f, 0.5f, 0.5f, 0.8f);
        [SerializeField] private float _colorTransitionDuration = 0.3f;

        [System.Serializable]
        public struct CharacterExpressions
        {
            public string CharacterId;
            public Sprite Neutral;
            public Sprite Happy;
            public Sprite Worried;
            public Sprite Angry;
            public Sprite Surprised;
            public Sprite Praying;
            public Sprite Desperate;
            public Sprite Determined;
            public Sprite Compassionate;
            public Sprite Hopeful;
            public Sprite Joyful;
            public Sprite Serious;
            public Sprite Confused;
            public Sprite Crying;
            public Sprite Earnest;
            public Sprite Dismissive;
            public Sprite Curious;
            public Sprite Excited;
            public Sprite Uncertain;
            public Sprite Weary;
        }

        [SerializeField] private List<CharacterExpressions> _characterData;

        private string _leftCharacter;
        private string _rightCharacter;
        private string _activeCharacter;
        private Coroutine _leftSlideCoroutine;
        private Coroutine _rightSlideCoroutine;
        private RectTransform _leftRect;
        private RectTransform _rightRect;
        private Vector2 _leftOriginalPos;
        private Vector2 _rightOriginalPos;

        private void Start()
        {
            if (_leftPortrait != null)
            {
                _leftRect = _leftPortrait.rectTransform;
                _leftOriginalPos = _leftRect.anchoredPosition;
                _leftPortrait.gameObject.SetActive(false);
            }

            if (_rightPortrait != null)
            {
                _rightRect = _rightPortrait.rectTransform;
                _rightOriginalPos = _rightRect.anchoredPosition;
                _rightPortrait.gameObject.SetActive(false);
            }

            var inkService = ServiceLocator.Get<InkService>();
            if (inkService != null)
            {
                inkService.OnTagProcessed += HandleTag;
            }
        }

        private void Update()
        {
            float breatheOffset = Mathf.Sin(Time.time * _breatheSpeed) * _breatheAmplitude;

            if (_leftPortrait != null && _leftPortrait.gameObject.activeSelf && _leftRect != null)
            {
                var pos = _leftOriginalPos;
                pos.y += breatheOffset;
                _leftRect.anchoredPosition = pos;
            }

            if (_rightPortrait != null && _rightPortrait.gameObject.activeSelf && _rightRect != null)
            {
                var pos = _rightOriginalPos;
                pos.y += breatheOffset * 0.8f;
                _rightRect.anchoredPosition = pos;
            }
        }

        private void HandleTag(InkTag tag)
        {
            if (tag.Type == "SPEAKER")
            {
                SetActiveSpeaker(tag.Value);
            }
            else if (tag.Type == "EMOTION")
            {
                SetEmotion(_activeCharacter, tag.Value);
            }
        }

        public void SetActiveSpeaker(string characterId)
        {
            if (string.IsNullOrEmpty(characterId))
            {
                DimAll();
                _activeCharacter = null;
                return;
            }

            _activeCharacter = characterId;

            if (characterId == _leftCharacter)
            {
                SetPortraitActive(_leftPortrait, true);
                SetPortraitActive(_rightPortrait, false);
            }
            else if (characterId == _rightCharacter)
            {
                SetPortraitActive(_leftPortrait, false);
                SetPortraitActive(_rightPortrait, true);
            }
            else
            {
                AssignCharacterToSlot(characterId);
            }
        }

        private void AssignCharacterToSlot(string characterId)
        {
            bool isProtagonist = characterId == "Christian";

            if (isProtagonist)
            {
                ShowCharacter(characterId, true);
            }
            else
            {
                ShowCharacter(characterId, false);
            }
        }

        public void ShowCharacter(string characterId, bool leftSide)
        {
            Image portrait = leftSide ? _leftPortrait : _rightPortrait;
            RectTransform rect = leftSide ? _leftRect : _rightRect;

            if (leftSide) _leftCharacter = characterId;
            else _rightCharacter = characterId;

            Sprite sprite = GetExpressionSprite(characterId, "neutral");
            if (sprite != null && portrait != null)
            {
                portrait.sprite = sprite;
            }

            if (portrait != null)
            {
                portrait.gameObject.SetActive(true);
                Coroutine slideCoroutine = leftSide ? _leftSlideCoroutine : _rightSlideCoroutine;
                if (slideCoroutine != null) StopCoroutine(slideCoroutine);

                var newCoroutine = StartCoroutine(SlideIn(rect, leftSide));
                if (leftSide) _leftSlideCoroutine = newCoroutine;
                else _rightSlideCoroutine = newCoroutine;
            }

            SetPortraitActive(portrait, true);
        }

        public void HideCharacter(bool leftSide)
        {
            Image portrait = leftSide ? _leftPortrait : _rightPortrait;
            RectTransform rect = leftSide ? _leftRect : _rightRect;

            if (leftSide) _leftCharacter = null;
            else _rightCharacter = null;

            if (portrait != null && portrait.gameObject.activeSelf)
            {
                StartCoroutine(SlideOut(rect, leftSide, portrait));
            }
        }

        public void SetEmotion(string characterId, string emotion)
        {
            Sprite sprite = GetExpressionSprite(characterId, emotion);
            if (sprite == null) return;

            if (characterId == _leftCharacter && _leftPortrait != null)
            {
                _leftPortrait.sprite = sprite;
            }
            else if (characterId == _rightCharacter && _rightPortrait != null)
            {
                _rightPortrait.sprite = sprite;
            }
        }

        private void SetPortraitActive(Image portrait, bool active)
        {
            if (portrait == null) return;
            StartCoroutine(TransitionColor(portrait, active ? _activeColor : _inactiveColor));
        }

        private void DimAll()
        {
            SetPortraitActive(_leftPortrait, false);
            SetPortraitActive(_rightPortrait, false);
        }

        private IEnumerator SlideIn(RectTransform rect, bool fromLeft)
        {
            Vector2 startPos = rect.anchoredPosition;
            startPos.x += fromLeft ? -_slideDistance : _slideDistance;
            rect.anchoredPosition = startPos;

            Vector2 endPos = fromLeft ? _leftOriginalPos : _rightOriginalPos;
            float elapsed = 0f;

            while (elapsed < _slideInDuration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.SmoothStep(0f, 1f, elapsed / _slideInDuration);
                rect.anchoredPosition = Vector2.Lerp(startPos, endPos, t);
                yield return null;
            }

            rect.anchoredPosition = endPos;
        }

        private IEnumerator SlideOut(RectTransform rect, bool toLeft, Image portrait)
        {
            Vector2 startPos = rect.anchoredPosition;
            Vector2 endPos = startPos;
            endPos.x += toLeft ? -_slideDistance : _slideDistance;

            float elapsed = 0f;
            while (elapsed < _slideOutDuration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.SmoothStep(0f, 1f, elapsed / _slideOutDuration);
                rect.anchoredPosition = Vector2.Lerp(startPos, endPos, t);
                yield return null;
            }

            portrait.gameObject.SetActive(false);
            rect.anchoredPosition = startPos;
        }

        private IEnumerator TransitionColor(Image portrait, Color targetColor)
        {
            Color startColor = portrait.color;
            float elapsed = 0f;

            while (elapsed < _colorTransitionDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / _colorTransitionDuration;
                portrait.color = Color.Lerp(startColor, targetColor, t);
                yield return null;
            }

            portrait.color = targetColor;
        }

        private Sprite GetExpressionSprite(string characterId, string emotion)
        {
            if (_characterData == null) return null;

            foreach (var data in _characterData)
            {
                if (data.CharacterId != characterId) continue;

                return emotion.ToLower() switch
                {
                    "neutral" => data.Neutral,
                    "happy" => data.Happy,
                    "worried" => data.Worried,
                    "angry" => data.Angry,
                    "surprised" => data.Surprised,
                    "praying" => data.Praying,
                    "desperate" => data.Desperate,
                    "determined" => data.Determined,
                    "compassionate" => data.Compassionate,
                    "hopeful" => data.Hopeful,
                    "joyful" => data.Joyful,
                    "serious" => data.Serious,
                    "confused" => data.Confused,
                    "crying" => data.Crying,
                    "earnest" => data.Earnest,
                    "dismissive" => data.Dismissive,
                    "curious" => data.Curious,
                    "excited" => data.Excited,
                    "uncertain" => data.Uncertain,
                    "weary" => data.Weary,
                    _ => data.Neutral
                };
            }

            return null;
        }

        private void OnDestroy()
        {
            var inkService = ServiceLocator.TryGet<InkService>(out var ink) ? ink : null;
            if (inkService != null)
            {
                inkService.OnTagProcessed -= HandleTag;
            }
        }
    }
}
