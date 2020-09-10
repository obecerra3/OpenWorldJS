uniform sampler2D uHeightmap;

void main()
{
    vec2 cell_size = 1.0 / resolution.xy;

    vec2 uv = gl_FragCoord.xy * cell_size;

    // Computes the mean of texel and 4 neighbours
    float value = texture2D(uHeightmap, uv).a;                                  // previous

    float sum = 0.0;
    float neighbor = 0.0;
    float count = 0.0;

    neighbor = texture2D(uHeightmap, uv + vec2(0.0, cell_size.y)).a;            // up
    if (neighbor > value)
    {
        sum += neighbor;
        count++;
    }
    neighbor = texture2D(uHeightmap, uv + vec2(0.0, -cell_size.y)).a;           // down
    if (neighbor > value)
    {
        sum += neighbor;
        count++;
    }
    neighbor = texture2D(uHeightmap, uv + vec2(cell_size.x, 0.0)).a;            // right
    if (neighbor > value)
    {
        sum += neighbor;
        count++;
    }
    neighbor = texture2D(uHeightmap, uv + vec2(-cell_size.x, 0.0)).a;           // left
    if (neighbor > value)
    {
        sum += neighbor;
        count++;
    }
    neighbor = texture2D(uHeightmap, uv + vec2(-cell_size.x, cell_size.y)).a;   // up left
    if (neighbor > value)
    {
        sum += neighbor;
        count++;
    }
    neighbor = texture2D(uHeightmap, uv + vec2(cell_size.x, cell_size.y)).a;    // up right
    if (neighbor > value)
    {
        sum += neighbor;
        count++;
    }
    neighbor = texture2D(uHeightmap, uv + vec2(cell_size.x, -cell_size.y)).a;   // down right
    if (neighbor > value)
    {
        sum += neighbor;
        count++;
    }
    neighbor = texture2D(uHeightmap, uv + vec2(-cell_size.x, -cell_size.y)).a;  // down left
    if (neighbor > value)
    {
        sum += neighbor;
        count++;
    }

    // interpolate between vertices and values higher than them
    if (count > 0.0)
    {
        value = (value + (sum / count)) * 0.5;
    }

    gl_FragColor = vec4(0.0, 0.0, 0.0, value);

}
