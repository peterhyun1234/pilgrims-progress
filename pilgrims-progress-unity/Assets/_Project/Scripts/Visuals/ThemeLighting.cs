using UnityEngine;
using UnityEngine.Rendering.Universal;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.Visuals
{
    public static class ThemeLighting
    {
        private static Material _litMaterial;

        public static Material GetLitMaterial()
        {
            if (_litMaterial != null) return _litMaterial;

            var shader = Shader.Find("Universal Render Pipeline/2D/Sprite-Lit-Default");
            if (shader == null)
                shader = Shader.Find("Sprites/Default");
            _litMaterial = new Material(shader);
            return _litMaterial;
        }

        public static void ApplyLitMaterialToAll()
        {
            var mat = GetLitMaterial();
            foreach (var sr in Object.FindObjectsByType<SpriteRenderer>(FindObjectsSortMode.None))
            {
                if (sr.gameObject.name == "FogOverlay") continue;
                sr.material = mat;
            }

            var tilemapRenderers = Object.FindObjectsByType<UnityEngine.Tilemaps.TilemapRenderer>(FindObjectsSortMode.None);
            foreach (var tr in tilemapRenderers)
                tr.material = mat;
        }

        public struct LightingProfile
        {
            public Color AmbientColor;
            public float AmbientIntensity;
            public Color CameraBackground;
            public bool PlayerTorch;
            public float PlayerTorchRadius;
            public Color PlayerTorchColor;
        }

        public static LightingProfile GetProfile(MapTheme theme)
        {
            switch (theme)
            {
                case MapTheme.Fields:
                case MapTheme.Village:
                    return new LightingProfile
                    {
                        AmbientColor = new Color(1.0f, 0.96f, 0.88f),
                        AmbientIntensity = 0.85f,
                        CameraBackground = new Color(0.08f, 0.12f, 0.06f)
                    };

                case MapTheme.Hill:
                    return new LightingProfile
                    {
                        AmbientColor = new Color(1.0f, 0.94f, 0.82f),
                        AmbientIntensity = 0.9f,
                        CameraBackground = new Color(0.06f, 0.08f, 0.04f)
                    };

                case MapTheme.DarkValley:
                    return new LightingProfile
                    {
                        AmbientColor = new Color(0.35f, 0.30f, 0.55f),
                        AmbientIntensity = 0.25f,
                        CameraBackground = new Color(0.02f, 0.02f, 0.04f),
                        PlayerTorch = true,
                        PlayerTorchRadius = 4f,
                        PlayerTorchColor = new Color(0.9f, 0.75f, 0.5f)
                    };

                case MapTheme.Celestial:
                    return new LightingProfile
                    {
                        AmbientColor = new Color(1.0f, 0.95f, 0.78f),
                        AmbientIntensity = 1.1f,
                        CameraBackground = new Color(0.08f, 0.10f, 0.15f)
                    };

                case MapTheme.City:
                case MapTheme.Market:
                    return new LightingProfile
                    {
                        AmbientColor = new Color(0.95f, 0.92f, 0.85f),
                        AmbientIntensity = 0.75f,
                        CameraBackground = new Color(0.05f, 0.05f, 0.07f)
                    };

                case MapTheme.Interior:
                    return new LightingProfile
                    {
                        AmbientColor = new Color(0.7f, 0.55f, 0.35f),
                        AmbientIntensity = 0.4f,
                        CameraBackground = new Color(0.03f, 0.03f, 0.05f)
                    };

                case MapTheme.Castle:
                    return new LightingProfile
                    {
                        AmbientColor = new Color(0.6f, 0.55f, 0.7f),
                        AmbientIntensity = 0.5f,
                        CameraBackground = new Color(0.04f, 0.04f, 0.06f)
                    };

                case MapTheme.Gate:
                    return new LightingProfile
                    {
                        AmbientColor = new Color(0.9f, 0.85f, 0.75f),
                        AmbientIntensity = 0.7f,
                        CameraBackground = new Color(0.05f, 0.06f, 0.08f)
                    };

                case MapTheme.Enchanted:
                    return new LightingProfile
                    {
                        AmbientColor = new Color(0.5f, 0.7f, 0.9f),
                        AmbientIntensity = 0.6f,
                        CameraBackground = new Color(0.04f, 0.05f, 0.08f)
                    };

                default:
                    return new LightingProfile
                    {
                        AmbientColor = new Color(0.9f, 0.88f, 0.82f),
                        AmbientIntensity = 0.8f,
                        CameraBackground = new Color(0.05f, 0.05f, 0.08f)
                    };
            }
        }

        public static Light2D CreateGlobalLight(Transform parent, LightingProfile profile)
        {
            var go = new GameObject("GlobalLight2D");
            go.transform.SetParent(parent, false);
            go.transform.position = new Vector3(0, 0, 0);

            var light = go.AddComponent<Light2D>();
            light.lightType = Light2D.LightType.Global;
            light.color = profile.AmbientColor;
            light.intensity = profile.AmbientIntensity;
            light.blendStyleIndex = 0;
            return light;
        }

        public static Light2D CreatePointLight(Transform parent, Vector3 position,
            Color color, float outerRadius, float innerRadius, float intensity,
            float falloff = 0.5f, int blendStyle = 1)
        {
            var go = new GameObject("PointLight2D");
            go.transform.SetParent(parent, false);
            go.transform.position = position;

            var light = go.AddComponent<Light2D>();
            light.lightType = Light2D.LightType.Point;
            light.color = color;
            light.intensity = intensity;
            light.pointLightOuterRadius = outerRadius;
            light.pointLightInnerRadius = innerRadius;
            light.pointLightInnerAngle = 360f;
            light.pointLightOuterAngle = 360f;
            light.falloffIntensity = falloff;
            light.blendStyleIndex = blendStyle;
            return light;
        }

        public static Light2D CreatePlayerTorch(Transform player, LightingProfile profile)
        {
            if (!profile.PlayerTorch) return null;

            var torchGo = new GameObject("PlayerTorch");
            torchGo.transform.SetParent(player, false);
            torchGo.transform.localPosition = Vector3.zero;

            var light = torchGo.AddComponent<Light2D>();
            light.lightType = Light2D.LightType.Point;
            light.color = profile.PlayerTorchColor;
            light.intensity = 1.2f;
            light.pointLightOuterRadius = profile.PlayerTorchRadius;
            light.pointLightInnerRadius = profile.PlayerTorchRadius * 0.3f;
            light.pointLightInnerAngle = 360f;
            light.pointLightOuterAngle = 360f;
            light.falloffIntensity = 0.6f;
            light.blendStyleIndex = 1;

            torchGo.AddComponent<TorchFlicker>();
            return light;
        }

        public static Light2D CreateExitGlow(Transform exitTransform, MapTheme theme)
        {
            Color glowColor;
            float radius;
            float intensity;

            switch (theme)
            {
                case MapTheme.Celestial:
                    glowColor = new Color(1f, 0.95f, 0.7f);
                    radius = 5f;
                    intensity = 1.5f;
                    break;
                case MapTheme.DarkValley:
                    glowColor = new Color(0.6f, 0.8f, 1f);
                    radius = 3.5f;
                    intensity = 1.0f;
                    break;
                default:
                    glowColor = new Color(1f, 0.92f, 0.7f);
                    radius = 3f;
                    intensity = 0.8f;
                    break;
            }

            return CreatePointLight(exitTransform, exitTransform.position,
                glowColor, radius, radius * 0.2f, intensity, 0.5f, 1);
        }

        public static Light2D CreateLanternLight(Transform lantern)
        {
            var light = CreatePointLight(lantern, lantern.position,
                new Color(1f, 0.85f, 0.55f), 2.5f, 0.5f, 0.9f, 0.6f, 1);
            light.gameObject.AddComponent<TorchFlicker>();
            return light;
        }
    }

    public class TorchFlicker : MonoBehaviour
    {
        private Light2D _light;
        private float _baseIntensity;
        private float _phase;

        private void Start()
        {
            _light = GetComponentInParent<Light2D>();
            if (_light == null) _light = GetComponent<Light2D>();
            if (_light != null) _baseIntensity = _light.intensity;
            _phase = Random.Range(0f, Mathf.PI * 2f);
        }

        private void Update()
        {
            if (_light == null) return;
            float flicker = Mathf.Sin(Time.time * 3.7f + _phase) * 0.08f
                          + Mathf.Sin(Time.time * 7.3f + _phase * 2f) * 0.04f;
            _light.intensity = _baseIntensity + flicker;
        }
    }
}
