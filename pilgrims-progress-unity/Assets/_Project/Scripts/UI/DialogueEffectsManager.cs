using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Rendering.Universal;
using TMPro;
using PilgrimsProgress.Core;
using PilgrimsProgress.Narrative;
using PilgrimsProgress.Player;
using PilgrimsProgress.Visuals;

namespace PilgrimsProgress.UI
{
    public class DialogueEffectsManager : MonoBehaviour
    {
        public static DialogueEffectsManager Instance { get; private set; }

        private DialogueController _dialogueCtrl;
        private GameModeManager _modeManager;
        private Canvas _overlayCanvas;
        private Image _vignetteImage;
        private Image _transitionImage;
        private CanvasGroup _emotionBubbleCG;
        private TextMeshProUGUI _emotionBubbleText;
        private RectTransform _emotionBubbleRT;

        private Transform _currentNPCTransform;
        private string _currentSpeaker;
        private string _currentEmotion;
        private Coroutine _waitCoroutine;
        private Coroutine _transitionCoroutine;
        private Coroutine _emotionBubbleCoroutine;
        private Coroutine _vignetteCoroutine;

        private static readonly Color VignetteNeutral = new Color(0, 0, 0, 0.15f);
        private static readonly Color VignetteTense = new Color(0.15f, 0, 0, 0.30f);
        private static readonly Color VignetteHoly = new Color(0.10f, 0.08f, 0, 0.20f);
        private static readonly Color VignetteJoy = new Color(0, 0.05f, 0.10f, 0.10f);

        private void Awake()
        {
            Instance = this;
        }

        public void Initialize()
        {
            _dialogueCtrl = FindFirstObjectByType<DialogueController>();
            _modeManager = ServiceLocator.Get<GameModeManager>();

            if (_dialogueCtrl != null)
            {
                _dialogueCtrl.OnSpeakerChanged += HandleSpeakerChanged;
                _dialogueCtrl.OnEmotionChanged += HandleEmotionChanged;
                _dialogueCtrl.OnShakeRequested += HandleShake;
                _dialogueCtrl.OnWaitRequested += HandleWait;
                _dialogueCtrl.OnTransitionRequested += HandleTransition;
                _dialogueCtrl.OnStatChanged += HandleStatChange;
                _dialogueCtrl.OnBurdenChanged += HandleBurdenChange;
                _dialogueCtrl.OnBibleCardUnlocked += HandleBibleCard;
                _dialogueCtrl.OnLocationChanged += HandleLocationChanged;
                _dialogueCtrl.OnBgmChanged += HandleBgmChanged;
            }

            if (_modeManager != null)
            {
                _modeManager.OnModeChanged += HandleModeChanged;
            }

            BuildOverlayUI();
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
            if (_dialogueCtrl != null)
            {
                _dialogueCtrl.OnSpeakerChanged -= HandleSpeakerChanged;
                _dialogueCtrl.OnEmotionChanged -= HandleEmotionChanged;
                _dialogueCtrl.OnShakeRequested -= HandleShake;
                _dialogueCtrl.OnWaitRequested -= HandleWait;
                _dialogueCtrl.OnTransitionRequested -= HandleTransition;
                _dialogueCtrl.OnStatChanged -= HandleStatChange;
                _dialogueCtrl.OnBurdenChanged -= HandleBurdenChange;
                _dialogueCtrl.OnBibleCardUnlocked -= HandleBibleCard;
                _dialogueCtrl.OnLocationChanged -= HandleLocationChanged;
                _dialogueCtrl.OnBgmChanged -= HandleBgmChanged;
            }
            if (_modeManager != null)
                _modeManager.OnModeChanged -= HandleModeChanged;
        }

