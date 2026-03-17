using System.Collections;
using UnityEngine;
using PilgrimsProgress.Core;
using PilgrimsProgress.Narrative;
using PilgrimsProgress.Visuals;

namespace PilgrimsProgress.Player
{
    public class PlayerStatVisuals : MonoBehaviour
    {
        private SpriteRenderer _sr;
        private SpriteRenderer _auraSr;
        private SpriteRenderer _burdenOverlaySr;
        private Transform _auraTransform;
        private CharacterAnimationFX _animFx;

        private float _auraIntensity;
        private float _targetAuraAlpha;
        private Color _auraColor;
        private float _burdenScale = 1f;
        private float _targetBurdenScale = 1f;
        private float _particleTimer;
        private StatTier _faithTier = StatTier.Low;
        private StatTier _courageTier = StatTier.Low;
        private StatTier _wisdomTier = StatTier.Low;
        private int _currentBurden = 80;

        private static readonly Color FaithGlow = new Color(1f, 0.90f, 0.50f, 0.3f);
        private static readonly Color CourageGlow = new Color(0.40f, 0.65f, 0.95f, 0.3f);
        private static readonly Color WisdomGlow = new Color(0.45f, 0.85f, 0.45f, 0.3f);

        private void Start()
        {
            _sr = GetComponent<SpriteRenderer>();
            _animFx = GetComponent<CharacterAnimationFX>();
            CreateAura();
            CreateBurdenOverlay();

            var stats = StatsManager.Instance;
            if (stats != null)
            {
                stats.OnStatChanged += HandleStatChanged;
                stats.OnBurdenChanged += HandleBurdenChanged;
                stats.OnTierChanged += HandleTierChanged;
                ApplyCurrentStats(stats);
            }
        }

        private void OnDestroy()
        {
            var stats = StatsManager.Instance;
            if (stats != null)
            {
                stats.OnStatChanged -= HandleStatChanged;
                stats.OnBurdenChanged -= HandleBurdenChanged;
                stats.OnTierChanged -= HandleTierChanged;
            }
        }

        private void Update()
        {
            UpdateAura();
            UpdateBurdenVisuals();
            UpdateStatParticles();
        }

