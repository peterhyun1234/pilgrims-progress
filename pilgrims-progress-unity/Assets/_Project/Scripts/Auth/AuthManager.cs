using System;
using UnityEngine;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.Auth
{
    public enum AuthState
    {
        Guest,
        LoggedIn
    }

    public class AuthManager : MonoBehaviour
    {
        public static AuthManager Instance { get; private set; }

        public AuthState State { get; private set; } = AuthState.Guest;
        public string GuestId { get; private set; }
        public string DisplayName { get; private set; }

        private const string GuestIdKey = "GuestSessionId";

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

            StartGuestSession();
        }

        public void StartGuestSession()
        {
            GuestId = PlayerPrefs.GetString(GuestIdKey, "");
            if (string.IsNullOrEmpty(GuestId))
            {
                GuestId = Guid.NewGuid().ToString();
                PlayerPrefs.SetString(GuestIdKey, GuestId);
                PlayerPrefs.Save();
            }

            State = AuthState.Guest;

            var loc = ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) ? lm : null;
            DisplayName = loc != null ? loc.Get("game_guest") : "Guest";

            Debug.Log($"[AuthManager] Guest session: {GuestId.Substring(0, 8)}...");
        }

        // Future implementation stubs
        // public async Task<bool> Login(string email, string password) { ... }
        // public async Task<bool> Register(string email, string password) { ... }
        // public void Logout() { State = AuthState.Guest; StartGuestSession(); }
    }
}
