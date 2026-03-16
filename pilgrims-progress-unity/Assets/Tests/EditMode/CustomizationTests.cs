using NUnit.Framework;
using UnityEngine;
using PilgrimsProgress.Player;

namespace PilgrimsProgress.Tests
{
    [TestFixture]
    public class CustomizationTests
    {
        [Test]
        public void Default_Values_Are_Valid()
        {
            var data = new PlayerCustomization();

            Assert.AreEqual("Christian", data.PlayerName);
            Assert.AreEqual(0, data.SkinToneIndex);
            Assert.AreEqual(0, data.HairStyleIndex);
            Assert.AreEqual(0, data.HairColorIndex);
            Assert.AreEqual(0, data.OutfitColorIndex);
            Assert.IsTrue(data.IsNameValid());
        }

        [Test]
        public void Copy_Constructor_Copies_All_Fields()
        {
            var original = new PlayerCustomization
            {
                PlayerName = "Pilgrim",
                SkinToneIndex = 3,
                HairStyleIndex = 2,
                HairColorIndex = 4,
                OutfitColorIndex = 1
            };

            var copy = new PlayerCustomization(original);

            Assert.AreEqual("Pilgrim", copy.PlayerName);
            Assert.AreEqual(3, copy.SkinToneIndex);
            Assert.AreEqual(2, copy.HairStyleIndex);
            Assert.AreEqual(4, copy.HairColorIndex);
            Assert.AreEqual(1, copy.OutfitColorIndex);
        }

        [Test]
        public void IsNameValid_Empty_Returns_False()
        {
            var data = new PlayerCustomization { PlayerName = "" };
            Assert.IsFalse(data.IsNameValid());
        }

        [Test]
        public void IsNameValid_Whitespace_Returns_False()
        {
            var data = new PlayerCustomization { PlayerName = "   " };
            Assert.IsFalse(data.IsNameValid());
        }

        [Test]
        public void IsNameValid_Null_Returns_False()
        {
            var data = new PlayerCustomization { PlayerName = null };
            Assert.IsFalse(data.IsNameValid());
        }

        [Test]
        public void IsNameValid_TooLong_Returns_False()
        {
            var data = new PlayerCustomization { PlayerName = "ThisNameIsTooLongForLimit" };
            Assert.IsFalse(data.IsNameValid());
        }

        [Test]
        public void IsNameValid_MaxLength_Returns_True()
        {
            var data = new PlayerCustomization { PlayerName = "TwelveChars!" };
            Assert.AreEqual(PlayerCustomization.MaxNameLength, data.PlayerName.Length);
            Assert.IsTrue(data.IsNameValid());
        }

        [Test]
        public void IsNameValid_SingleChar_Returns_True()
        {
            var data = new PlayerCustomization { PlayerName = "A" };
            Assert.IsTrue(data.IsNameValid());
        }

        [Test]
        public void IsNameValid_Korean_Returns_True()
        {
            var data = new PlayerCustomization { PlayerName = "순례자" };
            Assert.IsTrue(data.IsNameValid());
        }

        [Test]
        public void GetTrimmedName_Trims_Whitespace()
        {
            var data = new PlayerCustomization { PlayerName = "  Pilgrim  " };
            Assert.AreEqual("Pilgrim", data.GetTrimmedName());
        }

        [Test]
        public void GetTrimmedName_Empty_Returns_Default()
        {
            var data = new PlayerCustomization { PlayerName = "" };
            Assert.AreEqual("Christian", data.GetTrimmedName());
        }

        [Test]
        public void GetTrimmedName_Null_Returns_Default()
        {
            var data = new PlayerCustomization { PlayerName = null };
            Assert.AreEqual("Christian", data.GetTrimmedName());
        }

        [Test]
        public void GetTrimmedName_Truncates_Over_Max()
        {
            var data = new PlayerCustomization { PlayerName = "VeryLongNameThatExceedsLimit" };
            string trimmed = data.GetTrimmedName();
            Assert.AreEqual(PlayerCustomization.MaxNameLength, trimmed.Length);
        }

        [Test]
        public void ClampIndices_Clamps_Negative()
        {
            var data = new PlayerCustomization
            {
                SkinToneIndex = -1,
                HairStyleIndex = -5,
                HairColorIndex = -1,
                OutfitColorIndex = -1
            };

            data.ClampIndices(5, 6, 6, 4);

            Assert.AreEqual(0, data.SkinToneIndex);
            Assert.AreEqual(0, data.HairStyleIndex);
            Assert.AreEqual(0, data.HairColorIndex);
            Assert.AreEqual(0, data.OutfitColorIndex);
        }

        [Test]
        public void ClampIndices_Clamps_Overflow()
        {
            var data = new PlayerCustomization
            {
                SkinToneIndex = 10,
                HairStyleIndex = 20,
                HairColorIndex = 10,
                OutfitColorIndex = 10
            };

            data.ClampIndices(5, 6, 6, 4);

            Assert.AreEqual(4, data.SkinToneIndex);
            Assert.AreEqual(5, data.HairStyleIndex);
            Assert.AreEqual(5, data.HairColorIndex);
            Assert.AreEqual(3, data.OutfitColorIndex);
        }

