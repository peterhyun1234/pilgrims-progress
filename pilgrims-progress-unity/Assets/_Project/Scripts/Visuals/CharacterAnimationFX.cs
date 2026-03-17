using System;
using System.Collections;
using UnityEngine;

namespace PilgrimsProgress.Visuals
{
    public enum AnimAction
    {
        None,
        Jump,
        Attack,
        Defend,
        Hit,
        Celebrate,
        Pray,
        Shake,
        Dodge
    }

    [RequireComponent(typeof(SpriteRenderer))]
    public class CharacterAnimationFX : MonoBehaviour
    {
        public event Action OnAnimComplete;

        private SpriteRenderer _sr;
        private Vector3 _baseScale;
        private Vector3 _basePos;
        private Color _baseColor;
        private Coroutine _activeAnim;
        private bool _isPlaying;

        private float _idleBreathTimer;
        private float _walkBobTimer;

        public bool IsPlaying => _isPlaying;

        private void Awake()
        {
            _sr = GetComponent<SpriteRenderer>();
            _baseScale = transform.localScale;
            _basePos = transform.localPosition;
            _baseColor = _sr.color;
        }

        private void LateUpdate()
        {
            if (_isPlaying) return;
            IdleBreath();
        }

        private void IdleBreath()
        {
            _idleBreathTimer += Time.deltaTime;
            float breath = Mathf.Sin(_idleBreathTimer * 1.8f) * 0.015f;
            transform.localScale = _baseScale + new Vector3(0, breath, 0);
        }

        public void WalkBob(bool moving)
        {
            if (_isPlaying) return;

            if (moving)
            {
                _walkBobTimer += Time.deltaTime * 10f;
                float bobY = Mathf.Abs(Mathf.Sin(_walkBobTimer)) * 0.06f;
                float squashX = 1f + Mathf.Sin(_walkBobTimer * 2f) * 0.03f;
                transform.localScale = new Vector3(
                    _baseScale.x * squashX,
                    _baseScale.y * (1f + bobY * 0.5f),
                    _baseScale.z);
                transform.localPosition = _basePos + new Vector3(0, bobY, 0);
            }
            else
            {
                _walkBobTimer = 0;
                transform.localPosition = _basePos;
            }
        }

        public void Play(AnimAction action, Action onComplete = null)
        {
            if (_activeAnim != null)
                StopCoroutine(_activeAnim);

            _activeAnim = StartCoroutine(PlayAnim(action, onComplete));
        }

        private IEnumerator PlayAnim(AnimAction action, Action onComplete)
        {
            _isPlaying = true;

            switch (action)
            {
                case AnimAction.Jump:
                    yield return JumpAnim();
                    break;
                case AnimAction.Attack:
                    yield return AttackAnim();
                    break;
                case AnimAction.Defend:
                    yield return DefendAnim();
                    break;
                case AnimAction.Hit:
                    yield return HitAnim();
                    break;
                case AnimAction.Celebrate:
                    yield return CelebrateAnim();
                    break;
                case AnimAction.Pray:
                    yield return PrayAnim();
                    break;
                case AnimAction.Shake:
                    yield return ShakeAnim();
                    break;
                case AnimAction.Dodge:
                    yield return DodgeAnim();
                    break;
            }

            transform.localScale = _baseScale;
            transform.localPosition = _basePos;
            _sr.color = _baseColor;

            _isPlaying = false;
            onComplete?.Invoke();
            OnAnimComplete?.Invoke();
        }

        private IEnumerator JumpAnim()
        {
            // Anticipation squash
            yield return ScaleTo(new Vector3(1.15f, 0.8f, 1f), 0.08f);
            // Jump up
            yield return MoveTo(_basePos + Vector3.up * 0.5f, 0.12f, new Vector3(0.9f, 1.2f, 1f));
            // Hang time
            yield return new WaitForSeconds(0.06f);
            // Fall down
            yield return MoveTo(_basePos, 0.1f, new Vector3(0.95f, 1.05f, 1f));
            // Landing squash
            yield return ScaleTo(new Vector3(1.2f, 0.75f, 1f), 0.06f);
            yield return ScaleTo(Vector3.one, 0.1f);
        }

        private IEnumerator AttackAnim()
        {
            Vector3 attackDir = Vector3.right * (_sr.flipX ? -1f : 1f);

            // Wind up
            yield return MoveTo(_basePos - attackDir * 0.15f, 0.08f, new Vector3(0.9f, 1.1f, 1f));
            // Lunge forward
            yield return MoveTo(_basePos + attackDir * 0.4f, 0.06f, new Vector3(1.15f, 0.9f, 1f));
            // Flash white
            _sr.color = Color.white;
            yield return new WaitForSeconds(0.04f);
            _sr.color = _baseColor;
            // Return
            yield return MoveTo(_basePos, 0.12f, Vector3.one);
        }

