using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.Audio
{
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        [Header("Volume Settings")]
        private float _masterVolume = 1f;
        private float _bgmVolume = 0.7f;
        private float _sfxVolume = 1f;
        private float _ambientVolume = 0.5f;

        private AudioSource _bgmSourceA;
        private AudioSource _bgmSourceB;
        private AudioSource _sfxSource;
        private AudioSource _ambientSource;
        private AudioSource _uiSource;

        private bool _isBgmSourceAActive = true;
        private Coroutine _crossfadeCoroutine;

        private const float CrossfadeDuration = 1.5f;

        private Dictionary<string, AudioClip> _bgmClips = new Dictionary<string, AudioClip>();
        private Dictionary<string, AudioClip> _sfxClips = new Dictionary<string, AudioClip>();
        private Dictionary<string, AudioClip> _ambientClips = new Dictionary<string, AudioClip>();

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            ServiceLocator.Register(this);

            InitializeAudioSources();
            LoadVolumeSettings();
        }

        private void InitializeAudioSources()
        {
            _bgmSourceA = CreateAudioSource("BGM_A", true);
            _bgmSourceB = CreateAudioSource("BGM_B", true);
            _sfxSource = CreateAudioSource("SFX", false);
            _ambientSource = CreateAudioSource("Ambient", true);
            _uiSource = CreateAudioSource("UI", false);

            _bgmSourceB.volume = 0f;
        }

        private AudioSource CreateAudioSource(string sourceName, bool loop)
        {
            var go = new GameObject($"AudioSource_{sourceName}");
            go.transform.SetParent(transform);
            var source = go.AddComponent<AudioSource>();
            source.playOnAwake = false;
            source.loop = loop;
            return source;
        }

        public void RegisterBGM(string id, AudioClip clip)
        {
            _bgmClips[id] = clip;
        }

        public void RegisterSFX(string id, AudioClip clip)
        {
            _sfxClips[id] = clip;
        }

        public void RegisterAmbient(string id, AudioClip clip)
        {
            _ambientClips[id] = clip;
        }

        public void PlayBGM(string id, bool crossfade = true)
        {
            if (!_bgmClips.TryGetValue(id, out var clip))
            {
                Debug.LogWarning($"[AudioManager] BGM not found: {id}");
                return;
            }

            if (crossfade)
            {
                CrossfadeBGM(clip);
            }
            else
            {
                var activeSource = _isBgmSourceAActive ? _bgmSourceA : _bgmSourceB;
                activeSource.clip = clip;
                activeSource.volume = _bgmVolume * _masterVolume;
                activeSource.Play();
            }
        }

        private void CrossfadeBGM(AudioClip newClip)
        {
            if (_crossfadeCoroutine != null)
            {
                StopCoroutine(_crossfadeCoroutine);
            }
            _crossfadeCoroutine = StartCoroutine(CrossfadeCoroutine(newClip));
        }

        private IEnumerator CrossfadeCoroutine(AudioClip newClip)
        {
            var fadeOutSource = _isBgmSourceAActive ? _bgmSourceA : _bgmSourceB;
            var fadeInSource = _isBgmSourceAActive ? _bgmSourceB : _bgmSourceA;

            fadeInSource.clip = newClip;
            fadeInSource.volume = 0f;
            fadeInSource.Play();

            float targetVolume = _bgmVolume * _masterVolume;
            float elapsed = 0f;

            while (elapsed < CrossfadeDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = elapsed / CrossfadeDuration;
                fadeOutSource.volume = Mathf.Lerp(targetVolume, 0f, t);
                fadeInSource.volume = Mathf.Lerp(0f, targetVolume, t);
                yield return null;
            }

            fadeOutSource.Stop();
            fadeOutSource.volume = 0f;
            fadeInSource.volume = targetVolume;

            _isBgmSourceAActive = !_isBgmSourceAActive;
            _crossfadeCoroutine = null;
        }

        public void StopBGM(float fadeOutDuration = 1f)
        {
            if (_crossfadeCoroutine != null)
            {
                StopCoroutine(_crossfadeCoroutine);
            }
            StartCoroutine(FadeOutBGM(fadeOutDuration));
        }

        private IEnumerator FadeOutBGM(float duration)
        {
            var source = _isBgmSourceAActive ? _bgmSourceA : _bgmSourceB;
            float startVol = source.volume;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                source.volume = Mathf.Lerp(startVol, 0f, elapsed / duration);
                yield return null;
            }

            source.Stop();
            source.volume = 0f;
        }

        public void PlaySFX(string id)
        {
            if (!_sfxClips.TryGetValue(id, out var clip))
            {
                Debug.LogWarning($"[AudioManager] SFX not found: {id}");
                return;
            }
            _sfxSource.PlayOneShot(clip, _sfxVolume * _masterVolume);
        }

        public void PlayAmbient(string id)
        {
            if (!_ambientClips.TryGetValue(id, out var clip))
            {
                Debug.LogWarning($"[AudioManager] Ambient not found: {id}");
                return;
            }
            _ambientSource.clip = clip;
            _ambientSource.volume = _ambientVolume * _masterVolume;
            _ambientSource.Play();
        }

        public void StopAmbient()
        {
            _ambientSource.Stop();
        }

        public void PlayUISound(AudioClip clip)
        {
            _uiSource.PlayOneShot(clip, _sfxVolume * _masterVolume);
        }

        public void SetMasterVolume(float volume)
        {
            _masterVolume = Mathf.Clamp01(volume);
            UpdateAllVolumes();
            SaveVolumeSettings();
        }

        public void SetBGMVolume(float volume)
        {
            _bgmVolume = Mathf.Clamp01(volume);
            UpdateAllVolumes();
            SaveVolumeSettings();
        }

        public void SetSFXVolume(float volume)
        {
            _sfxVolume = Mathf.Clamp01(volume);
            SaveVolumeSettings();
        }

        public void SetAmbientVolume(float volume)
        {
            _ambientVolume = Mathf.Clamp01(volume);
            _ambientSource.volume = _ambientVolume * _masterVolume;
            SaveVolumeSettings();
        }

        private void UpdateAllVolumes()
        {
            var activeSource = _isBgmSourceAActive ? _bgmSourceA : _bgmSourceB;
            activeSource.volume = _bgmVolume * _masterVolume;
            _ambientSource.volume = _ambientVolume * _masterVolume;
        }

        private void SaveVolumeSettings()
        {
            PlayerPrefs.SetFloat("MasterVolume", _masterVolume);
            PlayerPrefs.SetFloat("BGMVolume", _bgmVolume);
            PlayerPrefs.SetFloat("SFXVolume", _sfxVolume);
            PlayerPrefs.SetFloat("AmbientVolume", _ambientVolume);
            PlayerPrefs.Save();
        }

        private void LoadVolumeSettings()
        {
            _masterVolume = PlayerPrefs.GetFloat("MasterVolume", 1f);
            _bgmVolume = PlayerPrefs.GetFloat("BGMVolume", 0.7f);
            _sfxVolume = PlayerPrefs.GetFloat("SFXVolume", 1f);
            _ambientVolume = PlayerPrefs.GetFloat("AmbientVolume", 0.5f);
        }

        public float MasterVolume => _masterVolume;
        public float BGMVolume => _bgmVolume;
        public float SFXVolume => _sfxVolume;
        public float AmbientVolume => _ambientVolume;
    }
}
