using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using PilgrimsProgress.Player;

namespace PilgrimsProgress.UI
{
    public class VirtualJoystick : MonoBehaviour, IPointerDownHandler, IDragHandler, IPointerUpHandler
    {
        [Header("Joystick")]
        [SerializeField] private RectTransform _background;
        [SerializeField] private RectTransform _handle;
        [SerializeField] private float _handleRange = 50f;

        private Vector2 _inputVector;

        public void OnPointerDown(PointerEventData eventData)
        {
            OnDrag(eventData);
        }

        public void OnDrag(PointerEventData eventData)
        {
            if (_background == null || _handle == null) return;

            RectTransformUtility.ScreenPointToLocalPointInRectangle(
                _background, eventData.position, eventData.pressEventCamera, out Vector2 localPoint);

            var bgSize = _background.sizeDelta;
            localPoint.x /= bgSize.x;
            localPoint.y /= bgSize.y;

            _inputVector = new Vector2(localPoint.x * 2f, localPoint.y * 2f);
            if (_inputVector.magnitude > 1f) _inputVector.Normalize();

            _handle.anchoredPosition = new Vector2(
                _inputVector.x * _handleRange,
                _inputVector.y * _handleRange
            );

            var handler = PlayerInputHandler.Instance;
            if (handler != null)
                handler.SetMobileMove(_inputVector);
        }

        public void OnPointerUp(PointerEventData eventData)
        {
            _inputVector = Vector2.zero;
            if (_handle != null)
                _handle.anchoredPosition = Vector2.zero;

            var handler = PlayerInputHandler.Instance;
            if (handler != null)
                handler.ClearMobileMove();
        }
    }
}
