using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using PilgrimsProgress.Core;
using PilgrimsProgress.Player;

namespace PilgrimsProgress.UI
{
    /// <summary>
    /// Mobile virtual joystick for top-down player movement.
    /// </summary>
    public class VirtualJoystick : MonoBehaviour, IPointerDownHandler, IDragHandler, IPointerUpHandler
    {
        [Header("Joystick")]
        [SerializeField] private RectTransform _background;
        [SerializeField] private RectTransform _handle;
        [SerializeField] private float _handleRange = 50f;

        private Vector2 _inputVector;
        private Canvas _canvas;

        private void Start()
        {
            _canvas = GetComponentInParent<Canvas>();
        }

        public void OnPointerDown(PointerEventData eventData)
        {
            OnDrag(eventData);
        }

        public void OnDrag(PointerEventData eventData)
        {
            if (_background == null || _handle == null) return;

            Vector2 localPoint;
            RectTransformUtility.ScreenPointToLocalPointInRectangle(
                _background, eventData.position, eventData.pressEventCamera, out localPoint);

            var bgSize = _background.sizeDelta;
            localPoint.x /= bgSize.x;
            localPoint.y /= bgSize.y;

            _inputVector = new Vector2(localPoint.x * 2f, localPoint.y * 2f);
            _inputVector = _inputVector.magnitude > 1f ? _inputVector.normalized : _inputVector;

            _handle.anchoredPosition = new Vector2(
                _inputVector.x * _handleRange,
                _inputVector.y * _handleRange
            );

            var player = ServiceLocator.Get<PlayerController>();
            player?.SetMoveInput(_inputVector);
        }

        public void OnPointerUp(PointerEventData eventData)
        {
            _inputVector = Vector2.zero;
            if (_handle != null)
                _handle.anchoredPosition = Vector2.zero;

            var player = ServiceLocator.Get<PlayerController>();
            player?.SetMoveInput(Vector2.zero);
        }
    }
}
