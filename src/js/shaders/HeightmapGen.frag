// GPGPU Fragment shader used to calculate the Heights of each position in a chunk
uniform vec2 uCenter;

#include Noise.glsl

// const vec2 m_pos = vec2(1000.0, 1000.0);

void main()
{
    vec2 pos = gl_FragCoord.xy - DATA_WIDTH_2 + uCenter;

    float height = abs(iqFBM(pos * 0.0003)) * 255.0 * 70.0 * 4.0;

    // MirroredRepeatWrapping
    if (height >= 65536.0)
    {
        if (mod(floor(height / 65536.0), 2.0) == 0.0)
        {
            height = mod(height, 65536.0);
        }
        else
        {
            height = 65536.0 - mod(height, 65536.0);
        }
    }

    // float m_dist = distance(pos.xy, m_pos);

    // if (m_dist < 1000.0)
    // {
    //     height *= 10.0;
    // }
    //
    // height = height * 255.0 * 70.0;

    float byte1 = float(int(height) & 0xff) / 255.0;
    float byte2 = float((int(height) >> 8) & 0xff) / 255.0;

    gl_FragColor = vec4(byte1, byte2, 0.0, 0.0);
}
