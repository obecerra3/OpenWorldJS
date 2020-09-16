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

        // Grass Large Texture
        case 1:
            float r_large = iqFBM(gl_FragCoord.xy * 0.01);
            gl_FragColor = vec4(vec3(clamp(r_large, 0.0, 1.0) * 0.2 + 0.5, clamp(r_large, 0.0, 1.0) * 0.2 + 0.5, 0.0), 0.0);
            break;

        // Grass Small Texture
        case 2:
            float r_small = iqFBM(gl_FragCoord.xy * 1.0);
            gl_FragColor = vec4(vec3(0.0, clamp(r_small, 0.0, 1.0) * 0.3 + 0.5, 0.0), 0.0);
            break;

        // Rock Texture
        case 3:
            gl_FragColor = vec4(0.0);
            break;
    }
}
