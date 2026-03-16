using System.Collections.Generic;

namespace PilgrimsProgress.Narrative
{
    /// <summary>
    /// Pure-logic parser for Ink tag strings.
    /// Extracted from InkService for testability.
    /// </summary>
    public static class InkTagParser
    {
        public static List<InkTag> ParseTags(List<string> rawTags)
        {
            var result = new List<InkTag>();
            if (rawTags == null) return result;

            foreach (var raw in rawTags)
            {
                var tag = ParseSingleTag(raw.Trim());
                if (tag.Type != null)
                {
                    result.Add(tag);
                }
            }
            return result;
        }

        public static InkTag ParseSingleTag(string raw)
        {
            var tag = new InkTag();

            if (string.IsNullOrWhiteSpace(raw))
                return tag;

            int colonIndex = raw.IndexOf(':');
            if (colonIndex < 0)
            {
                tag.Type = raw.ToUpper();
                return tag;
            }

            tag.Type = raw.Substring(0, colonIndex).Trim().ToUpper();
            string rest = raw.Substring(colonIndex + 1).Trim();

            int spaceIndex = rest.IndexOf(' ');
            if (spaceIndex > 0 && (tag.Type == "STAT" || tag.Type == "BURDEN"))
            {
                tag.Value = rest.Substring(0, spaceIndex).Trim();
                tag.Modifier = rest.Substring(spaceIndex + 1).Trim();
            }
            else
            {
                tag.Value = rest;
            }

            return tag;
        }
    }
}
