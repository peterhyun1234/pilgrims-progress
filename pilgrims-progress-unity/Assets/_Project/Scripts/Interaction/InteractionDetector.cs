using System.Collections.Generic;
using UnityEngine;

namespace PilgrimsProgress.Interaction
{
    public class InteractionDetector : MonoBehaviour
    {
        [SerializeField] private float _detectionRadius = 1.5f;
        [SerializeField] private LayerMask _interactableLayer = ~0;

        private readonly List<Interactable> _nearbyInteractables = new List<Interactable>();
        private Interactable _currentClosest;
        private CircleCollider2D _triggerCollider;

        private void Awake()
        {
            _triggerCollider = gameObject.AddComponent<CircleCollider2D>();
            _triggerCollider.isTrigger = true;
            _triggerCollider.radius = _detectionRadius;
        }

        private void Update()
        {
            _nearbyInteractables.RemoveAll(i => i == null || !i.gameObject.activeInHierarchy);

            var closest = GetClosestInteractable();

            if (closest != _currentClosest)
            {
                if (_currentClosest != null)
                    _currentClosest.ShowPrompt(false);

                _currentClosest = closest;

                if (_currentClosest != null && _currentClosest.CanInteract)
                    _currentClosest.ShowPrompt(true);
            }
        }

        public Interactable GetClosestInteractable()
        {
            Interactable closest = null;
            float closestDist = float.MaxValue;

            foreach (var interactable in _nearbyInteractables)
            {
                if (interactable == null || !interactable.CanInteract) continue;

                float dist = Vector2.Distance(transform.position, interactable.transform.position);
                if (dist < closestDist)
                {
                    closestDist = dist;
                    closest = interactable;
                }
            }

            return closest;
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            var interactable = other.GetComponent<Interactable>();
            if (interactable != null && !_nearbyInteractables.Contains(interactable))
            {
                _nearbyInteractables.Add(interactable);
            }
        }

        private void OnTriggerExit2D(Collider2D other)
        {
            var interactable = other.GetComponent<Interactable>();
            if (interactable != null)
            {
                _nearbyInteractables.Remove(interactable);
                interactable.ShowPrompt(false);
            }
        }
    }
}
