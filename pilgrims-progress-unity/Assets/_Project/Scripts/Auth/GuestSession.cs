using UnityEngine;

namespace PilgrimsProgress.Auth
{
    [System.Serializable]
    public class GuestSession
    {
        public string SessionId;
        public string CreatedAt;
        public float TotalPlayTimeSeconds;

        public GuestSession(string sessionId)
        {
            SessionId = sessionId;
            CreatedAt = System.DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
            TotalPlayTimeSeconds = 0f;
        }
    }
}
