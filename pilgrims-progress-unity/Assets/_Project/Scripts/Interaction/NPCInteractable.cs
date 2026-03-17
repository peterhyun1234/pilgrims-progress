using UnityEngine;
using PilgrimsProgress.Core;
using PilgrimsProgress.Player;
using PilgrimsProgress.Narrative;
using PilgrimsProgress.UI;

namespace PilgrimsProgress.Interaction
{
    public class NPCInteractable : Interactable
    {
        [Header("NPC")]
        [SerializeField] private string _npcId;
        [SerializeField] private string _inkKnotName;
        [SerializeField] private string _displayNameKey;

        [Header("Visuals")]
        [SerializeField] private SpriteRenderer _spriteRenderer;
        private GameObject _markerGo;
        private SpriteRenderer _markerSr;

        public string NpcId => _npcId;
        public string InkKnotName => _inkKnotName;

        private void Start()
        {
            CreateOrderMarker();
        }

        private void Update()
        {
            UpdateMarkerVisibility();
        }

        private void CreateOrderMarker()
        {
            _markerGo = new GameObject("OrderMarker");
            _markerGo.transform.SetParent(transform);
            _markerGo.transform.localPosition = new Vector3(0, 1.2f, 0);

            var tex = new Texture2D(8, 8);
            var pixels = new Color[64];
            for (int x = 0; x < 8; x++)
                for (int y = 0; y < 8; y++)
                {
                    bool diamond = Mathf.Abs(x - 3.5f) + Mathf.Abs(y - 3.5f) < 4f;
                    pixels[y * 8 + x] = diamond ? Color.white : Color.clear;
                }
            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;

            _markerSr = _markerGo.AddComponent<SpriteRenderer>();
            _markerSr.sprite = Sprite.Create(tex, new Rect(0, 0, 8, 8), new Vector2(0.5f, 0.5f), 16);
            _markerSr.sortingOrder = 20;
            _markerSr.color = new Color(1f, 0.85f, 0.3f, 0.9f);
        }

        private void UpdateMarkerVisibility()
        {
            if (_markerGo == null) return;

            var orderMgr = NPCOrderManager.Instance;
            if (orderMgr == null)
            {
                _markerGo.SetActive(false);
                return;
            }

            bool isTarget = orderMgr.IsCurrentTarget(_npcId);
            bool isCompleted = orderMgr.IsCompleted(_npcId);
            _markerGo.SetActive(isTarget && !isCompleted);

            if (isTarget)
            {
                float bounce = Mathf.Sin(Time.time * 3f) * 0.15f;
                _markerGo.transform.localPosition = new Vector3(0, 1.2f + bounce, 0);
            }

            if (_spriteRenderer != null)
            {
                bool canInteract = orderMgr.CanInteract(_npcId);
                _spriteRenderer.color = canInteract
                    ? Color.white
                    : new Color(0.4f, 0.4f, 0.4f, 0.6f);
            }
        }

        protected override void OnInteract(PlayerController player)
        {
            var orderMgr = NPCOrderManager.Instance;
            if (orderMgr != null && !orderMgr.CanInteract(_npcId))
            {
                ShowNotYetHint();
                return;
            }

            var inkService = ServiceLocator.Get<InkService>();
            if (inkService == null) return;

            var modeManager = ServiceLocator.Get<GameModeManager>();
            if (modeManager == null) return;

            if (!string.IsNullOrEmpty(_inkKnotName))
            {
                inkService.JumpToKnot(_inkKnotName);
            }

            // Face player and enter dialogue
            if (_spriteRenderer != null)
                _spriteRenderer.flipX = player.transform.position.x < transform.position.x;

            var npcBehavior = GetComponent<Visuals.NPCBehavior>();
            if (npcBehavior != null)
                npcBehavior.SetInDialogue(true);

            modeManager.EnterDialogueMode(transform);
            inkService.Continue();

            if (orderMgr != null && !orderMgr.IsCompleted(_npcId))
            {
                _pendingOrderMgr = orderMgr;
                inkService.OnStoryEnd += OnDialogueFinished;
                modeManager.OnModeChanged += OnModeChangedDuringDialogue;
            }
        }

        private NPCOrderManager _pendingOrderMgr;

        private void OnDialogueFinished()
        {
            if (_pendingOrderMgr != null)
            {
                _pendingOrderMgr.MarkCompleted(_npcId);
                _pendingOrderMgr = null;
            }

            var npcBehavior = GetComponent<Visuals.NPCBehavior>();
            if (npcBehavior != null)
                npcBehavior.SetInDialogue(false);

            CleanupDialogueListeners();
        }

        private void OnModeChangedDuringDialogue(GameMode prev, GameMode curr)
        {
            if (prev == GameMode.Dialogue && curr != GameMode.Dialogue)
            {
                if (_pendingOrderMgr != null)
                {
                    _pendingOrderMgr.MarkCompleted(_npcId);
                    _pendingOrderMgr = null;
                }
                CleanupDialogueListeners();
            }
        }

        private void CleanupDialogueListeners()
        {
            var inkService = ServiceLocator.Get<InkService>();
            if (inkService != null)
                inkService.OnStoryEnd -= OnDialogueFinished;

            var modeManager = ServiceLocator.Get<GameModeManager>();
            if (modeManager != null)
                modeManager.OnModeChanged -= OnModeChangedDuringDialogue;
        }

        private void ShowNotYetHint()
        {
            var lm = ServiceLocator.TryGet<Localization.LocalizationManager>(out var l) ? l : null;
            string msg = lm != null && lm.CurrentLanguage == "ko"
                ? "아직 갈 수 없습니다. 먼저 표시된 NPC와 대화하세요."
                : "Not yet. Talk to the marked NPC first.";
            if (ToastUI.Instance != null)
                ToastUI.Instance.Show(msg);
            else
                Debug.Log($"[NPCInteractable] {msg}");
        }

        public void FacePlayer(Vector2 playerPos)
        {
            if (_spriteRenderer == null) return;
            _spriteRenderer.flipX = playerPos.x < transform.position.x;
        }
    }
}
