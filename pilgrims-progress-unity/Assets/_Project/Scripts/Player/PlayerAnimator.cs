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
        private Sprite[] _sprites;
        private float _frameTimer;
        private int _currentWalkFrame;
        private SpriteSheetLoader.Direction _currentDir = SpriteSheetLoader.Direction.Down;
        private bool _useSpriteSheet;

        private Sprite _fallbackSprite;

        private void Awake()
        {
            _sr = GetComponent<SpriteRenderer>();
            _controller = GetComponent<PlayerController>();
        }

        private void Start()
        {
            LoadSprites();
        }

        private void LoadSprites()
        {
            string npcId = GetPlayerSpriteId();
            _sprites = SpriteSheetLoader.Load(npcId);
            _useSpriteSheet = _sprites != null;

            if (_useSpriteSheet)
            {
                _sr.sprite = _sprites[0]; // idle down
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

        private void Update()
        {
            if (_controller == null) return;

            UpdateDirection();

            if (_controller.IsMoving)
                AnimateWalk();
            else
                ShowIdle();
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
                _currentWalkFrame = (_currentWalkFrame % 2) + 1; // Alternate between frame 1 and 2
            }

            var sprite = SpriteSheetLoader.GetSprite("christian", _currentDir, _currentWalkFrame);
            if (sprite == null)
            {
                string id = GetPlayerSpriteId();
                sprite = SpriteSheetLoader.GetSprite(id, _currentDir, _currentWalkFrame);
            }
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