        private void BuildOverlayUI()
        {
            var canvasGo = new GameObject("DialogueFXCanvas");
            canvasGo.transform.SetParent(transform, false);
            _overlayCanvas = canvasGo.AddComponent<Canvas>();
            _overlayCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _overlayCanvas.sortingOrder = 18;
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;

            // Vignette overlay
            var vigGo = new GameObject("Vignette");
            vigGo.transform.SetParent(canvasGo.transform, false);
            _vignetteImage = vigGo.AddComponent<Image>();
            _vignetteImage.sprite = CreateVignetteSprite();
            _vignetteImage.type = Image.Type.Simple;
            _vignetteImage.color = new Color(0, 0, 0, 0);
            _vignetteImage.raycastTarget = false;
            var vigRt = _vignetteImage.rectTransform;
            vigRt.anchorMin = Vector2.zero;
            vigRt.anchorMax = Vector2.one;
            vigRt.sizeDelta = Vector2.zero;

            // Transition (full-screen fade)
            var transGo = new GameObject("Transition");
            transGo.transform.SetParent(canvasGo.transform, false);
            _transitionImage = transGo.AddComponent<Image>();
            _transitionImage.color = new Color(0, 0, 0, 0);
            _transitionImage.raycastTarget = false;
            var transRt = _transitionImage.rectTransform;
            transRt.anchorMin = Vector2.zero;
            transRt.anchorMax = Vector2.one;
            transRt.sizeDelta = Vector2.zero;

            // Emotion bubble
            var bubbleGo = new GameObject("EmotionBubble");
            bubbleGo.transform.SetParent(canvasGo.transform, false);
            _emotionBubbleCG = bubbleGo.AddComponent<CanvasGroup>();
            _emotionBubbleCG.alpha = 0;
            _emotionBubbleCG.blocksRaycasts = false;
            _emotionBubbleRT = bubbleGo.GetComponent<RectTransform>();
            _emotionBubbleRT.anchorMin = new Vector2(0.5f, 0.5f);
            _emotionBubbleRT.anchorMax = new Vector2(0.5f, 0.5f);
            _emotionBubbleRT.sizeDelta = new Vector2(80, 80);

            var bubbleBg = new GameObject("BubbleBg");
            bubbleBg.transform.SetParent(bubbleGo.transform, false);
            var bgImg = bubbleBg.AddComponent<Image>();
            bgImg.color = new Color(0.05f, 0.04f, 0.08f, 0.7f);
            var bgRt = bgImg.rectTransform;
            bgRt.anchorMin = Vector2.zero;
            bgRt.anchorMax = Vector2.one;
            bgRt.sizeDelta = Vector2.zero;

            var textGo = new GameObject("EmotionText");
            textGo.transform.SetParent(bubbleGo.transform, false);
            _emotionBubbleText = textGo.AddComponent<TextMeshProUGUI>();
            _emotionBubbleText.fontSize = 40;
            _emotionBubbleText.alignment = TextAlignmentOptions.Center;
            var textRt = _emotionBubbleText.rectTransform;
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.sizeDelta = Vector2.zero;
        }

        #region Event Handlers

        private void HandleModeChanged(GameMode prev, GameMode curr)
        {
            if (curr == GameMode.Dialogue)
            {
                _currentNPCTransform = _modeManager?.GetDialogueFocusTarget();
                SetNPCDialogueMode(true);
                FadeVignette(VignetteNeutral, 0.5f);
            }
            else if (prev == GameMode.Dialogue)
            {
                SetNPCDialogueMode(false);
                FadeVignette(new Color(0, 0, 0, 0), 0.3f);
                _currentNPCTransform = null;
                _currentSpeaker = null;
                _currentEmotion = null;
            }
        }

        private void HandleSpeakerChanged(string speaker, string emotion)
        {
            _currentSpeaker = speaker;
            _currentEmotion = emotion;

            bool isDangerous = speaker == "Apollyon" || speaker == "Giant Despair";
            bool isHoly = speaker == "Shining One" || speaker == "Good-will" ||
                          speaker == "Interpreter" || speaker == "Evangelist";

            if (isDangerous)
                FadeVignette(VignetteTense, 0.3f);
            else if (isHoly)
                FadeVignette(VignetteHoly, 0.3f);
            else
                FadeVignette(VignetteNeutral, 0.3f);

            // Camera impact on first speaker appearance
            var cam = TopDownCamera.Instance;
            if (cam != null)
                cam.ImpactZoom(0.2f, 0.15f);
        }

