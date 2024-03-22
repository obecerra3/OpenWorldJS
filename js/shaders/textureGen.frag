// GPGPU Fragment shader used to generate Data Textures
#include Noise.glsl

uniform int uTextureType;

float r = 0.0;

void main() {
    switch (uTextureType) {
        // 2D Gradient Noise LUT
        case 0:
            gl_FragColor = vec4(noised(gl_FragCoord.xy).x, 0.0, 0.0, 0.0);
            break;

        // Grass Large Texture
        case 1:
            r = iqFBM(gl_FragCoord.xy * 0.01);
            gl_FragColor = vec4(vec3(clamp(r, 0.0, 1.0) * 0.2 + 0.5, clamp(r, 0.0, 1.0) * 0.2 + 0.5, 0.0), 0.0);
            break;

        // Grass Small Texture
        case 2:
            r = iqFBM(gl_FragCoord.xy * 1.0);
            gl_FragColor = vec4(vec3(0.0, clamp(r, 0.0, 1.0) * 0.3 + 0.5, 0.0), 0.0);
            break;
    }
}
