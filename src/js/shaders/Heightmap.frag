// GPGPU Fragment shader used to calculate the Heights of each position in a chunk

uniform float uQuality;
uniform float uQualityDelta;
uniform float uFrequency;
uniform int uIterations;

// implicitly references sampler2D heightmap

#include noise.glsl

void main()
{
    vec2 cellSize = 1.0 / resolution.xy;
    vec2 uv = gl_FragCoord.xy * cellSize;

    vec4 pos = texture2D(heightmap, uv);

    float height = 0.0;
    float q = uQuality;

    for (int i = 0; i < uIterations; i++)
    {
        height += abs(snoise((pos.xyz / q) * uFrequency)) * q;
        q *= uQualityDelta;
    }

    gl_FragColor = vec4(0.0, 0.0, 0.0, height / 255.0);
}

/*
// for (var yi = 0; yi < width; yi++)
// {
//     for (var xi = 0; xi < width; xi++)
//     {
//         quality = 1;
//         var x = (xi - width2 + Terrain.height_data_center.x) + Terrain.negative_bound;
//         var y = (yi - width2 + Terrain.height_data_center.y) + Terrain.negative_bound;
//
//         for (var j = 0; j < iterations; j++)
//         {
//             var height = Math.abs(Terrain.perlin.noise((x / quality) * frequency, (y / quality) * frequency, Terrain.rand_z * frequency) * quality);
//             data[xi + yi * width] += height;
//
//             quality *= quality_delta;
//         }
//     }
// }
*/