        private void HandleEmotionChanged(string emotion)
        {
            _currentEmotion = emotion;
            string symbol = GetEmotionSymbol(emotion);
            Color symbolColor = GetEmotionColor(emotion);

            if (!string.IsNullOrEmpty(symbol))
                ShowEmotionBubble(symbol, symbolColor);

            // Screen tint based on emotion
            switch (emotion.ToLower())
            {
                case "angry":
                case "threatening":
                case "rage":
                    ScreenFlash.Instance?.Flash(new Color(0.6f, 0.1f, 0.05f, 0.15f), 0.4f);
                    TopDownCamera.Instance?.Shake(0.08f, 0.2f);
                    break;
                case "scared":
                case "distressed":
                case "fearful":
                    TopDownCamera.Instance?.Shake(0.05f, 0.3f);
                    break;
                case "happy":
                case "joyful":
                case "relieved":
                    ScreenFlash.Instance?.Flash(new Color(1f, 0.95f, 0.7f, 0.1f), 0.3f);
                    FadeVignette(VignetteJoy, 0.3f);
                    break;
                case "prayerful":
                case "wise":
                case "blessed":
                    ScreenFlash.Instance?.Flash(new Color(1f, 0.92f, 0.55f, 0.12f), 0.5f);
                    break;
                case "sad":
                case "sorrowful":
                    FadeVignette(new Color(0.05f, 0.05f, 0.1f, 0.25f), 0.5f);
                    TransitionLighting(new Color(0.5f, 0.5f, 0.65f), 0.5f, 1f);
                    SpawnWeatherParticles("rain", 30, 3f);
                    break;
            }

            if (emotion.ToLower() == "joyful" || emotion.ToLower() == "blessed")
            {
                SpawnWeatherParticles("sparkle", 15, 2f);
                TransitionLighting(new Color(1f, 0.95f, 0.8f), 1.1f, 0.8f);
            }
            else if (emotion.ToLower() == "rage" || emotion.ToLower() == "angry")
            {
                SpawnWeatherParticles("embers", 10, 2f);
                TransitionLighting(new Color(0.8f, 0.4f, 0.3f), 0.6f, 0.5f);
            }

            // Trigger NPC animation
            if (_currentNPCTransform != null)
            {
                var npcBehavior = _currentNPCTransform.GetComponent<NPCBehavior>();
                npcBehavior?.PlayEmotion(emotion);
            }

            // Trigger player reaction for intense emotions
            TriggerPlayerReaction(emotion);
        }

        private void HandleShake(string value)
        {
            float mag = 0.15f;
            float dur = 0.3f;
            if (value == "strong") { mag = 0.3f; dur = 0.5f; }
            else if (value == "light") { mag = 0.08f; dur = 0.2f; }

            TopDownCamera.Instance?.Shake(mag, dur);
        }

        private void HandleWait(float seconds)
        {
            if (_waitCoroutine != null) StopCoroutine(_waitCoroutine);
            _waitCoroutine = StartCoroutine(WaitPause(seconds));
        }

        private void HandleTransition(string type)
        {
            if (_transitionCoroutine != null) StopCoroutine(_transitionCoroutine);
            switch (type?.ToLower())
            {
                case "fadein":
                    _transitionCoroutine = StartCoroutine(FadeTransition(1, 0, 0.8f));
                    break;
                case "fadeout":
                    _transitionCoroutine = StartCoroutine(FadeTransition(0, 1, 0.8f));
                    break;
                case "flash":
                    ScreenFlash.Instance?.Flash(new Color(1, 1, 1, 0.8f), 0.4f);
                    break;
                case "holy":
                    ScreenFlash.Instance?.Flash(new Color(1f, 0.92f, 0.55f, 0.6f), 0.8f);
                    break;
                default:
                    _transitionCoroutine = StartCoroutine(FadeTransition(0, 1, 0.5f));
                    break;
            }
        }

        private void HandleStatChange(string stat, int delta)
        {
            bool isPositive = delta > 0;
            Color flashColor = isPositive
                ? new Color(0.3f, 0.8f, 0.3f, 0.1f)
                : new Color(0.8f, 0.3f, 0.3f, 0.1f);
            ScreenFlash.Instance?.Flash(flashColor, 0.25f);

            if (!isPositive)
                TopDownCamera.Instance?.Shake(0.06f, 0.15f);
            else
                TopDownCamera.Instance?.ImpactZoom(0.2f, 0.15f);

            ShowStatPopup(stat, delta);
        }

