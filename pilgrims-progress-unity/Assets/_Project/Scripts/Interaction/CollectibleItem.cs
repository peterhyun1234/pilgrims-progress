using System.Collections;
using UnityEngine;
using PilgrimsProgress.Core;
using PilgrimsProgress.Narrative;
using PilgrimsProgress.UI;
using PilgrimsProgress.Visuals;

namespace PilgrimsProgress.Interaction
{
    public enum CollectibleType
    {
        FaithScroll,
        CourageShield,
        WisdomBook,
        BurdenStone,
        HealingFruit,
        PoisonThorn,
        PrayerCandle,
        TemptationGem
    }

    [RequireComponent(typeof(CircleCollider2D))]
    [RequireComponent(typeof(SpriteRenderer))]
    public class CollectibleItem : MonoBehaviour
    {
        [SerializeField] private CollectibleType _type;

        private SpriteRenderer _sr;
        private float _bobTimer;
        private Vector3 _startPos;
        private bool _collected;

        private void Awake()
        {
            _sr = GetComponent<SpriteRenderer>();
            var col = GetComponent<CircleCollider2D>();
            col.isTrigger = true;
            col.radius = 0.6f;
            _startPos = transform.position;
        }

        public void Initialize(CollectibleType type)
        {
            _type = type;
            _sr = GetComponent<SpriteRenderer>();
            _sr.sprite = CreateSprite(type);
            _sr.sortingOrder = 8;
        }

        private void Update()
        {
            if (_collected) return;

            _bobTimer += Time.deltaTime;
            float bob = Mathf.Sin(_bobTimer * 2.5f) * 0.12f;
            transform.position = _startPos + new Vector3(0, bob, 0);

            float glow = 0.85f + Mathf.Sin(_bobTimer * 3f) * 0.15f;
            Color baseCol = _sr.color;
            _sr.color = new Color(baseCol.r, baseCol.g, baseCol.b, glow);
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (_collected) return;
            if (other.GetComponent<Player.PlayerController>() == null) return;

            _collected = true;
            ApplyEffect();
            StartCoroutine(CollectAnimation());
        }

