using UnityEngine;

namespace PilgrimsProgress.Visuals
{
    public class ParticleMover : MonoBehaviour
    {
        private Vector2 _velocity;
        private float _lifetime;
        private float _elapsed;
        private SpriteRenderer _sr;

        public void Initialize(Vector2 velocity, float lifetime)
        {
            _velocity = velocity;
            _lifetime = lifetime;
            _sr = GetComponent<SpriteRenderer>();
        }

        private void Update()
        {
            _elapsed += Time.deltaTime;
            if (_elapsed >= _lifetime)
            {
                Destroy(gameObject);
                return;
            }

            transform.position += (Vector3)_velocity * Time.deltaTime;
            _velocity *= 0.95f;

            float alpha = 1f - (_elapsed / _lifetime);
            float scale = 1f - (_elapsed / _lifetime) * 0.5f;
            transform.localScale = Vector3.one * scale;

            if (_sr != null)
            {
                var c = _sr.color;
                _sr.color = new Color(c.r, c.g, c.b, alpha);
            }
        }
    }
}