        private void HandleBurdenChange(int delta)
        {
            if (delta < 0)
            {
                ScreenFlash.Instance?.Flash(new Color(1f, 0.95f, 0.7f, 0.2f), 0.5f);
                TopDownCamera.Instance?.ImpactZoom(0.4f, 0.3f);

                var player = FindFirstObjectByType<PlayerController>();
                if (player != null)
                {
                    var animFx = player.GetComponent<CharacterAnimationFX>();
                    animFx?.Play(AnimAction.Celebrate);
                }
            }
            else
            {
                ScreenFlash.Instance?.Flash(new Color(0.4f, 0.2f, 0.1f, 0.15f), 0.3f);
                TopDownCamera.Instance?.Shake(0.08f, 0.2f);
            }

            var lm = ServiceLocator.TryGet<Localization.LocalizationManager>(out var l) ? l : null;
            bool isKo = lm != null && lm.CurrentLanguage == "ko";
            string label = isKo ? "짐" : "Burden";
            string sign = delta > 0 ? "+" : "";
            Color color = delta < 0 ? new Color(0.4f, 0.85f, 0.5f) : new Color(0.85f, 0.5f, 0.3f);
            ShowFloatingText($"{label} {sign}{delta}", color);
        }

        private void ShowStatPopup(string stat, int delta)
        {
            var lm = ServiceLocator.TryGet<Localization.LocalizationManager>(out var l) ? l : null;
            bool isKo = lm != null && lm.CurrentLanguage == "ko";
            string label;
            Color color;
            switch (stat.ToLower())
            {
                case "faith":
                    label = isKo ? "믿음" : "Faith";
                    color = delta > 0 ? new Color(1f, 0.85f, 0.3f) : new Color(0.85f, 0.5f, 0.3f);
                    break;
                case "courage":
                    label = isKo ? "용기" : "Courage";
                    color = delta > 0 ? new Color(0.4f, 0.7f, 1f) : new Color(0.85f, 0.5f, 0.3f);
                    break;
                case "wisdom":
                    label = isKo ? "지혜" : "Wisdom";
                    color = delta > 0 ? new Color(0.5f, 0.9f, 0.5f) : new Color(0.85f, 0.5f, 0.3f);
                    break;
                default:
                    label = stat;
                    color = Color.white;
                    break;
            }
            string sign = delta > 0 ? "+" : "";
            ShowFloatingText($"{label} {sign}{delta}", color);
        }

        private void ShowFloatingText(string text, Color color)
        {
            if (_overlayCanvas == null) return;

            var go = new GameObject("FloatStat");
            go.transform.SetParent(_overlayCanvas.transform, false);
            var tmp = go.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = 28;
            tmp.fontStyle = FontStyles.Bold;
            tmp.color = color;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.raycastTarget = false;
            var rt = tmp.rectTransform;
            rt.anchorMin = new Vector2(0.35f, 0.68f);
            rt.anchorMax = new Vector2(0.65f, 0.76f);
            rt.sizeDelta = Vector2.zero;

            StartCoroutine(FloatAndFade(go, tmp, rt));
        }

        private IEnumerator FloatAndFade(GameObject go, TextMeshProUGUI tmp, RectTransform rt)
        {
            float elapsed = 0f;
            float duration = 1.8f;
            Vector2 startAnc = rt.anchoredPosition;
            Color startColor = tmp.color;

            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = elapsed / duration;

                float scaleT = t < 0.15f ? Mathf.Lerp(0.5f, 1.2f, t / 0.15f)
                             : t < 0.3f ? Mathf.Lerp(1.2f, 1f, (t - 0.15f) / 0.15f) : 1f;
                go.transform.localScale = Vector3.one * scaleT;

                rt.anchoredPosition = startAnc + Vector2.up * (40f * t);

                float alpha = t < 0.2f ? 1f : Mathf.Lerp(1f, 0f, (t - 0.2f) / 0.8f);
                tmp.color = new Color(startColor.r, startColor.g, startColor.b, alpha);

                yield return null;
            }
            Destroy(go);
        }

