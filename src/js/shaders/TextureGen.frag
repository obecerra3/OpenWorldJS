// GPGPU Fragment shader used to generate Data Textures
#include Noise.glsl

uniform int uTextureType;
void main()
{
    switch (uTextureType)
    {
        // 2D Gradient Noise LUT
        case 0:
            gl_FragColor = vec4(noised(gl_FragCoord.xy).x, 0.0, 0.0, 0.0);
            break;

        // Grass Texture
        case 1:
            float r_small = iqFBM(gl_FragCoord.xy * 1.0);
            float r_large = iqFBM(gl_FragCoord.xy * 0.1);
            vec3 color = vec3(0.0, clamp(r_small, 0.0, 1.0) * 0.3 + 0.5, 0.0);
            vec3 color2 = vec3(clamp(r_large, 0.0, 1.0) * 0.2 + 0.5, clamp(r_large, 0.0, 1.0) * 0.2 + 0.5, 0.0);
            gl_FragColor = vec4(mix(color, color2, 0.5), 0.0);
            break;
    }
}
