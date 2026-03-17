using UnityEngine;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.Visuals
{
    public enum NPCPersonality
    {
        Calm,
        Restless,
        Menacing,
        Joyful,
        Mysterious
    }

    [RequireComponent(typeof(SpriteRenderer))]
    public class NPCBehavior : MonoBehaviour
    {
        [SerializeField] private NPCPersonality _personality = NPCPersonality.Calm;
        [SerializeField] private float _wanderRadius = 1.5f;
        [SerializeField] private float _wanderSpeed = 0.5f;

        private SpriteRenderer _sr;
        private CharacterAnimationFX _animFx;
        private Vector3 _homePos;
        private Vector3 _wanderTarget;
        private float _wanderTimer;
        private float _nextWanderTime;
        private float _lookTimer;
        private SpriteSheetLoader.SheetData _sheetData;
        private bool _useSpriteSheet;
        private string _npcId;

        private Transform _playerTransform;
        private bool _isInDialogue;

        private SpriteSheetLoader.Direction _facingDir = SpriteSheetLoader.Direction.Down;
        private float _animFrameTimer;
        private int _walkFrame;

        public NPCPersonality Personality => _personality;

        public void Initialize(string npcId, NPCPersonality personality)
        {
            _npcId = npcId;
            _personality = personality;
            _homePos = transform.position;
            _wanderTarget = _homePos;
            _nextWanderTime = Random.Range(1f, 4f);

            _sr = GetComponent<SpriteRenderer>();
            _animFx = GetComponent<CharacterAnimationFX>();
            if (_animFx == null)
                _animFx = gameObject.AddComponent<CharacterAnimationFX>();

            _sheetData = SpriteSheetLoader.Load(npcId);
            _useSpriteSheet = _sheetData != null;

            SetWanderParams();
        }

        private void SetWanderParams()
        {
            switch (_personality)
            {
                case NPCPersonality.Calm:
                    _wanderRadius = 1f;
                    _wanderSpeed = 0.3f;
                    break;
                case NPCPersonality.Restless:
                    _wanderRadius = 2.5f;
                    _wanderSpeed = 0.8f;
                    break;
                case NPCPersonality.Menacing:
                    _wanderRadius = 1.5f;
                    _wanderSpeed = 0.4f;
                    break;
                case NPCPersonality.Joyful:
                    _wanderRadius = 2f;
                    _wanderSpeed = 0.6f;
                    break;
                case NPCPersonality.Mysterious:
                    _wanderRadius = 0.5f;
                    _wanderSpeed = 0.2f;
                    break;
            }
        }

        private void Update()
        {
            if (_isInDialogue) return;
            if (_animFx != null && _animFx.IsPlaying) return;

            FindPlayer();
            LookAtPlayer();

            Wander();
            RandomActions();
        }

        private void FindPlayer()
        {
            if (_playerTransform != null) return;
            var pc = ServiceLocator.Get<Player.PlayerController>();
            if (pc != null) _playerTransform = pc.transform;
        }

        private void LookAtPlayer()
        {
            if (_playerTransform == null || _sr == null) return;

            float dist = Vector2.Distance(transform.position, _playerTransform.position);
            if (dist > 4f) return;

            Vector2 dir = _playerTransform.position - transform.position;
            UpdateFacingFromDirection(dir);
            UpdateSpriteForDirection();

            if (dist < 2.5f && _animFx != null)
                _animFx.IdleBreath();
        }

        private void Wander()
        {
            _wanderTimer += Time.deltaTime;

            if (_wanderTimer >= _nextWanderTime)
            {
                _wanderTimer = 0;
                _nextWanderTime = Random.Range(2f, 6f) / Mathf.Max(0.5f, (float)_personality * 0.5f + 0.5f);

                Vector2 offset = Random.insideUnitCircle * _wanderRadius;
                _wanderTarget = _homePos + new Vector3(offset.x, offset.y, 0);
            }

            float distToTarget = Vector2.Distance(transform.position, _wanderTarget);
            if (distToTarget > 0.1f)
            {
                Vector3 moveDir = (_wanderTarget - transform.position).normalized;
                transform.position += moveDir * _wanderSpeed * Time.deltaTime;

                UpdateFacingFromDirection(moveDir);
                AnimateWalk();
            }
            else
            {
                ShowIdle();
            }
        }

        private void RandomActions()
        {
            _lookTimer += Time.deltaTime;
            float threshold = _personality == NPCPersonality.Joyful ? 5f :
                              _personality == NPCPersonality.Restless ? 4f : 8f;

            if (_lookTimer < threshold) return;
            _lookTimer = 0;

            float roll = Random.value;
            if (_personality == NPCPersonality.Joyful && roll < 0.3f)
                _animFx?.Play(AnimAction.Jump);
            else if (_personality == NPCPersonality.Menacing && roll < 0.2f)
                _animFx?.Play(AnimAction.Shake);
            else if (_personality == NPCPersonality.Mysterious && roll < 0.15f)
                _animFx?.Play(AnimAction.Pray);
        }

        private void UpdateFacingFromDirection(Vector2 dir)
        {
            if (Mathf.Abs(dir.x) > Mathf.Abs(dir.y))
            {
                _facingDir = dir.x > 0 ? SpriteSheetLoader.Direction.Right : SpriteSheetLoader.Direction.Left;
                if (_sr != null) _sr.flipX = dir.x < 0;
            }
            else if (dir.sqrMagnitude > 0.01f)
            {
                _facingDir = dir.y > 0 ? SpriteSheetLoader.Direction.Up : SpriteSheetLoader.Direction.Down;
            }
        }

        private void AnimateWalk()
        {
            if (!_useSpriteSheet || _sr == null) return;

            _animFrameTimer += Time.deltaTime;
            if (_animFrameTimer >= 0.15f)
            {
                _animFrameTimer = 0;
                _walkFrame = (_walkFrame % 2) + 1;
            }

            var sprite = SpriteSheetLoader.GetSprite(_npcId, _facingDir, _walkFrame);
            if (sprite != null) _sr.sprite = sprite;

            _animFx?.WalkBob(true);
        }

        private void ShowIdle()
        {
            if (!_useSpriteSheet || _sr == null) return;

            var sprite = SpriteSheetLoader.GetSprite(_npcId, _facingDir, 0);
            if (sprite != null) _sr.sprite = sprite;
            _walkFrame = 0;

            _animFx?.WalkBob(false);
        }

        private void UpdateSpriteForDirection()
        {
            if (!_useSpriteSheet || _sr == null) return;
            var sprite = SpriteSheetLoader.GetSprite(_npcId, _facingDir, 0);
            if (sprite != null) _sr.sprite = sprite;
        }

        public void SetInDialogue(bool inDialogue)
        {
            _isInDialogue = inDialogue;
            if (inDialogue)
            {
                ShowIdle();
                _animFx?.WalkBob(false);
            }
        }

        public void PlayEmotion(string emotion)
        {
            string lower = emotion?.ToLower() ?? "";

            if (_animFx != null)
            {
                switch (lower)
                {
                    case "happy":
                    case "joyful":
                    case "relieved":
                        _animFx.Play(AnimAction.Celebrate);
                        break;
                    case "angry":
                    case "threatening":
                    case "rage":
                        _animFx.Play(AnimAction.Attack);
                        break;
                    case "scared":
                    case "distressed":
                    case "fearful":
                        _animFx.Play(AnimAction.Shake);
                        break;
                    case "prayerful":
                    case "wise":
                    case "blessed":
                        _animFx.Play(AnimAction.Pray);
                        break;
                    case "surprised":
                        _animFx.Play(AnimAction.Jump);
                        break;
                    case "defensive":
                        _animFx.Play(AnimAction.Defend);
                        break;
                    case "hurt":
                        _animFx.Play(AnimAction.Hit);
                        break;
                    case "determined":
                        _animFx.Play(AnimAction.Jump);
                        break;
                }
            }

            SpawnEmotionParticles(lower);
        }

        private void SpawnEmotionParticles(string emotion)
        {
            Color particleColor;
            int count;
            switch (emotion)
            {
                case "happy":
                case "joyful":
                case "relieved":
                    particleColor = new Color(1f, 0.90f, 0.40f);
                    count = 5;
                    break;
                case "angry":
                case "threatening":
                case "rage":
                    particleColor = new Color(0.85f, 0.20f, 0.15f);
                    count = 4;
                    break;
                case "prayerful":
                case "wise":
                case "blessed":
                    particleColor = new Color(1f, 0.95f, 0.65f);
                    count = 6;
                    break;
                case "scared":
                case "fearful":
                    particleColor = new Color(0.5f, 0.45f, 0.7f);
                    count = 3;
                    break;
                case "sad":
                case "sorrowful":
                    particleColor = new Color(0.4f, 0.5f, 0.7f);
                    count = 3;
                    break;
                default:
                    return;
            }

            Vector3 origin = transform.position + Vector3.up * 0.8f;
            for (int i = 0; i < count; i++)
            {
                var go = new GameObject("EmotionParticle");
                go.transform.position = origin + (Vector3)Random.insideUnitCircle * 0.3f;
                var sr = go.AddComponent<SpriteRenderer>();
                sr.sortingOrder = 15;

                int ps = 4;
                var tex = new Texture2D(ps, ps);
                for (int y = 0; y < ps; y++)
                    for (int x = 0; x < ps; x++)
                    {
                        float dx = x - ps / 2f + 0.5f, dy = y - ps / 2f + 0.5f;
                        float d = Mathf.Sqrt(dx * dx + dy * dy);
                        tex.SetPixel(x, y, d < ps / 2f ? particleColor : Color.clear);
                    }
                tex.Apply();
                tex.filterMode = FilterMode.Point;
                sr.sprite = Sprite.Create(tex, new Rect(0, 0, ps, ps), new Vector2(0.5f, 0.5f), 16);

                Vector2 vel = Random.insideUnitCircle.normalized * Random.Range(0.8f, 2f);
                vel.y = Mathf.Abs(vel.y) * 1.5f;
                go.AddComponent<ParticleMover>().Initialize(vel, Random.Range(0.5f, 1f));
            }
        }

        public static NPCPersonality GetPersonalityForNPC(string npcId)
        {
            return npcId switch
            {
                "evangelist" => NPCPersonality.Calm,
                "obstinate" => NPCPersonality.Restless,
                "pliable" => NPCPersonality.Restless,
                "help" => NPCPersonality.Joyful,
                "worldly_wiseman" => NPCPersonality.Mysterious,
                "goodwill" => NPCPersonality.Calm,
                "interpreter" => NPCPersonality.Mysterious,
                "prudence" => NPCPersonality.Calm,
                "piety" => NPCPersonality.Calm,
                "charity" => NPCPersonality.Joyful,
                "apollyon" => NPCPersonality.Menacing,
                "faithful" => NPCPersonality.Joyful,
                "hopeful" => NPCPersonality.Joyful,
                "giant_despair" => NPCPersonality.Menacing,
                "byends" => NPCPersonality.Restless,
                "ignorance" => NPCPersonality.Restless,
                _ => NPCPersonality.Calm
            };
        }
    }
}