        private void HandleLocationChanged(string location)
        {
            if (string.IsNullOrEmpty(location)) return;

            string loc = location.ToLower();
            if (loc.Contains("dark") || loc.Contains("valley") || loc.Contains("shadow"))
                TransitionLighting(new Color(0.3f, 0.25f, 0.45f), 0.3f, 1.5f);
            else if (loc.Contains("celestial") || loc.Contains("heaven") || loc.Contains("paradise"))
                TransitionLighting(new Color(1f, 0.95f, 0.78f), 1.2f, 1.5f);
            else if (loc.Contains("city") || loc.Contains("vanity") || loc.Contains("market"))
                TransitionLighting(new Color(0.9f, 0.85f, 0.7f), 0.7f, 1f);
        }

        private void HandleBgmChanged(string bgm)
        {
            Debug.Log($"[DialogueFX] BGM change requested: {bgm} (audio system placeholder)");
        }

        private void HandleBibleCard(string cardId)
        {
            ScreenFlash.Instance?.Flash(new Color(1f, 0.92f, 0.55f, 0.35f), 1.0f);
            TopDownCamera.Instance?.ImpactZoom(0.5f, 0.4f);
            ShowEmotionBubble("\u2727", new Color(1f, 0.90f, 0.50f));
            TransitionLighting(new Color(1f, 0.95f, 0.7f), 1.3f, 1.5f);
        }

        #endregion

        #region Dynamic Lighting & Weather

        private Coroutine _lightingCoroutine;
        private Coroutine _weatherCoroutine;
        private Light2D _globalLight;

        private Light2D FindGlobalLight()
        {
            if (_globalLight != null) return _globalLight;
            foreach (var light in Object.FindObjectsByType<Light2D>(FindObjectsSortMode.None))
            {
                if (light.lightType == Light2D.LightType.Global)
                {
                    _globalLight = light;
                    return light;
                }
            }
            return null;
        }

        public void TransitionLighting(Color targetColor, float targetIntensity, float duration)
        {
            var light = FindGlobalLight();
            if (light == null) return;
            if (_lightingCoroutine != null) StopCoroutine(_lightingCoroutine);
            _lightingCoroutine = StartCoroutine(LightingTransitionRoutine(light, targetColor, targetIntensity, duration));
        }

        private IEnumerator LightingTransitionRoutine(Light2D light, Color targetColor, float targetIntensity, float duration)
        {
            Color startColor = light.color;
            float startIntensity = light.intensity;
            float t = 0;
            while (t < duration)
            {
                t += Time.deltaTime;
                float p = Mathf.SmoothStep(0, 1, t / duration);
                light.color = Color.Lerp(startColor, targetColor, p);
                light.intensity = Mathf.Lerp(startIntensity, targetIntensity, p);
                yield return null;
            }
            light.color = targetColor;
            light.intensity = targetIntensity;
        }

        private void SpawnWeatherParticles(string type, int count, float duration)
        {
            if (_weatherCoroutine != null) StopCoroutine(_weatherCoroutine);
            _weatherCoroutine = StartCoroutine(WeatherParticleRoutine(type, count, duration));
        }

