using System.Collections.Generic;
using UnityEngine;
using PP.Core;

namespace PP.Interaction
{
    public class InteractionDetector : MonoBehaviour
    {
        [SerializeField] private float _radius = 1.5f;
        [SerializeField] private LayerMask _interactableLayer = ~0;

        private readonly List<IInteractable> _nearby = new();
        private readonly Collider2D[] _buffer = new Collider2D[16];

        private void Awake()
        {
            ServiceLocator.RegisterTransient(this);
        }

        private void FixedUpdate()
        {
            _nearby.Clear();
            int count = Physics2D.OverlapCircleNonAlloc(transform.position, _radius, _buffer, _interactableLayer);
            for (int i = 0; i < count; i++)
            {
                if (_buffer[i].TryGetComponent<IInteractable>(out var interactable) && interactable.CanInteract)
                    _nearby.Add(interactable);
            }
        }

        public IInteractable GetClosest()
        {
            if (_nearby.Count == 0) return null;
            IInteractable closest = null;
            float minDist = float.MaxValue;
            foreach (var i in _nearby)
            {
                float d = Vector2.Distance(transform.position, i.Transform.position);
                if (d < minDist) { minDist = d; closest = i; }
            }
            return closest;
        }

        public bool HasTarget => _nearby.Count > 0;

        private void OnDrawGizmosSelected()
        {
            Gizmos.color = Color.green;
            Gizmos.DrawWireSphere(transform.position, _radius);
        }

        private void OnDestroy()
        {
            ServiceLocator.Unregister<InteractionDetector>();
        }
    }
}
