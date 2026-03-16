using System.Collections.Generic;
using NUnit.Framework;
using PilgrimsProgress.Narrative;

namespace PilgrimsProgress.Tests
{
    [TestFixture]
    public class InkTagParserTests
    {
        [Test]
        public void ParseSingleTag_Speaker_Tag()
        {
            var tag = InkTagParser.ParseSingleTag("SPEAKER: Christian");

            Assert.AreEqual("SPEAKER", tag.Type);
            Assert.AreEqual("Christian", tag.Value);
            Assert.IsNull(tag.Modifier);
        }

        [Test]
        public void ParseSingleTag_Emotion_Tag()
        {
            var tag = InkTagParser.ParseSingleTag("EMOTION: worried");

            Assert.AreEqual("EMOTION", tag.Type);
            Assert.AreEqual("worried", tag.Value);
        }

        [Test]
        public void ParseSingleTag_Location_Tag()
        {
            var tag = InkTagParser.ParseSingleTag("LOCATION: city_of_destruction");

            Assert.AreEqual("LOCATION", tag.Type);
            Assert.AreEqual("city_of_destruction", tag.Value);
        }

        [Test]
        public void ParseSingleTag_BGM_Tag()
        {
            var tag = InkTagParser.ParseSingleTag("BGM: despair_theme");

            Assert.AreEqual("BGM", tag.Type);
            Assert.AreEqual("despair_theme", tag.Value);
        }

        [Test]
        public void ParseSingleTag_Stat_Tag_With_Modifier()
        {
            var tag = InkTagParser.ParseSingleTag("STAT: faith +5");

            Assert.AreEqual("STAT", tag.Type);
            Assert.AreEqual("faith", tag.Value);
            Assert.AreEqual("+5", tag.Modifier);
        }

        [Test]
        public void ParseSingleTag_Stat_Negative_Modifier()
        {
            var tag = InkTagParser.ParseSingleTag("STAT: courage -3");

            Assert.AreEqual("STAT", tag.Type);
            Assert.AreEqual("courage", tag.Value);
            Assert.AreEqual("-3", tag.Modifier);
        }

        [Test]
        public void ParseSingleTag_Burden_Tag_With_Modifier()
        {
            var tag = InkTagParser.ParseSingleTag("BURDEN: burden -20");

            Assert.AreEqual("BURDEN", tag.Type);
            Assert.AreEqual("burden", tag.Value);
            Assert.AreEqual("-20", tag.Modifier);
        }

        [Test]
        public void ParseSingleTag_Wait_Tag()
        {
            var tag = InkTagParser.ParseSingleTag("WAIT: 1.5");

            Assert.AreEqual("WAIT", tag.Type);
            Assert.AreEqual("1.5", tag.Value);
        }

        [Test]
        public void ParseSingleTag_Transition_Tag()
        {
            var tag = InkTagParser.ParseSingleTag("TRANSITION: fade_black");

            Assert.AreEqual("TRANSITION", tag.Type);
            Assert.AreEqual("fade_black", tag.Value);
        }

        [Test]
        public void ParseSingleTag_Bible_Card_Tag()
        {
            var tag = InkTagParser.ParseSingleTag("BIBLE_CARD: john_3_16");

            Assert.AreEqual("BIBLE_CARD", tag.Type);
            Assert.AreEqual("john_3_16", tag.Value);
        }

        [Test]
        public void ParseSingleTag_Shake_Tag()
        {
            var tag = InkTagParser.ParseSingleTag("SHAKE: medium");

            Assert.AreEqual("SHAKE", tag.Type);
            Assert.AreEqual("medium", tag.Value);
        }

        [Test]
        public void ParseSingleTag_CG_Tag()
        {
            var tag = InkTagParser.ParseSingleTag("CG: cross_scene");

            Assert.AreEqual("CG", tag.Type);
            Assert.AreEqual("cross_scene", tag.Value);
        }

        [Test]
        public void ParseSingleTag_SFX_Tag()
        {
            var tag = InkTagParser.ParseSingleTag("SFX: door_knock");

            Assert.AreEqual("SFX", tag.Type);
            Assert.AreEqual("door_knock", tag.Value);
        }

        [Test]
        public void ParseSingleTag_No_Colon_Sets_Type_Only()
        {
            var tag = InkTagParser.ParseSingleTag("SOME_FLAG");

            Assert.AreEqual("SOME_FLAG", tag.Type);
            Assert.IsNull(tag.Value);
        }

        [Test]
        public void ParseSingleTag_Case_Insensitive_Type()
        {
            var tag = InkTagParser.ParseSingleTag("speaker: Christian");

            Assert.AreEqual("SPEAKER", tag.Type);
            Assert.AreEqual("Christian", tag.Value);
        }

        [Test]
        public void ParseSingleTag_Whitespace_Trimmed()
        {
            var tag = InkTagParser.ParseSingleTag("  SPEAKER :  Christian  ");

            Assert.AreEqual("SPEAKER", tag.Type);
            Assert.AreEqual("Christian", tag.Value);
        }

        [Test]
        public void ParseSingleTag_Empty_String_Returns_Null_Type()
        {
            var tag = InkTagParser.ParseSingleTag("");

            Assert.IsNull(tag.Type);
        }

        [Test]
        public void ParseTags_Null_Input_Returns_Empty_List()
        {
            var result = InkTagParser.ParseTags(null);

            Assert.IsNotNull(result);
            Assert.AreEqual(0, result.Count);
        }

        [Test]
        public void ParseTags_Multiple_Tags()
        {
            var rawTags = new List<string>
            {
                "SPEAKER: Christian",
                "EMOTION: worried",
                "LOCATION: city_of_destruction"
            };

            var result = InkTagParser.ParseTags(rawTags);

            Assert.AreEqual(3, result.Count);
            Assert.AreEqual("SPEAKER", result[0].Type);
            Assert.AreEqual("EMOTION", result[1].Type);
            Assert.AreEqual("LOCATION", result[2].Type);
        }

        [Test]
        public void ParseTags_Skips_Empty_Entries()
        {
            var rawTags = new List<string>
            {
                "SPEAKER: Christian",
                "  ",
                "EMOTION: happy"
            };

            var result = InkTagParser.ParseTags(rawTags);

            Assert.AreEqual(2, result.Count);
        }
    }
}
