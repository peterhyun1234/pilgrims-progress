using UnityEngine;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.Player
{
    [RequireComponent(typeof(SpriteRenderer))]
    public class PlayerAnimator : MonoBehaviour
    {
        [Header("Sprite Sheets")]
        [SerializeField] private Sprite[] _walkDown;
        [SerializeField] private Sprite[] _walkUp;
        [SerializeField] private Sprite[] _walkLeft;
        [SerializeField] private Sprite[] _walkRight;
        [SerializeField] private Sprite _idleDown;
        [SerializeField] private Sprite _idleUp;
        [SerializeField] private Sprite _idleLeft;
        [SerializeField] private Sprite _idleRight;

        [Header("Animation")]
        [SerializeField] private float _frameRate = 8f;

        private SpriteRenderer _sr;
        private PlayerController _controller;
        private float _frameTimer;
        private int _currentFrame;
        private Direction _currentDir = Direction.Down;

        private enum Direction { Down, Up, Left, Right }

        private void Awake()
        {
            _sr = GetComponent<SpriteRenderer>();
            _controller = GetComponent<PlayerController>();
            TryBuildCustomizationSprites();
        }

        private void TryBuildCustomizationSprites()
        {
            if (_idleDown != null) return;

            var custManager = ServiceLocator.TryGet<PlayerCustomizationManager>(out var cm) ? cm : null;
            if (custManager == null || custManager.Presets == null) return;

            var data = custManager.CurrentCustomization;
            var presets = custManager.Presets;

            _idleDown = CharacterSpriteBuilder.Build(data, presets, showBurden: true);
            _idleUp = _idleDown;
            _idleLeft = _idleDown;
            _idleRight = _idleDown;
        }

        private void Update()
        {
            if (_controller == null) return;

            UpdateDirection();

            if (_controller.IsMoving)
            {
                AnimateWalk();
            }
            else
            {
                ShowIdle();
            }
        }

        private void UpdateDirection()
        {
            var dir = _controller.FacingDirection;
            if (Mathf.Abs(dir.x) > Mathf.Abs(dir.y))
            {
                _currentDir = dir.x > 0 ? Direction.Right : Direction.Left;
            }
            else if (dir.sqrMagnitude > 0.01f)
            {
                _currentDir = dir.y > 0 ? Direction.Up : Direction.Down;
            }
        }

        private void AnimateWalk()
        {
            var frames = GetWalkFrames();
            if (frames == null || frames.Length == 0)
            {
                ShowIdle();
                return;
            }

            _frameTimer += Time.deltaTime;
            if (_frameTimer >= 1f / _frameRate)
            {
                _frameTimer -= 1f / _frameRate;
                _currentFrame = (_currentFrame + 1) % frames.Length;
            }

            _sr.sprite = frames[_currentFrame];
        }

        private void ShowIdle()
        {
            _frameTimer = 0f;
            _currentFrame = 0;

            Sprite idle = _currentDir switch
            {
                Direction.Up => _idleUp,
                Direction.Left => _idleLeft,
                Direction.Right => _idleRight,
                _ => _idleDown
            };

            if (idle != null)
                _sr.sprite = idle;
        }

        private Sprite[] GetWalkFrames()
        {
            return _currentDir switch
            {
                Direction.Up => _walkUp,
                Direction.Left => _walkLeft,
                Direction.Right => _walkRight,
                _ => _walkDown
            };
        }
    }
}
