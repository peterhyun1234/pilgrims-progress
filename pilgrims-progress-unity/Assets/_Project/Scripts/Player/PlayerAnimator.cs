using System;
using UnityEngine;
using PilgrimsProgress.Core;
using PilgrimsProgress.Visuals;

namespace PilgrimsProgress.Player
{
    public enum AnimState { Idle, Walk, Interact, Emote, Hurt, Celebrate }

    [RequireComponent(typeof(SpriteRenderer))]
    public class PlayerAnimator : MonoBehaviour
    {
        private const string CustomSheetKey = "custom_player";

        [Header("Frame Rates")]
        [SerializeField] private float _idleFrameRate = 4f;
        [SerializeField] private float _walkFrameRate = 8f;
        [SerializeField] private float _sprintFrameRate = 11f;
        [SerializeField] private float _interactFrameRate = 6f;

        private SpriteRenderer _sr;
        private PlayerController _controller;
        private CharacterAnimationFX _animFx;
        private SpriteSheetLoader.SheetData _sheetData;
        private float _frameTimer;
        private int _currentFrame;
        private SpriteSheetLoader.Direction _currentDir = SpriteSheetLoader.Direction.Down;
        private bool _useSpriteSheet;
        private AnimState _state = AnimState.Idle;

        private Sprite _fallbackSprite;

        private float _idleTimer;
        private const float IdleVariationDelay = 3.5f;
        private bool _idleVariationPlaying;

        public CharacterAnimationFX AnimFX => _animFx;
        public AnimState CurrentState => _state;
        public SpriteSheetLoader.Direction CurrentDirection => _currentDir;

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
        }

        public void PlayAction(AnimAction action, Action onComplete = null)
        {
            _animFx?.Play(action, onComplete);
        }

        public void SetState(AnimState newState)
        {
            if (_state == newState) return;
            _state = newState;
            _frameTimer = 0;
            _currentFrame = 0;
            _idleTimer = 0;
            _idleVariationPlaying = false;
        }

        public void FaceDirection(Vector3 targetPos)
        {
            Vector2 diff = (targetPos - transform.position);
            if (Mathf.Abs(diff.x) > Mathf.Abs(diff.y))
                _currentDir = diff.x > 0 ? SpriteSheetLoader.Direction.Right : SpriteSheetLoader.Direction.Left;
            else
                _currentDir = diff.y > 0 ? SpriteSheetLoader.Direction.Up : SpriteSheetLoader.Direction.Down;
        }

        private void LoadSprites()
        {
            if (TryBuildCustomSheet())
            {
                _useSpriteSheet = true;
                _sr.color = Color.white;
                _sr.sprite = _sheetData.Sprites[0];
                return;
            }

            string npcId = GetPlayerSpriteId();
            _sheetData = SpriteSheetLoader.Load(npcId);
            _useSpriteSheet = _sheetData != null;

            if (_useSpriteSheet)
            {
                _sr.sprite = _sheetData.Sprites[0];
                ApplyCustomizationTint();
            }
            else
            {
                BuildFallbackSprite();
            }
        }

        private bool TryBuildCustomSheet()
        {
            var custManager = GetCustManager();
            if (custManager == null || custManager.Presets == null) return false;

            var data = custManager.CurrentCustomization;
            var presets = custManager.Presets;

            bool showBurden = true;
            var chapterMgr = ChapterManager.Instance;
            if (chapterMgr != null && chapterMgr.CurrentChapter >= 6)
                showBurden = false;

            var sheetTex = CharacterSpriteBuilder.BuildSpriteSheet(data, presets, showBurden);
            if (sheetTex == null) return false;

            SpriteSheetLoader.InvalidateKey(CustomSheetKey);
            _sheetData = SpriteSheetLoader.RegisterCustomSheet(CustomSheetKey, sheetTex);
            return _sheetData != null;
        }

        private string GetPlayerSpriteId()
        {
            return CustomSheetKey;
        }

        private void ApplyCustomizationTint()
        {
            var custManager = GetCustManager();
            if (custManager == null || custManager.Presets == null) return;

            Color outfitColor = custManager.GetOutfitColor();
            Color.RGBToHSV(outfitColor, out float h, out float s, out float v);
            _sr.color = Color.HSVToRGB(h, s * 0.6f, Mathf.Clamp(v * 1.1f, 0, 1));
        }

        private void BuildFallbackSprite()
        {
            var custManager = GetCustManager();
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
            SpriteSheetLoader.InvalidateKey(CustomSheetKey);
            if (TryBuildCustomSheet())
            {
                _useSpriteSheet = true;
                _sr.color = Color.white;
                ApplyFrame(_currentDir, 0);
            }
            else
            {
                BuildFallbackSprite();
            }
        }

