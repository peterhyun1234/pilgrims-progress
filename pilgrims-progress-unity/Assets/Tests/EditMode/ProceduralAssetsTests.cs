using NUnit.Framework;
using UnityEngine;
using PilgrimsProgress.Visuals;

namespace PilgrimsProgress.Tests
{
    [TestFixture]
    public class ProceduralAssetsTests
    {
        #region Menu Background

        [Test]
        public void MenuBackground_Returns_NonNull_Texture()
        {
            var tex = ProceduralAssets.CreateMenuBackground(64, 36);
            Assert.IsNotNull(tex);
        }

        [Test]
        public void MenuBackground_Has_Correct_Dimensions()
        {
            var tex = ProceduralAssets.CreateMenuBackground(128, 72);
            Assert.AreEqual(128, tex.width);
            Assert.AreEqual(72, tex.height);
        }

        [Test]
        public void MenuBackground_Pixels_Are_Opaque()
        {
            var tex = ProceduralAssets.CreateMenuBackground(32, 18);
            var pixels = tex.GetPixels();
            foreach (var p in pixels)
                Assert.AreEqual(1f, p.a, 0.01f, "All background pixels should be fully opaque");
        }

        [Test]
        public void MenuBackground_Default_Size_Is_480x270()
        {
            var tex = ProceduralAssets.CreateMenuBackground();
            Assert.AreEqual(480, tex.width);
            Assert.AreEqual(270, tex.height);
        }

        #endregion

        #region Tile Textures

        [Test]
        public void GrassTile_Returns_NonNull()
        {
            var tile = ProceduralAssets.CreateGrassTile();
            Assert.IsNotNull(tile);
            Assert.IsNotNull(tile.sprite);
        }

        [Test]
        public void GrassTile_Variants_Have_Different_Textures()
        {
            var t0 = ProceduralAssets.CreateGrassTile(0);
            var t1 = ProceduralAssets.CreateGrassTile(1);
            var p0 = t0.sprite.texture.GetPixel(8, 8);
            var p1 = t1.sprite.texture.GetPixel(8, 8);
            Assert.AreNotEqual(p0, p1, "Different grass variants should have visual variation");
        }

        [Test]
        public void PathTile_Returns_NonNull()
        {
            var tile = ProceduralAssets.CreatePathTile();
            Assert.IsNotNull(tile);
            Assert.IsNotNull(tile.sprite);
        }

        [Test]
        public void WallTile_Returns_NonNull()
        {
            var tile = ProceduralAssets.CreateWallTile();
            Assert.IsNotNull(tile);
            Assert.IsNotNull(tile.sprite);
        }

        [Test]
        public void WaterTile_Returns_NonNull()
        {
            var tile = ProceduralAssets.CreateWaterTile();
            Assert.IsNotNull(tile);
            Assert.IsNotNull(tile.sprite);
        }

        [Test]
        public void WaterTile_Different_Frames_Are_Different()
        {
            var t0 = ProceduralAssets.CreateWaterTile(0);
            var t1 = ProceduralAssets.CreateWaterTile(1);
            var p0 = t0.sprite.texture.GetPixel(4, 4);
            var p1 = t1.sprite.texture.GetPixel(4, 4);
            Assert.AreNotEqual(p0, p1, "Different water frames should vary");
        }

        [Test]
        public void FlowerTile_Returns_NonNull()
        {
            var tile = ProceduralAssets.CreateFlowerTile(Color.red);
            Assert.IsNotNull(tile);
        }

        [Test]
        public void BridgeTile_Returns_NonNull()
        {
            var tile = ProceduralAssets.CreateBridgeTile();
            Assert.IsNotNull(tile);
        }

        [Test]
        public void All_Tiles_Are_16x16()
        {
            var tiles = new[]
            {
                ProceduralAssets.CreateGrassTile(),
                ProceduralAssets.CreatePathTile(),
                ProceduralAssets.CreateWallTile(),
                ProceduralAssets.CreateWaterTile(),
                ProceduralAssets.CreateBridgeTile()
            };

            foreach (var t in tiles)
            {
                Assert.AreEqual(16, t.sprite.texture.width);
                Assert.AreEqual(16, t.sprite.texture.height);
            }
        }

        #endregion

        #region NPC Sprites

        [Test]
        public void NPC_Default_Returns_NonNull()
        {
            var sprite = ProceduralAssets.CreateNPCSprite("unknown");
            Assert.IsNotNull(sprite);
        }

