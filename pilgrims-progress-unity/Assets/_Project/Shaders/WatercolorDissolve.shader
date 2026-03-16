Shader "PilgrimsProgress/WatercolorDissolve"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _NextTex ("Next Texture", 2D) = "white" {}
        _NoiseTex ("Noise Texture", 2D) = "white" {}
        _Progress ("Transition Progress", Range(0, 1)) = 0
        _EdgeWidth ("Edge Width", Range(0, 0.2)) = 0.05
        _EdgeColor ("Edge Color", Color) = (0.96, 0.9, 0.82, 1)
        _Tint ("Tint", Color) = (1, 1, 1, 1)
    }

    SubShader
    {
        Tags { "RenderType"="Transparent" "Queue"="Transparent" "RenderPipeline"="UniversalPipeline" }
        Blend SrcAlpha OneMinusSrcAlpha
        ZWrite Off

        Pass
        {
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            struct Attributes
            {
                float4 positionOS : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float2 uv : TEXCOORD0;
            };

            TEXTURE2D(_MainTex);
            SAMPLER(sampler_MainTex);
            TEXTURE2D(_NextTex);
            SAMPLER(sampler_NextTex);
            TEXTURE2D(_NoiseTex);
            SAMPLER(sampler_NoiseTex);

            CBUFFER_START(UnityPerMaterial)
                float4 _MainTex_ST;
                float _Progress;
                float _EdgeWidth;
                float4 _EdgeColor;
                float4 _Tint;
            CBUFFER_END

            Varyings vert(Attributes input)
            {
                Varyings output;
                output.positionCS = TransformObjectToHClip(input.positionOS.xyz);
                output.uv = TRANSFORM_TEX(input.uv, _MainTex);
                return output;
            }

            half4 frag(Varyings input) : SV_Target
            {
                half4 currentTex = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, input.uv);
                half4 nextTex = SAMPLE_TEXTURE2D(_NextTex, sampler_NextTex, input.uv);
                half noise = SAMPLE_TEXTURE2D(_NoiseTex, sampler_NoiseTex, input.uv).r;

                float dissolve = noise - _Progress;
                float edge = smoothstep(0.0, _EdgeWidth, dissolve);
                float edgeHighlight = smoothstep(_EdgeWidth, 0.0, abs(dissolve)) * step(dissolve, _EdgeWidth);

                half4 result = lerp(nextTex, currentTex, edge);
                result = lerp(result, _EdgeColor, edgeHighlight * 0.6);
                result *= _Tint;

                return result;
            }
            ENDHLSL
        }
    }
    FallBack "Universal Render Pipeline/Unlit"
}
