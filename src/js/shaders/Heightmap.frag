// GPGPU Fragment shader used to calculate the Heights of each position in a chunk

uniform vec2 uCenter;

#include noise.glsl

const vec2 m_pos = vec2(2000.0, 2000.0);

void main()
{
    vec3 pos = vec3(gl_FragCoord.xy - DATA_WIDTH_2 + uCenter, RAND_Z);

    float height = abs(fbm(pos * 0.0003));

    float m_dist = distance(pos.xy, m_pos);

    if (m_dist < 1000.0)
    {
        height += (1000.0 - m_dist) * 0.001;
    }

    gl_FragColor = vec4(0.0, 0.0, 0.0, height);
}
