// GPGPU Fragment shader used to calculate the Heights of each position in a chunk

uniform float uQuality;
uniform float uQualityDelta;
uniform vec2 uCenter;

#include noise.glsl

void main()
{
    vec3 pos = vec3(gl_FragCoord.xy - DATA_WIDTH_2 + uCenter, RAND_Z);

    float q = uQuality;
    float height = 0.0;

    for (int i = 0; i < OCTAVES; i++)
    {
        height += abs(snoise((pos / q) * FREQUENCY) * q);
        q *= uQualityDelta;
    }

    gl_FragColor = vec4(0.0, 0.0, 0.0, height / 255.0);
}
