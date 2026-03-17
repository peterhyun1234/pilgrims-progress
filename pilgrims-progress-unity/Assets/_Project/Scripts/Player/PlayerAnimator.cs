using System;
using UnityEngine;
using PilgrimsProgress.Core;
using PilgrimsProgress.Visuals;

namespace PilgrimsProgress.Player
{
    [RequireComponent(typeof(SpriteRenderer))]
    public class PlayerAnimator : MonoBehaviour
    {
        [Header("Animation")]
        [SerializeField] private float _frameRate = 6f;

        private SpriteRenderer _sr;
        private PlayerController _controller;
        private CharacterAnimationFX _animFx;
        private Sprite[] _sprites;
        private float _frameTimer;
        private int _currentWalkFrame;
        private SpriteSheetLoader.Direction _currentDir = SpriteSheetLoader.Direction.Down;
        private bool _useSpriteSheet;

        private Sprite _fallbackSprite;

        public CharacterAnimationFX AnimFX => _animFx;

        private void Awake()
        {
            _sr = GetComponent<SpriteRenderer>();
            _controller = GetComponent<PlayerController>();
            _animFx = GetComponent<CharacterAnimationFX>();
            if (_animFx == null)
                _animFx = gameObject.AddComponent<CharacterAnimationFX>();
        }

        private void Start()
        {
            LoadSprites();
            ApplyCustomizationTint();
        }

        public void PlayAction(AnimAction action, Action onComplete = null)
        {
            _animFx?.Play(action, onComplete);
        }

        private void LoadSprites()
        {
            string npcId = GetPlayerSpriteId();
            _sprites = SpriteSheetLoader.Load(npcId);
            _useSpriteSheet = _sprites != null;

            if (_useSpriteSheet)
            {
                _sr.sprite = _sprites[0];
            }
            else
            {
                BuildFallbackSprite();
            }
        }

        private string GetPlayerSpriteId()
        {
            var chapterMgr = ChapterManager.Instance;
            int chapter = chapterMgr != null ? chapterMgr.CurrentChapter : 1;
            return chapter >= 6 ? "christian_free" : "christian";
        }

        private void ApplyCustomizationTint()
        {
            var custManager = PlayerCustomizationManager.Instance;
            if (custManager == null)
                ServiceLocator.TryGet<PlayerCustomizationManager>(out custManager);

            if (custManager == null || custManager.Presets == null) return;

            Color outfitColor = custManager.GetOutfitColor();
            float h, s, v;
            Color.RGBToHSV(outfitColor, out h, out s, out v);

            _sr.color = Color.HSVToRGB(h, s * 0.6f, Mathf.Clamp(v * 1.1f, 0, 1));
        }

        private void BuildFallbackSprite()
        {
            var custManager = PlayerCustomizationManager.Instance;
            if (custManager == null)
                ServiceLocator.TryGet<PlayerCustomizationManager>(out custManager);

            if (custManager != null && custManager.Presets != null)
            {
                _fallbackSprite = CharacterSpriteBuilder.Build(
                    custManager.CurrentCustomization, custManager.Presets, showBurden: true);
                if (_fallbackSprite != null)
                    _sr.sprite = _fallbackSprite;
            }
        }

        public void RefreshCustomization()
        {
            ApplyCustomizationTint();
            if (!_useSpriteSheet)
            {
                BuildFallbackSprite();
            }
        }

        private void Update()
        {
            if (_controller == null) return;
            if (_animFx != null && _animFx.IsPlaying) return;

            UpdateDirection();

            if (_controller.IsMoving)
            {
                AnimateWalk();
                _animFx?.WalkBob(true);
            }
            else
            {
                ShowIdle();
                _animFx?.WalkBob(false);
            }
        }

        private void UpdateDirection()
        {
            var dir = _controller.FacingDirection;
            if (Mathf.Abs(dir.x) > Mathf.Abs(dir.y))
                _currentDir = dir.x > 0 ? SpriteSheetLoader.Direction.Right : SpriteSheetLoader.Direction.Left;
            else if (dir.sqrMagnitude > 0.01f)
                _currentDir = dir.y > 0 ? SpriteSheetLoader.Direction.Up : SpriteSheetLoader.Direction.Down;
        }

        private void AnimateWalk()
        {
            if (!_useSpriteSheet)
            {
                if (_fallbackSprite != null) _sr.sprite = _fallbackSprite;
                return;
            }

            _frameTimer += Time.deltaTime;
            if (_frameTimer >= 1f / _frameRate)
            {
                _frameTimer -= 1f / _frameRate;
                _currentWalkFrame = (_currentWalkFrame % 2) + 1;
            }

            string id = GetPlayerSpriteId();
            var sprite = SpriteSheetLoader.GetSprite(id, _currentDir, _currentWalkFrame);
            if (sprite != null) _sr.sprite = sprite;
        }

        private void ShowIdle()
        {
            _frameTimer = 0f;
            _currentWalkFrame = 0;

            if (!_useSpriteSheet)
            {
                if (_fallbackSprite != null) _sr.sprite = _fallbackSprite;
                return;
            }

            string id = GetPlayerSpriteId();
            var sprite = SpriteSheetLoader.GetSprite(id, _currentDir, 0);
            if (sprite != null) _sr.sprite = sprite;
        }
    }
}
