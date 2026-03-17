using System.Collections.Generic;
using UnityEngine;

namespace PilgrimsProgress.Visuals
{
    public class EnvironmentAnimator : MonoBehaviour
    {
        private readonly List<SwayTarget> _swayTargets = new List<SwayTarget>();
        private readonly List<BobTarget> _bobTargets = new List<BobTarget>();
        private readonly List<AmbientParticle> _particles = new List<AmbientParticle>();

        private Core.MapTheme _theme;
        private float _particleTimer;
        private int _maxParticles = 20;
        private Transform _playerTransform;
        private Camera _cam;

        private struct SwayTarget
        {
            public Transform Transform;
            public float Phase;
            public float Frequency;
            public float Amplitude;
            public Vector3 OriginalPos;
        }

        private struct BobTarget
        {
            public Transform Transform;
            public float Phase;
            public float Speed;
            public float Amplitude;
            public Vector3 OriginalScale;
        }

        private struct AmbientParticle
        {
            public SpriteRenderer Renderer;
            public Transform Transform;
            public float Life;
            public float MaxLife;
            public Vector3 Velocity;
            public float FadeStart;
        }

        public void Initialize(Core.MapTheme theme)
        {
            _theme = theme;
            _cam = Camera.main;
            var player = FindFirstObjectByType<Player.PlayerController>();
            if (player != null) _playerTransform = player.transform;

            ScanEnvironment();
        }

        private void ScanEnvironment()
        {
            var rng = new System.Random(System.DateTime.Now.Millisecond);
            var env = GameObject.Find("Environment");
            if (env == null) return;

            foreach (Transform child in env.transform)
            {
                string name = child.name;

                if (name.StartsWith("TallGrass") || name.StartsWith("Flower"))
                {
                    _swayTargets.Add(new SwayTarget
                    {
                        Transform = child,
                        Phase = (float)rng.NextDouble() * Mathf.PI * 2f,
                        Frequency = 1.2f + (float)rng.NextDouble() * 0.8f,
                        Amplitude = name.StartsWith("Flower") ? 0.03f : 0.05f,
                        OriginalPos = child.position
                    });
                }
                else if (name.StartsWith("Tree"))
                {
                    _bobTargets.Add(new BobTarget
                    {
                        Transform = child,
                        Phase = (float)rng.NextDouble() * Mathf.PI * 2f,
                        Speed = 0.4f + (float)rng.NextDouble() * 0.3f,
                        Amplitude = 0.015f,
                        OriginalScale = child.localScale
                    });
                }
                else if (name.StartsWith("Bush"))
                {
                    _swayTargets.Add(new SwayTarget
                    {
                        Transform = child,
                        Phase = (float)rng.NextDouble() * Mathf.PI * 2f,
                        Frequency = 0.8f + (float)rng.NextDouble() * 0.5f,
                        Amplitude = 0.02f,
                        OriginalPos = child.position
                    });
                }
            }
        }

        private void Update()
        {
            float t = Time.time;

            for (int i = 0; i < _swayTargets.Count; i++)
            {
                var s = _swayTargets[i];
                if (s.Transform == null) continue;
                float offset = Mathf.Sin(t * s.Frequency + s.Phase) * s.Amplitude;
                s.Transform.position = s.OriginalPos + new Vector3(offset, offset * 0.3f, 0f);
            }

            for (int i = 0; i < _bobTargets.Count; i++)
            {
                var b = _bobTargets[i];
                if (b.Transform == null) continue;
                float scaleX = 1f + Mathf.Sin(t * b.Speed + b.Phase) * b.Amplitude;
                float scaleY = 1f + Mathf.Sin(t * b.Speed + b.Phase + 1f) * b.Amplitude * 0.5f;
                b.Transform.localScale = new Vector3(
                    b.OriginalScale.x * scaleX,
                    b.OriginalScale.y * scaleY,
                    b.OriginalScale.z);
            }

            UpdateAmbientParticles();
        }