        private void CreateAura()
        {
            var auraGo = new GameObject("StatAura");
            auraGo.transform.SetParent(transform, false);
            auraGo.transform.localPosition = new Vector3(0, 0.3f, 0);
            _auraTransform = auraGo.transform;

            _auraSr = auraGo.AddComponent<SpriteRenderer>();
            _auraSr.sortingOrder = 9;

            int s = 32;
            var tex = new Texture2D(s, s, TextureFormat.RGBA32, false);
            float cx = s / 2f, cy = s / 2f;
            for (int y = 0; y < s; y++)
            {
                for (int x = 0; x < s; x++)
                {
                    float dx = (x - cx) / cx;
                    float dy = (y - cy) / cy;
                    float dist = Mathf.Sqrt(dx * dx + dy * dy);
                    float alpha = Mathf.Max(0, 1f - dist);
                    alpha *= alpha;
                    tex.SetPixel(x, y, new Color(1, 1, 1, alpha * 0.5f));
                }
            }
            tex.Apply();
            tex.filterMode = FilterMode.Bilinear;
            _auraSr.sprite = Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.5f), 16f);
            _auraSr.color = new Color(1, 1, 1, 0);
        }

        private void CreateBurdenOverlay()
        {
            var overlayGo = new GameObject("BurdenOverlay");
            overlayGo.transform.SetParent(transform, false);
            overlayGo.transform.localPosition = Vector3.zero;

            _burdenOverlaySr = overlayGo.AddComponent<SpriteRenderer>();
            _burdenOverlaySr.sortingOrder = 11;

            int s = 16;
            var tex = new Texture2D(s, s, TextureFormat.RGBA32, false);
            for (int y = 0; y < s; y++)
                for (int x = 0; x < s; x++)
                {
                    float gradientDown = 1f - (float)y / s;
                    tex.SetPixel(x, y, new Color(0.3f, 0.2f, 0.1f, gradientDown * 0.2f));
                }
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            _burdenOverlaySr.sprite = Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.25f), s);
            _burdenOverlaySr.color = new Color(1, 1, 1, 0);
        }

        private void ApplyCurrentStats(StatsManager stats)
        {
            _faithTier = stats.GetFaithTier();
            _courageTier = stats.GetCourageTier();
            _wisdomTier = stats.GetWisdomTier();
            _currentBurden = stats.Stats.Burden;
            RecalculateVisuals();
        }

        private void HandleStatChanged(string stat, int oldVal, int newVal)
        {
            var stats = StatsManager.Instance;
            if (stats == null) return;

            switch (stat.ToLower())
            {
                case "faith": _faithTier = stats.GetFaithTier(); break;
                case "courage": _courageTier = stats.GetCourageTier(); break;
                case "wisdom": _wisdomTier = stats.GetWisdomTier(); break;
            }
            RecalculateVisuals();
        }

        private void HandleBurdenChanged(int oldVal, int newVal)
        {
            _currentBurden = newVal;
            RecalculateVisuals();

            if (newVal == 0 && oldVal > 0)
                StartCoroutine(BurdenReleaseEffect());
        }

        private void HandleTierChanged(string stat, StatTier oldTier, StatTier newTier)
        {
            bool levelUp = newTier > oldTier;
            if (levelUp)
                StartCoroutine(TierUpEffect(stat, newTier));
            else
                StartCoroutine(TierDownEffect(stat));
        }

        private void RecalculateVisuals()
        {
            // Aura based on highest stat tier
            StatTier highest = _faithTier;
            _auraColor = FaithGlow;
            if (_courageTier > highest) { highest = _courageTier; _auraColor = CourageGlow; }
            if (_wisdomTier > highest) { highest = _wisdomTier; _auraColor = WisdomGlow; }

            // Mix colors if multiple are high
            if (_faithTier >= StatTier.High && _courageTier >= StatTier.High)
                _auraColor = Color.Lerp(FaithGlow, CourageGlow, 0.5f);
            if (_faithTier >= StatTier.High && _wisdomTier >= StatTier.High)
                _auraColor = Color.Lerp(FaithGlow, WisdomGlow, 0.5f);
            if (_faithTier >= StatTier.Mastered && _courageTier >= StatTier.Mastered && _wisdomTier >= StatTier.Mastered)
                _auraColor = new Color(1f, 0.95f, 0.80f, 0.4f);

            switch (highest)
            {
                case StatTier.Mastered: _targetAuraAlpha = 0.35f; break;
                case StatTier.High: _targetAuraAlpha = 0.20f; break;
                case StatTier.Medium: _targetAuraAlpha = 0.08f; break;
                default: _targetAuraAlpha = 0f; break;
            }

            // Burden visual weight
            float burdenNorm = _currentBurden / 100f;
            _targetBurdenScale = 1f - burdenNorm * 0.15f;

            // Character tint based on stats
            if (_sr != null)
            {
                Color baseTint = Color.white;
                if (_currentBurden > 60)
                {
                    float darkFactor = (_currentBurden - 60) / 40f * 0.15f;
                    baseTint = Color.Lerp(baseTint, new Color(0.7f, 0.65f, 0.6f), darkFactor);
                }
                if (_faithTier >= StatTier.Mastered)
                    baseTint = Color.Lerp(baseTint, new Color(1f, 0.98f, 0.90f), 0.1f);

                _sr.color = baseTint;
            }
        }

        private void UpdateAura()
        {
            if (_auraSr == null) return;

            _auraIntensity = Mathf.Lerp(_auraIntensity, _targetAuraAlpha, Time.deltaTime * 2f);

            float pulse = 1f + Mathf.Sin(Time.time * 1.5f) * 0.15f;
            Color c = _auraColor;
            c.a = _auraIntensity * pulse;
            _auraSr.color = c;

            float scale = 1.5f + _auraIntensity * 1.5f;
            _auraTransform.localScale = Vector3.one * scale;
        }

        private void UpdateBurdenVisuals()
        {
            _burdenScale = Mathf.Lerp(_burdenScale, _targetBurdenScale, Time.deltaTime * 3f);
            transform.localScale = new Vector3(1f, _burdenScale, 1f);

            if (_burdenOverlaySr != null)
            {
                float burdenAlpha = _currentBurden > 40 ? (_currentBurden - 40) / 60f * 0.3f : 0f;
                Color c = _burdenOverlaySr.color;
                c.a = Mathf.Lerp(c.a, burdenAlpha, Time.deltaTime * 2f);
                _burdenOverlaySr.color = c;
            }

            // Camera vignette for high burden
            if (TopDownCamera.Instance != null)
            {
                float zoomPenalty = _currentBurden > 50 ? (_currentBurden - 50) / 50f * 0.5f : 0;
                // Applied via the camera's default zoom (subtle)
            }
        }

        private void UpdateStatParticles()
        {
            if (_faithTier < StatTier.High && _wisdomTier < StatTier.High) return;

            _particleTimer -= Time.deltaTime;
            if (_particleTimer > 0) return;

            float interval = _faithTier >= StatTier.Mastered || _wisdomTier >= StatTier.Mastered ? 1.5f : 3f;
            _particleTimer = interval;

            Color pColor;
            if (_faithTier >= StatTier.High && _wisdomTier >= StatTier.High)
                pColor = new Color(0.9f, 0.92f, 0.55f, 0.7f);
            else if (_faithTier >= StatTier.High)
                pColor = new Color(1f, 0.90f, 0.50f, 0.7f);
            else
                pColor = new Color(0.45f, 0.85f, 0.45f, 0.7f);

            SpawnStatParticle(pColor);
        }

        private void SpawnStatParticle(Color color)
        {
            var go = new GameObject("StatParticle");
            go.transform.position = transform.position + (Vector3)Random.insideUnitCircle * 0.4f;
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sortingOrder = 12;

            int ps = 3;
            var tex = new Texture2D(ps, ps);
            for (int y = 0; y < ps; y++)
                for (int x = 0; x < ps; x++)
                    tex.SetPixel(x, y, color);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            sr.sprite = Sprite.Create(tex, new Rect(0, 0, ps, ps), new Vector2(0.5f, 0.5f), 16);

            var mover = go.AddComponent<ParticleMover>();
            mover.Initialize(Vector2.up * Random.Range(0.5f, 1.2f), Random.Range(0.8f, 1.5f));
        }

        private IEnumerator TierUpEffect(string stat, StatTier newTier)
        {
            Color effectColor;
            switch (stat.ToLower())
            {
                case "faith": effectColor = new Color(1f, 0.90f, 0.50f); break;
                case "courage": effectColor = new Color(0.40f, 0.65f, 0.95f); break;
                case "wisdom": effectColor = new Color(0.45f, 0.85f, 0.45f); break;
                default: effectColor = Color.white; break;
            }

            // Screen flash
            ScreenFlash.Instance?.Flash(new Color(effectColor.r, effectColor.g, effectColor.b, 0.2f), 0.5f);
            TopDownCamera.Instance?.ImpactZoom(0.4f, 0.3f);

            // Burst of particles
            for (int i = 0; i < 8; i++)
            {
                Color pc = Color.Lerp(effectColor, Color.white, Random.Range(0f, 0.3f));
                pc.a = 0.8f;
                SpawnStatParticle(pc);
            }

            _animFx?.Play(AnimAction.Celebrate);

            // Aura pulse
            float origAlpha = _targetAuraAlpha;
            _targetAuraAlpha = 0.6f;
            yield return new WaitForSeconds(0.8f);
            _targetAuraAlpha = origAlpha;

            // Show tier name
            var loc = ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) ? lm : null;
            bool isKo = loc != null && loc.CurrentLanguage == "ko";
            string tierName = GetTierDisplayName(newTier, isKo);
            string statName = GetStatDisplayName(stat, isKo);
            UI.ToastUI.Instance?.Show($"{statName} → {tierName}", 3f);
        }

        private IEnumerator TierDownEffect(string stat)
        {
            TopDownCamera.Instance?.Shake(0.08f, 0.2f);
            ScreenFlash.Instance?.Flash(new Color(0.5f, 0.3f, 0.3f, 0.12f), 0.3f);
            _animFx?.Play(AnimAction.Hit);
            yield return null;
        }

        private IEnumerator BurdenReleaseEffect()
        {
            ScreenFlash.Instance?.Flash(new Color(1f, 0.95f, 0.70f, 0.4f), 1f);
            TopDownCamera.Instance?.ImpactZoom(0.6f, 0.5f);

            for (int i = 0; i < 12; i++)
            {
                Color pc = Color.Lerp(new Color(1f, 0.90f, 0.50f), Color.white, Random.Range(0f, 0.4f));
                pc.a = 0.9f;
                SpawnStatParticle(pc);
            }

            _animFx?.Play(AnimAction.Celebrate);
            yield return new WaitForSeconds(0.5f);
            _animFx?.Play(AnimAction.Pray);
        }

        private static string GetTierDisplayName(StatTier tier, bool isKo)
        {
            if (isKo)
            {
                switch (tier)
                {
                    case StatTier.Low: return "씨앗";
                    case StatTier.Medium: return "새싹";
                    case StatTier.High: return "열매";
                    case StatTier.Mastered: return "빛의 관";
                    default: return "시련";
                }
            }
            switch (tier)
            {
                case StatTier.Low: return "Seed";
                case StatTier.Medium: return "Sprout";
                case StatTier.High: return "Fruit";
                case StatTier.Mastered: return "Crown of Light";
                default: return "Trial";
            }
        }

        private static string GetStatDisplayName(string stat, bool isKo)
        {
            if (isKo)
            {
                switch (stat.ToLower())
                {
                    case "faith": return "믿음";
                    case "courage": return "용기";
                    case "wisdom": return "지혜";
                    default: return stat;
                }
            }
            switch (stat.ToLower())
            {
                case "faith": return "Faith";
                case "courage": return "Courage";
                case "wisdom": return "Wisdom";
                default: return stat;
            }
        }
    }
}