        [Test]
        public void NPC_Null_Id_Returns_NonNull()
        {
            var sprite = ProceduralAssets.CreateNPCSprite(null);
            Assert.IsNotNull(sprite);
        }

        [TestCase("evangelist")]
        [TestCase("obstinate")]
        [TestCase("pliable")]
        [TestCase("help")]
        [TestCase("worldlywiseman")]
        [TestCase("goodwill")]
        [TestCase("interpreter")]
        [TestCase("faithful")]
        [TestCase("hopeful")]
        [TestCase("apollyon")]
        public void NPC_Known_Characters_Return_Valid_Sprites(string npcId)
        {
            var sprite = ProceduralAssets.CreateNPCSprite(npcId);
            Assert.IsNotNull(sprite, $"NPC '{npcId}' should produce a valid sprite");
            Assert.AreEqual(16, sprite.texture.width);
            Assert.AreEqual(16, sprite.texture.height);
        }

        [Test]
        public void NPC_Different_Characters_Have_Different_Pixels()
        {
            var evangelist = ProceduralAssets.CreateNPCSprite("evangelist");
            var obstinate = ProceduralAssets.CreateNPCSprite("obstinate");

            var p1 = evangelist.texture.GetPixels();
            var p2 = obstinate.texture.GetPixels();

            bool hasDifference = false;
            for (int i = 0; i < p1.Length; i++)
            {
                if (p1[i] != p2[i]) { hasDifference = true; break; }
            }

            Assert.IsTrue(hasDifference, "Different NPCs should have visually distinct sprites");
        }

        #endregion

        #region UI Textures

        [Test]
        public void PanelTexture_Returns_NonNull()
        {
            var tex = ProceduralAssets.CreatePanelTexture();
            Assert.IsNotNull(tex);
            Assert.AreEqual(32, tex.width);
            Assert.AreEqual(32, tex.height);
        }

        [Test]
        public void PanelTexture_Custom_Size()
        {
            var tex = ProceduralAssets.CreatePanelTexture(64, 48);
            Assert.AreEqual(64, tex.width);
            Assert.AreEqual(48, tex.height);
        }

        [Test]
        public void PanelTexture_Has_Border_And_Fill()
        {
            var fill = new Color(0.1f, 0.1f, 0.1f, 1f);
            var border = new Color(0.9f, 0.9f, 0.9f, 1f);
            var tex = ProceduralAssets.CreatePanelTexture(16, 16, fill, border, 2);

            var centerPixel = tex.GetPixel(8, 8);
            var edgePixel = tex.GetPixel(0, 8);

            Assert.AreEqual(fill.r, centerPixel.r, 0.01f, "Center should be fill color");
        }

        [Test]
        public void PanelSprite_Returns_NonNull()
        {
            var sprite = ProceduralAssets.CreatePanelSprite();
            Assert.IsNotNull(sprite);
        }

        [Test]
        public void ButtonSprite_Returns_NonNull()
        {
            var sprite = ProceduralAssets.CreateButtonSprite(Color.blue, Color.white);
            Assert.IsNotNull(sprite);
        }

        #endregion

        #region Item Icons

        [Test]
        public void ScrollIcon_Returns_NonNull()
        {
            var sprite = ProceduralAssets.CreateScrollIcon();
            Assert.IsNotNull(sprite);
            Assert.AreEqual(16, sprite.texture.width);
        }

        [Test]
        public void CrossIcon_Returns_NonNull()
        {
            var sprite = ProceduralAssets.CreateCrossIcon();
            Assert.IsNotNull(sprite);
        }

        [Test]
        public void KeyIcon_Returns_NonNull()
        {
            var sprite = ProceduralAssets.CreateKeyIcon();
            Assert.IsNotNull(sprite);
        }

        #endregion

        #region Environment

        [Test]
        public void TreeSprite_Returns_NonNull()
        {
            var sprite = ProceduralAssets.CreateTreeSprite();
            Assert.IsNotNull(sprite);
        }

        [Test]
        public void SignpostSprite_Returns_NonNull()
        {
            var sprite = ProceduralAssets.CreateSignpostSprite();
            Assert.IsNotNull(sprite);
        }

        [Test]
        public void TreeSprite_Has_Transparent_Background()
        {
            var sprite = ProceduralAssets.CreateTreeSprite();
            var corner = sprite.texture.GetPixel(0, 0);
            Assert.AreEqual(0f, corner.a, 0.01f, "Corners should be transparent");
        }

        #endregion
    }
}
