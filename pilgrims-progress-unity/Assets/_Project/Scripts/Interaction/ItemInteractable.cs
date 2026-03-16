using System;
using UnityEngine;
using PilgrimsProgress.Player;

namespace PilgrimsProgress.Interaction
{
    public class ItemInteractable : Interactable
    {
        [Header("Item")]
        [SerializeField] private string _itemId;
        [SerializeField] private string _itemType;

        [Header("Visuals")]
        [SerializeField] private SpriteRenderer _spriteRenderer;
        [SerializeField] private float _bobAmplitude = 0.1f;
        [SerializeField] private float _bobFrequency = 2f;

        public static event Action<string, string> OnItemCollected;

        private Vector3 _startPos;

        private void Start()
        {
            _startPos = transform.position;
        }

        private void Update()
        {
            float offset = Mathf.Sin(Time.time * _bobFrequency) * _bobAmplitude;
            transform.position = _startPos + Vector3.up * offset;
        }

        protected override void OnInteract(PlayerController player)
        {
            OnItemCollected?.Invoke(_itemId, _itemType);

            if (_spriteRenderer != null)
                _spriteRenderer.enabled = false;

            gameObject.SetActive(false);
        }
    }
}
