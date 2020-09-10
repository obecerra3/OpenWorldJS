uniform sampler2D uHeightmap;

void main()
{

    vec2 cell_size = 1.0 / resolution.xy;

    vec2 uv = gl_FragCoord.xy * cell_size;

    // Computes the mean of texel and 4 neighbours
    float value = texture2D(uHeightmap, uv).a;                                  // previous
    float sum = texture2D(uHeightmap, uv + vec2(0.0, cell_size.y)).a;           // up
    sum += texture2D(uHeightmap, uv + vec2(0.0, -cell_size.y)).a;               // down
    sum += texture2D(uHeightmap, uv + vec2(cell_size.x, 0.0)).a;                // right
    sum += texture2D(uHeightmap, uv + vec2(-cell_size.x, 0.0)).a;               // left
    sum += texture2D(uHeightmap, uv + vec2(cell_size.x, cell_size.y)).a;        // up right
    sum += texture2D(uHeightmap, uv + vec2(-cell_size.x, cell_size.y)).a;       // up left
    sum += texture2D(uHeightmap, uv + vec2(cell_size.x, -cell_size.y)).a;       // down right
    sum += texture2D(uHeightmap, uv + vec2(-cell_size.x, -cell_size.y)).a;      // down left

    // box_blur
    value = (value + sum) / 9.0;

    // terrain smooth algo. http://nic-gamedev.blogspot.com/2013/02/simple-terrain-smoothing.html
    // value = (value + (sum / 8.0)) * 0.5;

    gl_FragColor = vec4(0.0, 0.0, 0.0, value);

}