        private PlayerCustomizationManager GetCustManager()
        {
            var mgr = PlayerCustomizationManager.Instance;
            if (mgr == null) ServiceLocator.TryGet(out mgr);
            return mgr;
        }

        private void Update()
        {
            if (_controller == null) return;
            if (_animFx != null && _animFx.IsPlaying) return;

            UpdateDirection();
            UpdateState();
            UpdateAnimation();
        }

        private void UpdateDirection()
        {
            if (!_controller.IsMoving) return;
            var dir = _controller.FacingDirection;
            if (Mathf.Abs(dir.x) > Mathf.Abs(dir.y))
                _currentDir = dir.x > 0 ? SpriteSheetLoader.Direction.Right : SpriteSheetLoader.Direction.Left;
            else if (dir.sqrMagnitude > 0.01f)
                _currentDir = dir.y > 0 ? SpriteSheetLoader.Direction.Up : SpriteSheetLoader.Direction.Down;
        }

        private void UpdateState()
        {
            if (_state == AnimState.Interact || _state == AnimState.Emote) return;

            if (_controller.IsMoving)
                SetState(AnimState.Walk);
            else
                SetState(AnimState.Idle);
        }

        private void UpdateAnimation()
        {
            switch (_state)
            {
                case AnimState.Idle:
                    AnimateIdle();
                    _animFx?.WalkBob(false);
                    break;
                case AnimState.Walk:
                    AnimateWalk();
                    _animFx?.WalkBob(true);
                    break;
                case AnimState.Interact:
                    AnimateInteract();
                    _animFx?.WalkBob(false);
                    break;
                default:
                    AnimateIdle();
                    _animFx?.WalkBob(false);
                    break;
            }
        }

        private void AnimateIdle()
        {
            if (!_useSpriteSheet)
            {
                if (_fallbackSprite != null) _sr.sprite = _fallbackSprite;
                return;
            }

            _idleTimer += Time.deltaTime;

            if (_idleTimer > IdleVariationDelay && !_idleVariationPlaying)
            {
                _idleVariationPlaying = true;
                _idleTimer = 0;
            }

            if (_idleVariationPlaying)
            {
                _frameTimer += Time.deltaTime;
                if (_frameTimer >= 1f / _idleFrameRate)
                {
                    _frameTimer -= 1f / _idleFrameRate;
                    _currentFrame++;
                    if (_currentFrame >= GetMaxFrames())
                    {
                        _currentFrame = 0;
                        _idleVariationPlaying = false;
                    }
                }
            }
            else
            {
                _currentFrame = 0;
            }

            ApplyFrame(_currentDir, _currentFrame);
        }

        private void AnimateWalk()
        {
            if (!_useSpriteSheet)
            {
                if (_fallbackSprite != null) _sr.sprite = _fallbackSprite;
                return;
            }

            float rate = _controller.IsSprinting ? _sprintFrameRate : _walkFrameRate;
            _frameTimer += Time.deltaTime;
            if (_frameTimer >= 1f / rate)
            {
                _frameTimer -= 1f / rate;
                int maxFrames = GetMaxFrames();
                _currentFrame = (_currentFrame + 1) % maxFrames;
                if (_currentFrame == 0) _currentFrame = 1;
            }

            ApplyFrame(_currentDir, _currentFrame);
        }

        private void AnimateInteract()
        {
            if (!_useSpriteSheet)
            {
                if (_fallbackSprite != null) _sr.sprite = _fallbackSprite;
                return;
            }

            if (_sheetData != null && _sheetData.HasRow(SpriteSheetLoader.AnimRow.Interact))
            {
                _frameTimer += Time.deltaTime;
                if (_frameTimer >= 1f / _interactFrameRate)
                {
                    _frameTimer -= 1f / _interactFrameRate;
                    _currentFrame++;
                    if (_currentFrame >= _sheetData.FramesPerDirection)
                    {
                        SetState(AnimState.Idle);
                        return;
                    }
                }
                string id = GetPlayerSpriteId();
                var sprite = SpriteSheetLoader.GetAnimSprite(id, SpriteSheetLoader.AnimRow.Interact, _currentFrame);
                if (sprite != null) _sr.sprite = sprite;
            }
            else
            {
                ApplyFrame(_currentDir, 0);
                SetState(AnimState.Idle);
            }
        }

        private void ApplyFrame(SpriteSheetLoader.Direction dir, int frame)
        {
            string id = GetPlayerSpriteId();
            var sprite = SpriteSheetLoader.GetSprite(id, dir, frame);
            if (sprite != null) _sr.sprite = sprite;
        }

        private int GetMaxFrames()
        {
            if (_sheetData != null) return _sheetData.FramesPerDirection;
            return 3;
        }
    }
}