        private IEnumerator DefendAnim()
        {
            // Brace
            yield return ScaleTo(new Vector3(1.1f, 0.9f, 1f), 0.08f);
            // Tint slightly blue for shield effect
            _sr.color = new Color(0.7f, 0.8f, 1f, 1f);
            yield return new WaitForSeconds(0.4f);
            // Flash
            _sr.color = Color.white;
            yield return new WaitForSeconds(0.05f);
            _sr.color = _baseColor;
            yield return ScaleTo(Vector3.one, 0.1f);
        }

        private IEnumerator HitAnim()
        {
            // Flash red
            _sr.color = new Color(1f, 0.3f, 0.3f, 1f);
            // Knockback
            float dir = _sr.flipX ? 0.2f : -0.2f;
            yield return MoveTo(_basePos + new Vector3(dir, 0, 0), 0.04f);
            yield return new WaitForSeconds(0.05f);
            // Shake
            for (int i = 0; i < 3; i++)
            {
                transform.localPosition = _basePos + new Vector3(
                    UnityEngine.Random.Range(-0.08f, 0.08f),
                    UnityEngine.Random.Range(-0.04f, 0.04f), 0);
                yield return new WaitForSeconds(0.03f);
            }
            _sr.color = _baseColor;
            transform.localPosition = _basePos;
            // Recovery
            yield return ScaleTo(Vector3.one, 0.08f);
        }

        private IEnumerator CelebrateAnim()
        {
            for (int i = 0; i < 2; i++)
            {
                yield return MoveTo(_basePos + Vector3.up * 0.3f, 0.1f, new Vector3(0.9f, 1.15f, 1f));
                yield return MoveTo(_basePos, 0.1f, Vector3.one);
            }
            // Happy squish
            yield return ScaleTo(new Vector3(1.15f, 0.88f, 1f), 0.06f);
            yield return ScaleTo(Vector3.one, 0.1f);
        }

        private IEnumerator PrayAnim()
        {
            // Kneel down
            yield return ScaleTo(new Vector3(1.05f, 0.85f, 1f), 0.2f);
            yield return MoveTo(_basePos + Vector3.down * 0.1f, 0.15f);
            // Glow
            _sr.color = new Color(1f, 1f, 0.8f, 1f);
            yield return new WaitForSeconds(0.6f);
            _sr.color = _baseColor;
            // Rise
            yield return MoveTo(_basePos, 0.2f, Vector3.one);
        }

        private IEnumerator ShakeAnim()
        {
            for (int i = 0; i < 6; i++)
            {
                transform.localPosition = _basePos + new Vector3(
                    UnityEngine.Random.Range(-0.06f, 0.06f),
                    UnityEngine.Random.Range(-0.03f, 0.03f), 0);
                yield return new WaitForSeconds(0.04f);
            }
            transform.localPosition = _basePos;
        }

        private IEnumerator DodgeAnim()
        {
            float dir = _sr.flipX ? 0.35f : -0.35f;
            yield return MoveTo(_basePos + new Vector3(dir, 0.1f, 0), 0.08f, new Vector3(0.85f, 1.1f, 1f));
            yield return new WaitForSeconds(0.05f);
            yield return MoveTo(_basePos, 0.12f, Vector3.one);
        }

        private IEnumerator ScaleTo(Vector3 target, float duration)
        {
            Vector3 start = transform.localScale;
            float t = 0;
            while (t < duration)
            {
                t += Time.deltaTime;
                float p = Mathf.SmoothStep(0, 1, t / duration);
                transform.localScale = Vector3.Lerp(start, new Vector3(
                    _baseScale.x * target.x, _baseScale.y * target.y, _baseScale.z * target.z), p);
                yield return null;
            }
        }

        private IEnumerator MoveTo(Vector3 target, float duration, Vector3? scaleTarget = null)
        {
            Vector3 startPos = transform.localPosition;
            Vector3 startScale = transform.localScale;
            Vector3 endScale = scaleTarget.HasValue
                ? new Vector3(_baseScale.x * scaleTarget.Value.x,
                              _baseScale.y * scaleTarget.Value.y,
                              _baseScale.z * scaleTarget.Value.z)
                : startScale;
            float t = 0;
            while (t < duration)
            {
                t += Time.deltaTime;
                float p = Mathf.SmoothStep(0, 1, t / duration);
                transform.localPosition = Vector3.Lerp(startPos, target, p);
                transform.localScale = Vector3.Lerp(startScale, endScale, p);
                yield return null;
            }
            transform.localPosition = target;
            transform.localScale = endScale;
        }

        public void UpdateBaseColor(Color c)
        {
            _baseColor = c;
        }
    }
}
