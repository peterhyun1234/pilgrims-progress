using UnityEngine;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.Player
{
    public class ModularSpriteRenderer : MonoBehaviour
    {
        private bool _showBurden = true;

        public void SetShowBurden(bool show)
        {
            if (_showBurden == show) return;
            _showBurden = show;
            RebuildSheet();
        }

        public void RebuildSheet()
        {
            var animator = GetComponent<PlayerAnimator>();
            if (animator != null)
                animator.RefreshCustomization();
        }
    }
}