        private void UpdateAmbientParticles()
        {
            _particleTimer += Time.deltaTime;
            float spawnInterval = GetSpawnInterval();

            if (_particleTimer >= spawnInterval && _particles.Count < _maxParticles)
            {
                _particleTimer = 0f;
                SpawnAmbientParticle();
            }

            for (int i = _particles.Count - 1; i >= 0; i--)
            {
                var p = _particles[i];
                p.Life += Time.deltaTime;

                if (p.Life >= p.MaxLife || p.Transform == null)
                {
                    if (p.Transform != null) Destroy(p.Transform.gameObject);
                    _particles.RemoveAt(i);
                    continue;
                }

                p.Transform.position += p.Velocity * Time.deltaTime;

                float lifeT = p.Life / p.MaxLife;
                float alpha;
                if (lifeT < 0.15f) alpha = lifeT / 0.15f;
                else if (lifeT > 0.7f) alpha = (1f - lifeT) / 0.3f;
                else alpha = 1f;

                var c = p.Renderer.color;
                c.a = alpha * 0.5f;
                p.Renderer.color = c;

                _particles[i] = p;
            }
        }

        private void SpawnAmbientParticle()
        {
            Vector3 spawnPos = GetParticleSpawnPos();
            var (color, velocity, maxLife) = GetParticleProperties();

            var go = new GameObject("AmbientP");
            go.transform.position = spawnPos;
            var sr = go.AddComponent<SpriteRenderer>();

            int pxSize = 2;
            var tex = new Texture2D(pxSize, pxSize);
            tex.filterMode = FilterMode.Point;
            for (int y = 0; y < pxSize; y++)
                for (int x = 0; x < pxSize; x++)
                    tex.SetPixel(x, y, Color.white);
            tex.Apply();
            sr.sprite = Sprite.Create(tex, new Rect(0, 0, pxSize, pxSize), new Vector2(0.5f, 0.5f), 16f);
            sr.color = new Color(color.r, color.g, color.b, 0f);
            sr.sortingOrder = 100;

            _particles.Add(new AmbientParticle
            {
                Renderer = sr,
                Transform = go.transform,
                Life = 0f,
                MaxLife = maxLife,
                Velocity = velocity,
                FadeStart = 0.7f
            });
        }

        private Vector3 GetParticleSpawnPos()
        {
            Vector3 center = _playerTransform != null ? _playerTransform.position : Vector3.zero;
            float range = _cam != null ? _cam.orthographicSize * 2f : 8f;
            return center + new Vector3(
                Random.Range(-range, range),
                Random.Range(-range * 0.6f, range * 0.6f),
                0f);
        }

        private (Color color, Vector3 velocity, float maxLife) GetParticleProperties()
        {
            switch (_theme)
            {
                case Core.MapTheme.DarkValley:
                    return (
                        new Color(0.3f, 0.1f, 0.4f),
                        new Vector3(Random.Range(-0.1f, 0.1f), Random.Range(-0.15f, 0.05f), 0f),
                        Random.Range(3f, 6f));

                case Core.MapTheme.Celestial:
                    return (
                        new Color(0.95f, 0.9f, 0.6f),
                        new Vector3(Random.Range(-0.05f, 0.05f), Random.Range(0.1f, 0.3f), 0f),
                        Random.Range(3f, 7f));

                case Core.MapTheme.River:
                case Core.MapTheme.Swamp:
                    return (
                        new Color(0.4f, 0.6f, 0.8f),
                        new Vector3(Random.Range(0.05f, 0.15f), Random.Range(-0.02f, 0.05f), 0f),
                        Random.Range(2f, 5f));

                case Core.MapTheme.City:
                case Core.MapTheme.Market:
                    return (
                        new Color(0.8f, 0.65f, 0.3f),
                        new Vector3(Random.Range(-0.1f, 0.1f), Random.Range(0.05f, 0.15f), 0f),
                        Random.Range(2f, 4f));

                default:
                    bool isFirefly = Random.value > 0.5f;
                    return (
                        isFirefly ? new Color(0.7f, 0.85f, 0.3f) : new Color(0.9f, 0.9f, 0.85f),
                        new Vector3(Random.Range(-0.08f, 0.08f), Random.Range(0.02f, 0.12f), 0f),
                        Random.Range(3f, 6f));
            }
        }

        private float GetSpawnInterval()
        {
            switch (_theme)
            {
                case Core.MapTheme.Celestial: return 0.3f;
                case Core.MapTheme.DarkValley: return 0.5f;
                default: return 0.6f;
            }
        }
    }
}