        [Test]
        public void ClampIndices_Valid_Values_Unchanged()
        {
            var data = new PlayerCustomization
            {
                SkinToneIndex = 2,
                HairStyleIndex = 3,
                HairColorIndex = 1,
                OutfitColorIndex = 2
            };

            data.ClampIndices(5, 6, 6, 4);

            Assert.AreEqual(2, data.SkinToneIndex);
            Assert.AreEqual(3, data.HairStyleIndex);
            Assert.AreEqual(1, data.HairColorIndex);
            Assert.AreEqual(2, data.OutfitColorIndex);
        }

        [Test]
        public void Serialization_Roundtrip_Preserves_Data()
        {
            var original = new PlayerCustomization
            {
                PlayerName = "TestPilgrim",
                SkinToneIndex = 2,
                HairStyleIndex = 4,
                HairColorIndex = 3,
                OutfitColorIndex = 1
            };

            string json = JsonUtility.ToJson(original);
            var deserialized = JsonUtility.FromJson<PlayerCustomization>(json);

            Assert.AreEqual(original.PlayerName, deserialized.PlayerName);
            Assert.AreEqual(original.SkinToneIndex, deserialized.SkinToneIndex);
            Assert.AreEqual(original.HairStyleIndex, deserialized.HairStyleIndex);
            Assert.AreEqual(original.HairColorIndex, deserialized.HairColorIndex);
            Assert.AreEqual(original.OutfitColorIndex, deserialized.OutfitColorIndex);
        }

        [Test]
        public void CustomizationPresets_Default_Has_Expected_Counts()
        {
            var presets = CustomizationPresets.CreateDefault();

            Assert.AreEqual(5, presets.SkinTones.Length);
            Assert.AreEqual(6, presets.HairStyles.Length);
            Assert.AreEqual(6, presets.HairColors.Length);
            Assert.AreEqual(4, presets.OutfitColors.Length);

            Object.DestroyImmediate(presets);
        }

        [Test]
        public void CustomizationPresets_SkinTones_Are_Not_Transparent()
        {
            var presets = CustomizationPresets.CreateDefault();

            foreach (var color in presets.SkinTones)
            {
                Assert.Greater(color.a, 0.9f, "Skin tone should be opaque");
            }

            Object.DestroyImmediate(presets);
        }

        [Test]
        public void CharacterSpriteBuilder_Returns_NonNull_Sprite()
        {
            var data = new PlayerCustomization();
            var presets = CustomizationPresets.CreateDefault();

            var sprite = CharacterSpriteBuilder.Build(data, presets);

            Assert.IsNotNull(sprite);
            Assert.AreEqual(16, sprite.texture.width);
            Assert.AreEqual(16, sprite.texture.height);

            Object.DestroyImmediate(presets);
        }

        [Test]
        public void CharacterSpriteBuilder_AllCombinations_Return_Valid()
        {
            var presets = CustomizationPresets.CreateDefault();

            for (int skin = 0; skin < presets.SkinTones.Length; skin++)
            {
                for (int outfit = 0; outfit < presets.OutfitColors.Length; outfit++)
                {
                    var data = new PlayerCustomization
                    {
                        SkinToneIndex = skin,
                        OutfitColorIndex = outfit
                    };

                    var sprite = CharacterSpriteBuilder.Build(data, presets);
                    Assert.IsNotNull(sprite,
                        $"Sprite null for skin={skin}, outfit={outfit}");
                }
            }

            Object.DestroyImmediate(presets);
        }

        [Test]
        public void CharacterSpriteBuilder_NullPresets_Returns_Null()
        {
            var data = new PlayerCustomization();
            var sprite = CharacterSpriteBuilder.Build(data, null);
            Assert.IsNull(sprite);
        }

        [Test]
        public void CharacterSpriteBuilder_WithoutBurden_Returns_Different_Sprite()
        {
            var data = new PlayerCustomization();
            var presets = CustomizationPresets.CreateDefault();

            var withBurden = CharacterSpriteBuilder.Build(data, presets, showBurden: true);
            var withoutBurden = CharacterSpriteBuilder.Build(data, presets, showBurden: false);

            Assert.IsNotNull(withBurden);
            Assert.IsNotNull(withoutBurden);
            Assert.AreNotSame(withBurden, withoutBurden);

            Object.DestroyImmediate(presets);
        }

        [Test]
        public void MaxNameLength_Is_12()
        {
            Assert.AreEqual(12, PlayerCustomization.MaxNameLength);
        }

        [Test]
        public void MinNameLength_Is_1()
        {
            Assert.AreEqual(1, PlayerCustomization.MinNameLength);
        }
    }
}