        private void ApplyEffect()
        {
            var stats = StatsManager.Instance;
            if (stats == null) return;

            var lm = ServiceLocator.TryGet<Localization.LocalizationManager>(out var l) ? l : null;
            bool isKo = lm != null && lm.CurrentLanguage == "ko";

            float buffMult = stats.GetBuffEffectiveness();
            float debuffResist = stats.GetDebuffResistance();

            string message = "";

            switch (_type)
            {
                case CollectibleType.FaithScroll:
                    int faithGain = Mathf.RoundToInt(8 * buffMult);
                    stats.ModifyStat("faith", faithGain);
                    message = isKo ? $"\u2728 믿음의 두루마리! 믿음 +{faithGain}" : $"\u2728 Scroll of Faith! Faith +{faithGain}";
                    break;
                case CollectibleType.CourageShield:
                    int courageGain = Mathf.RoundToInt(8 * buffMult);
                    stats.ModifyStat("courage", courageGain);
                    message = isKo ? $"\u26E8 용기의 방패! 용기 +{courageGain}" : $"\u26E8 Shield of Courage! Courage +{courageGain}";
                    break;
                case CollectibleType.WisdomBook:
                    int wisdomGain = Mathf.RoundToInt(8 * buffMult);
                    stats.ModifyStat("wisdom", wisdomGain);
                    message = isKo ? $"\u2606 지혜의 책! 지혜 +{wisdomGain}" : $"\u2606 Book of Wisdom! Wisdom +{wisdomGain}";
                    break;
                case CollectibleType.BurdenStone:
                    int burdenGain = Mathf.RoundToInt(10 * (1f - debuffResist * 0.5f));
                    stats.ModifyBurden(burdenGain);
                    message = isKo ? $"\u26A0 무거운 돌! 짐 +{burdenGain}" : $"\u26A0 Burden Stone! Burden +{burdenGain}";
                    break;
                case CollectibleType.HealingFruit:
                    int healGain = Mathf.RoundToInt(5 * buffMult);
                    stats.ModifyStat("faith", healGain);
                    stats.ModifyStat("courage", healGain);
                    stats.ModifyStat("wisdom", healGain);
                    message = isKo ? $"\u2740 치유의 열매! 전체 스탯 +{healGain}" : $"\u2740 Healing Fruit! All stats +{healGain}";
                    break;
                case CollectibleType.PoisonThorn:
                    int faithLoss = Mathf.RoundToInt(5 * (1f - debuffResist * 0.4f));
                    int courageLoss = Mathf.RoundToInt(3 * (1f - debuffResist * 0.4f));
                    faithLoss = Mathf.Max(1, faithLoss);
                    courageLoss = Mathf.Max(1, courageLoss);
                    stats.ModifyStat("faith", -faithLoss);
                    stats.ModifyStat("courage", -courageLoss);
                    message = isKo ? $"\u2620 독가시! 믿음 -{faithLoss}, 용기 -{courageLoss}" : $"\u2620 Poison Thorn! Faith -{faithLoss}, Courage -{courageLoss}";
                    break;
                case CollectibleType.PrayerCandle:
                    int prayerBurden = Mathf.RoundToInt(8 * buffMult);
                    int prayerFaith = Mathf.RoundToInt(3 * buffMult);
                    stats.ModifyBurden(-prayerBurden);
                    stats.ModifyStat("faith", prayerFaith);
                    message = isKo ? $"\u2748 기도의 촛불! 짐 -{prayerBurden}, 믿음 +{prayerFaith}" : $"\u2748 Prayer Candle! Burden -{prayerBurden}, Faith +{prayerFaith}";
                    break;
                case CollectibleType.TemptationGem:
                    int tempBurden = Mathf.RoundToInt(5 * (1f - debuffResist * 0.3f));
                    int wisdomLoss = Mathf.RoundToInt(5 * (1f - debuffResist * 0.4f));
                    tempBurden = Mathf.Max(1, tempBurden);
                    wisdomLoss = Mathf.Max(1, wisdomLoss);
                    stats.ModifyBurden(tempBurden);
                    stats.ModifyStat("wisdom", -wisdomLoss);
                    message = isKo ? $"\u25C6 유혹의 보석! 짐 +{tempBurden}, 지혜 -{wisdomLoss}" : $"\u25C6 Temptation Gem! Burden +{tempBurden}, Wisdom -{wisdomLoss}";
                    break;
            }

            if (!string.IsNullOrEmpty(message) && ToastUI.Instance != null)
                ToastUI.Instance.Show(message, 3f);

            bool isDebuff = IsDebuff();
            TriggerPlayerReaction(isDebuff);

            if (ScreenFlash.Instance != null)
            {
                if (isDebuff) ScreenFlash.Instance.FlashDebuff();
                else ScreenFlash.Instance.FlashBuff();
            }
        }

        private bool IsDebuff()
        {
            return _type == CollectibleType.BurdenStone ||
                   _type == CollectibleType.PoisonThorn ||
                   _type == CollectibleType.TemptationGem;
        }

        private void TriggerPlayerReaction(bool isDebuff)
        {
            var player = ServiceLocator.Get<Player.PlayerController>();
            if (player == null) return;

            var animFx = player.GetComponent<CharacterAnimationFX>();
            if (animFx != null)
                animFx.Play(isDebuff ? AnimAction.Hit : AnimAction.Celebrate);

            var cam = Player.TopDownCamera.Instance;
            if (cam != null)
            {
                if (isDebuff)
                    cam.Shake(0.12f, 0.25f);
                else
                    cam.ImpactZoom(0.3f, 0.2f);
            }
        }

        private IEnumerator CollectAnimation()
        {
            float t = 0;
            Vector3 startScale = transform.localScale;
            Vector3 startPos = transform.position;

            while (t < 0.4f)
            {
                t += Time.deltaTime;
                float p = t / 0.4f;
                transform.localScale = startScale * (1f - p * 0.5f);
                transform.position = startPos + Vector3.up * p * 0.8f;
                if (_sr != null)
                    _sr.color = new Color(_sr.color.r, _sr.color.g, _sr.color.b, 1f - p);
                yield return null;
            }

            SpawnCollectParticles();
            Destroy(gameObject);
        }

