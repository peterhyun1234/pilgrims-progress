using UnityEngine;

namespace PP.Util
{
    public static class VectorExtensions
    {
        public static Vector2 WithX(this Vector2 v, float x) => new(x, v.y);
        public static Vector2 WithY(this Vector2 v, float y) => new(v.x, y);
        public static Vector3 WithZ(this Vector3 v, float z) => new(v.x, v.y, z);
        public static Vector2 ToVector2(this Vector3 v) => new(v.x, v.y);
    }

    public static class TransformExtensions
    {
        public static void DestroyAllChildren(this Transform t)
        {
            for (int i = t.childCount - 1; i >= 0; i--)
                Object.Destroy(t.GetChild(i).gameObject);
        }
    }

    public static class ColorExtensions
    {
        public static Color WithAlpha(this Color c, float a) => new(c.r, c.g, c.b, a);
    }
}