        private IEnumerator WeatherParticleRoutine(string type, int count, float duration)
        {
            var cam = Camera.main;
            if (cam == null) yield break;

            float elapsed = 0;
            float interval = duration / count;

            Color particleColor;
            float speed;
            switch (type)
            {
                case "rain":
                    particleColor = new Color(0.5f, 0.6f, 0.8f, 0.6f);
                    speed = 4f;
                    break;
                case "sparkle":
                    particleColor = new Color(1f, 0.95f, 0.7f, 0.8f);
                    speed = 1f;
                    break;
                case "embers":
                    particleColor = new Color(1f, 0.5f, 0.2f, 0.7f);
                    speed = 1.5f;
                    break;
                default:
                    particleColor = Color.white;
                    speed = 1f;
                    break;
            }

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                if (elapsed % interval < Time.deltaTime)
                {
                    Vector3 spawnPos = cam.transform.position +
                        new Vector3(Random.Range(-6f, 6f), Random.Range(3f, 5f), 10f);
                    SpawnSingleWeatherParticle(spawnPos, particleColor, speed, type);
                }
                yield return null;
            }
        }

        private void SpawnSingleWeatherParticle(Vector3 pos, Color color, float speed, string type)
        {
            var go = new GameObject("WeatherParticle");
            go.transform.position = pos;
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sortingOrder = 85;

            int ps = type == "rain" ? 2 : 4;
            var tex = new Texture2D(ps, ps);
            for (int y = 0; y < ps; y++)
                for (int x = 0; x < ps; x++)
                {
                    float d = Vector2.Distance(new Vector2(x, y), new Vector2(ps / 2f, ps / 2f));
                    tex.SetPixel(x, y, d < ps / 2f ? color : Color.clear);
                }
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            sr.sprite = Sprite.Create(tex, new Rect(0, 0, ps, ps), Vector2.one * 0.5f, 16);

            Vector2 vel = type == "rain"
                ? new Vector2(Random.Range(-0.3f, 0.3f), -speed)
                : new Vector2(Random.Range(-0.5f, 0.5f), Random.Range(0.5f, speed));
            go.AddComponent<ParticleMover>().Initialize(vel, Random.Range(1f, 2f));
        }

        #endregion

        #region Visual Effects

        private void FadeVignette(Color targetColor, float duration)
        {
            if (_vignetteImage == null) return;
            if (_vignetteCoroutine != null) StopCoroutine(_vignetteCoroutine);
            _vignetteCoroutine = StartCoroutine(FadeVignetteRoutine(targetColor, duration));
        }

        private IEnumerator FadeVignetteRoutine(Color target, float duration)
        {
            Color start = _vignetteImage.color;
            float t = 0;
            while (t < duration)
            {
                t += Time.deltaTime;
                _vignetteImage.color = Color.Lerp(start, target, t / duration);
                yield return null;
            }
            _vignetteImage.color = target;
        }

        private void ShowEmotionBubble(string symbol, Color color)
        {
            if (_emotionBubbleCG == null) return;
            if (_emotionBubbleCoroutine != null) StopCoroutine(_emotionBubbleCoroutine);
            _emotionBubbleCoroutine = StartCoroutine(EmotionBubbleRoutine(symbol, color));
        }

        private IEnumerator EmotionBubbleRoutine(string symbol, Color color)
        {
            _emotionBubbleText.text = symbol;
            _emotionBubbleText.color = color;

            Vector2 screenPos = new Vector2(0.5f, 0.6f);
            if (_currentNPCTransform != null && Camera.main != null)
            {
                Vector3 npcScreen = Camera.main.WorldToViewportPoint(
                    _currentNPCTransform.position + Vector3.up * 1.5f);
                screenPos = new Vector2(npcScreen.x, npcScreen.y);
            }

            _emotionBubbleRT.anchorMin = screenPos;
            _emotionBubbleRT.anchorMax = screenPos;
            _emotionBubbleRT.anchoredPosition = Vector2.zero;

            // Pop in
            float t = 0;
            float popDur = 0.2f;
            while (t < popDur)
            {
                t += Time.deltaTime;
                float p = t / popDur;
                float scale = p < 0.7f
                    ? Mathf.Lerp(0.3f, 1.3f, p / 0.7f)
                    : Mathf.Lerp(1.3f, 1.0f, (p - 0.7f) / 0.3f);
                _emotionBubbleRT.localScale = Vector3.one * scale;
                _emotionBubbleCG.alpha = Mathf.Clamp01(p * 3f);
                yield return null;
            }
            _emotionBubbleCG.alpha = 1;
            _emotionBubbleRT.localScale = Vector3.one;

            // Hold
            yield return new WaitForSeconds(1.2f);

            // Float up and fade
            t = 0;
            float fadeDur = 0.5f;
            Vector2 startPos = _emotionBubbleRT.anchoredPosition;
            while (t < fadeDur)
            {
                t += Time.deltaTime;
                float p = t / fadeDur;
                _emotionBubbleCG.alpha = 1 - p;
                _emotionBubbleRT.anchoredPosition = startPos + Vector2.up * (30 * p);
                yield return null;
            }
            _emotionBubbleCG.alpha = 0;
        }

        private IEnumerator WaitPause(float seconds)
        {
            yield return new WaitForSeconds(seconds);
        }

        private IEnumerator FadeTransition(float startAlpha, float endAlpha, float duration)
        {
            if (_transitionImage == null) yield break;
            float t = 0;
            Color c = _transitionImage.color;
            while (t < duration)
            {
                t += Time.deltaTime;
                c.a = Mathf.Lerp(startAlpha, endAlpha, t / duration);
                _transitionImage.color = c;
                yield return null;
            }
            c.a = endAlpha;
            _transitionImage.color = c;
        }

        private void SetNPCDialogueMode(bool inDialogue)
        {
            if (_currentNPCTransform == null) return;

            var npcBehavior = _currentNPCTransform.GetComponent<NPCBehavior>();
            if (npcBehavior != null)
                npcBehavior.SetInDialogue(inDialogue);

            // Face player
            if (inDialogue)
            {
                var player = FindFirstObjectByType<PlayerController>();
                if (player != null)
                {
                    var npcSr = _currentNPCTransform.GetComponent<SpriteRenderer>();
                    if (npcSr != null)
                        npcSr.flipX = player.transform.position.x < _currentNPCTransform.position.x;
                }
            }
        }

        private void TriggerPlayerReaction(string emotion)
        {
            var player = FindFirstObjectByType<PlayerController>();
            if (player == null) return;
            var animFx = player.GetComponent<CharacterAnimationFX>();
            if (animFx == null) return;

            switch (emotion.ToLower())
            {
                case "threatening":
                case "rage":
                    animFx.Play(AnimAction.Defend);
                    break;
                case "scared":
                case "fearful":
                    animFx.Play(AnimAction.Shake);
                    break;
                case "blessed":
                    animFx.Play(AnimAction.Pray);
                    break;
            }
        }

        #endregion

        #region Helpers

        private static string GetEmotionSymbol(string emotion)
        {
            switch (emotion?.ToLower())
            {
                case "happy":
                case "joyful":
                case "relieved":
                    return "\u2665";   // heart
                case "angry":
                case "threatening":
                case "rage":
                    return "\u2620";   // skull/crossbones
                case "scared":
                case "distressed":
                case "fearful":
                    return "!?";
                case "prayerful":
                case "wise":
                case "blessed":
                    return "\u2727";   // sparkle
                case "sad":
                case "sorrowful":
                    return "\u2639";   // frown
                case "surprised":
                    return "!!";
                case "curious":
                    return "?";
                case "determined":
                    return "\u2694";   // crossed swords
                case "peaceful":
                    return "\u2606";   // star
                default:
                    return null;
            }
        }

        private static Color GetEmotionColor(string emotion)
        {
            switch (emotion?.ToLower())
            {
                case "happy":
                case "joyful":
                case "relieved":
                    return new Color(1f, 0.85f, 0.4f);
                case "angry":
                case "threatening":
                case "rage":
                    return new Color(0.9f, 0.25f, 0.2f);
                case "scared":
                case "distressed":
                case "fearful":
                    return new Color(0.6f, 0.5f, 0.9f);
                case "prayerful":
                case "wise":
                case "blessed":
                    return new Color(1f, 0.92f, 0.55f);
                case "sad":
                case "sorrowful":
                    return new Color(0.5f, 0.6f, 0.8f);
                case "surprised":
                    return new Color(1f, 0.9f, 0.5f);
                case "determined":
                    return new Color(0.8f, 0.45f, 0.3f);
                default:
                    return Color.white;
            }
        }

        private static Sprite CreateVignetteSprite()
        {
            int s = 128;
            var tex = new Texture2D(s, s, TextureFormat.RGBA32, false);
            float cx = s / 2f, cy = s / 2f;
            for (int y = 0; y < s; y++)
            {
                for (int x = 0; x < s; x++)
                {
                    float dx = (x - cx) / cx;
                    float dy = (y - cy) / cy;
                    float dist = Mathf.Sqrt(dx * dx + dy * dy);
                    float alpha = Mathf.Clamp01((dist - 0.4f) / 0.6f);
                    alpha = alpha * alpha;
                    tex.SetPixel(x, y, new Color(0, 0, 0, alpha));
                }
            }
            tex.Apply();
            tex.filterMode = FilterMode.Bilinear;
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.5f), s);
        }

        #endregion
    }
}