        private void SpawnCollectParticles()
        {
            bool isBuff = _type != CollectibleType.BurdenStone &&
                          _type != CollectibleType.PoisonThorn &&
                          _type != CollectibleType.TemptationGem;
            Color partColor = isBuff ? new Color(1f, 0.9f, 0.4f) : new Color(0.8f, 0.2f, 0.3f);

            for (int i = 0; i < 6; i++)
            {
                var pGo = new GameObject("Particle");
                pGo.transform.position = transform.position;
                var pSr = pGo.AddComponent<SpriteRenderer>();
                pSr.sortingOrder = 15;
                pSr.color = partColor;

                var tex = new Texture2D(4, 4);
                var pxs = new Color[16];
                for (int j = 0; j < 16; j++) pxs[j] = Color.white;
                tex.SetPixels(pxs);
                tex.Apply();
                tex.filterMode = FilterMode.Point;
                pSr.sprite = Sprite.Create(tex, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f), 16);

                var mover = pGo.AddComponent<ParticleMover>();
                mover.Initialize(Random.insideUnitCircle.normalized * Random.Range(1.5f, 3f), 0.6f);
            }
        }

        public static Sprite CreateSprite(CollectibleType type)
        {
            int s = 16;
            var tex = new Texture2D(s, s);
            var pixels = new Color[s * s];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = Color.clear;

            switch (type)
            {
                case CollectibleType.FaithScroll:
                    DrawScroll(pixels, s);
                    break;
                case CollectibleType.CourageShield:
                    DrawShield(pixels, s);
                    break;
                case CollectibleType.WisdomBook:
                    DrawBook(pixels, s);
                    break;
                case CollectibleType.BurdenStone:
                    DrawStone(pixels, s);
                    break;
                case CollectibleType.HealingFruit:
                    DrawFruit(pixels, s);
                    break;
                case CollectibleType.PoisonThorn:
                    DrawThorn(pixels, s);
                    break;
                case CollectibleType.PrayerCandle:
                    DrawCandle(pixels, s);
                    break;
                case CollectibleType.TemptationGem:
                    DrawGem(pixels, s);
                    break;
            }

            tex.SetPixels(pixels);
            tex.Apply();
            tex.filterMode = FilterMode.Point;
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.5f), s);
        }

        private static void SP(Color[] p, int s, int x, int y, Color c)
        {
            if (x >= 0 && x < s && y >= 0 && y < s) p[y * s + x] = c;
        }
        private static void SB(Color[] p, int s, int x, int y, int w, int h, Color c)
        {
            for (int dy = 0; dy < h; dy++)
                for (int dx = 0; dx < w; dx++)
                    SP(p, s, x + dx, y + dy, c);
        }

        private static void DrawScroll(Color[] p, int s)
        {
            Color parch = new Color(0.92f, 0.84f, 0.65f);
            Color parchDark = new Color(0.78f, 0.70f, 0.52f);
            Color ink = new Color(0.25f, 0.20f, 0.15f);
            Color gold = new Color(0.90f, 0.78f, 0.35f);
            SB(p, s, 4, 2, 8, 10, parch);
            SB(p, s, 3, 12, 10, 2, parchDark);
            SB(p, s, 3, 1, 10, 2, parchDark);
            SP(p, s, 3, 2, parchDark); SP(p, s, 11, 2, parchDark);
            SB(p, s, 5, 4, 6, 1, ink);
            SB(p, s, 5, 6, 5, 1, ink);
            SB(p, s, 5, 8, 6, 1, ink);
            SB(p, s, 5, 10, 4, 1, ink);
            SP(p, s, 4, 12, gold); SP(p, s, 11, 12, gold);
            SP(p, s, 4, 1, gold); SP(p, s, 11, 1, gold);
        }

        private static void DrawShield(Color[] p, int s)
        {
            Color body = new Color(0.30f, 0.55f, 0.85f);
            Color bodyDark = new Color(0.22f, 0.42f, 0.68f);
            Color rim = new Color(0.72f, 0.65f, 0.38f);
            Color emblem = new Color(0.90f, 0.82f, 0.45f);
            SB(p, s, 4, 2, 8, 10, body);
            SB(p, s, 5, 12, 6, 1, body);
            SB(p, s, 6, 13, 4, 1, body);
            SP(p, s, 7, 14, body); SP(p, s, 8, 14, body);
            // Rim
            for (int y = 2; y < 12; y++) { SP(p, s, 4, y, rim); SP(p, s, 11, y, rim); }
            SB(p, s, 4, 2, 8, 1, rim); SB(p, s, 5, 12, 6, 1, rim);
            // Shadow side
            for (int y = 3; y < 11; y++) SP(p, s, 5, y, bodyDark);
            // Emblem cross
            SB(p, s, 7, 4, 2, 6, emblem);
            SB(p, s, 6, 6, 4, 2, emblem);
        }

        private static void DrawBook(Color[] p, int s)
        {
            Color cover = new Color(0.28f, 0.55f, 0.28f);
            Color coverDark = new Color(0.20f, 0.40f, 0.20f);
            Color pages = new Color(0.92f, 0.90f, 0.82f);
            Color pagesDark = new Color(0.80f, 0.78f, 0.72f);
            Color gold = new Color(0.85f, 0.75f, 0.35f);
            SB(p, s, 3, 2, 10, 12, cover);
            SB(p, s, 4, 3, 8, 10, pages);
            SB(p, s, 3, 2, 1, 12, coverDark);
            SB(p, s, 4, 3, 1, 10, pagesDark);
            SB(p, s, 5, 5, 5, 1, new Color(0.30f, 0.25f, 0.18f));
            SB(p, s, 5, 7, 6, 1, new Color(0.30f, 0.25f, 0.18f));
            SB(p, s, 5, 9, 4, 1, new Color(0.30f, 0.25f, 0.18f));
            SP(p, s, 7, 11, gold); SP(p, s, 8, 11, gold);
        }

        private static void DrawStone(Color[] p, int s)
        {
            Color rock = new Color(0.42f, 0.38f, 0.35f);
            Color rockDark = new Color(0.30f, 0.28f, 0.25f);
            Color rockLight = new Color(0.52f, 0.48f, 0.44f);
            SB(p, s, 4, 3, 8, 8, rock);
            SB(p, s, 5, 11, 6, 1, rock);
            SB(p, s, 5, 2, 6, 1, rock);
            // Shadow
            SB(p, s, 4, 3, 2, 8, rockDark);
            SB(p, s, 4, 3, 8, 2, rockDark);
            // Highlight
            SB(p, s, 9, 8, 2, 2, rockLight);
            SP(p, s, 7, 10, rockLight); SP(p, s, 8, 10, rockLight);
            // Crack
            SP(p, s, 6, 5, rockDark); SP(p, s, 7, 6, rockDark);
            SP(p, s, 7, 7, rockDark); SP(p, s, 8, 8, rockDark);
        }

        private static void DrawFruit(Color[] p, int s)
        {
            Color body = new Color(0.85f, 0.25f, 0.22f);
            Color bodyLight = new Color(0.95f, 0.40f, 0.35f);
            Color bodyDark = new Color(0.65f, 0.18f, 0.15f);
            Color stem = new Color(0.35f, 0.28f, 0.15f);
            Color leaf = new Color(0.30f, 0.55f, 0.25f);
            float cx = 7.5f, cy = 6.5f, r = 4.5f;
            for (int y = 0; y < s; y++)
                for (int x = 0; x < s; x++)
                {
                    float dx = x - cx, dy = y - cy;
                    float d = Mathf.Sqrt(dx * dx + dy * dy);
                    if (d < r - 1) {
                        Color c = body;
                        if (dx > 1 && dy > 1) c = bodyLight;
                        if (dx < -1 && dy < -1) c = bodyDark;
                        SP(p, s, x, y, c);
                    } else if (d < r) {
                        SP(p, s, x, y, bodyDark);
                    }
                }
            SP(p, s, 7, 11, stem); SP(p, s, 7, 12, stem);
            SP(p, s, 8, 12, leaf); SP(p, s, 9, 12, leaf);
            SP(p, s, 9, 11, leaf);
        }

        private static void DrawThorn(Color[] p, int s)
        {
            Color stem = new Color(0.30f, 0.15f, 0.40f);
            Color thorn = new Color(0.50f, 0.20f, 0.55f);
            Color thornTip = new Color(0.70f, 0.30f, 0.75f);
            SB(p, s, 7, 1, 2, 13, stem);
            // Thorns
            SP(p, s, 5, 10, thorn); SP(p, s, 4, 11, thornTip);
            SP(p, s, 10, 8, thorn); SP(p, s, 11, 9, thornTip);
            SP(p, s, 5, 6, thorn); SP(p, s, 4, 7, thornTip);
            SP(p, s, 10, 4, thorn); SP(p, s, 11, 5, thornTip);
            SP(p, s, 6, 3, thorn); SP(p, s, 5, 2, thornTip);
            // Top bud
            SP(p, s, 7, 14, thornTip); SP(p, s, 8, 14, thornTip);
        }

        private static void DrawCandle(Color[] p, int s)
        {
            Color wax = new Color(0.92f, 0.88f, 0.75f);
            Color waxDark = new Color(0.80f, 0.76f, 0.62f);
            Color flame = new Color(1f, 0.85f, 0.30f);
            Color flameTip = new Color(1f, 0.95f, 0.60f);
            Color flameBase = new Color(0.95f, 0.55f, 0.15f);
            Color wick = new Color(0.25f, 0.20f, 0.15f);
            SB(p, s, 6, 2, 4, 8, wax);
            SB(p, s, 6, 2, 1, 8, waxDark);
            SP(p, s, 7, 10, wick); SP(p, s, 8, 10, wick);
            SB(p, s, 7, 11, 2, 2, flame);
            SP(p, s, 7, 13, flameTip); SP(p, s, 8, 13, flameTip);
            SP(p, s, 6, 11, flameBase); SP(p, s, 9, 11, flameBase);
            // Glow
            SP(p, s, 6, 12, new Color(1f, 0.90f, 0.50f, 0.4f));
            SP(p, s, 9, 12, new Color(1f, 0.90f, 0.50f, 0.4f));
            // Base/holder
            SB(p, s, 5, 1, 6, 1, new Color(0.55f, 0.48f, 0.32f));
            SB(p, s, 5, 2, 6, 1, new Color(0.60f, 0.52f, 0.35f));
        }

        private static void DrawGem(Color[] p, int s)
        {
            Color gem = new Color(0.75f, 0.20f, 0.55f);
            Color gemLight = new Color(0.90f, 0.40f, 0.70f);
            Color gemDark = new Color(0.55f, 0.12f, 0.40f);
            Color sparkle = new Color(1f, 0.95f, 0.90f);
            // Diamond shape
            int[][] shape = {
                new[]{7, 8}, // y=4
                new[]{6, 7, 8, 9}, // y=5
                new[]{5, 6, 7, 8, 9, 10}, // y=6
                new[]{4, 5, 6, 7, 8, 9, 10, 11}, // y=7
                new[]{4, 5, 6, 7, 8, 9, 10, 11}, // y=8
                new[]{5, 6, 7, 8, 9, 10}, // y=9
                new[]{6, 7, 8, 9}, // y=10
                new[]{7, 8}, // y=11
            };
            for (int row = 0; row < shape.Length; row++)
            {
                int y = 4 + row;
                foreach (int x in shape[row])
                {
                    Color c = gem;
                    if (x < 7 && y < 8) c = gemDark;
                    if (x > 8 && y > 7) c = gemLight;
                    SP(p, s, x, y, c);
                }
            }
            SP(p, s, 8, 9, sparkle);
            SP(p, s, 9, 8, new Color(1f, 0.90f, 0.85f, 0.7f));
            // Outline
            SP(p, s, 7, 3, gemDark); SP(p, s, 8, 3, gemDark);
            SP(p, s, 7, 12, gemDark); SP(p, s, 8, 12, gemDark);
            SP(p, s, 3, 7, gemDark); SP(p, s, 3, 8, gemDark);
            SP(p, s, 12, 7, gemDark); SP(p, s, 12, 8, gemDark);
        }
    }
}
