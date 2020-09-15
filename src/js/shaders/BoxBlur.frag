uniform sampler2D uHeightmap;

void main()
{
    vec2 cell_size = 1.0 / resolution.xy;

    vec2 uv = gl_FragCoord.xy * cell_size;

    vec2 bytes = texture2D(uHeightmap, uv).xy;
    float height = ((bytes.x * 255.0) + float(int((bytes.y * 255.0)) << 8)) / 70.0;

    // Computes the mean of texel and 4 neighbours
    bytes = texture2D(uHeightmap, uv + vec2(0.0, cell_size.y)).xy;                  //up
    float sum = ((bytes.x * 255.0) + float(int((bytes.y * 255.0)) << 8)) / 70.0;
    bytes = texture2D(uHeightmap, uv + vec2(0.0, -cell_size.y)).xy;                 //down
    sum += ((bytes.x * 255.0) + float(int((bytes.y * 255.0)) << 8)) / 70.0;
    bytes = texture2D(uHeightmap, uv + vec2(cell_size.x, 0.0)).xy;                  //right
    sum += ((bytes.x * 255.0) + float(int((bytes.y * 255.0)) << 8)) / 70.0;
    bytes = texture2D(uHeightmap, uv + vec2(-cell_size.x, 0.0)).xy;                 //left
    sum += ((bytes.x * 255.0) + float(int((bytes.y * 255.0)) << 8)) / 70.0;

    // sum += texture2D(uHeightmap, uv + vec2(cell_size.x, cell_size.y)).a;        // up right
    // sum += texture2D(uHeightmap, uv + vec2(-cell_size.x, cell_size.y)).a;       // up left
    // sum += texture2D(uHeightmap, uv + vec2(cell_size.x, -cell_size.y)).a;       // down right
    // sum += texture2D(uHeightmap, uv + vec2(-cell_size.x, -cell_size.y)).a;      // down left

    // box_blur
    // float value = (height + sum) / 5.0;
    // value *= 70.0;

    // terrain smooth algo. http://nic-gamedev.blogspot.com/2013/02/simple-terrain-smoothing.html
    float value = (height + (sum / 4.0)) * 0.5;
    value *= 70.0;

    float byte1 = float(int(value) & 0xff) / 255.0;
    float byte2 = float((int(value) >> 8) & 0xff) / 255.0;

    gl_FragColor = vec4(byte1, byte2, 0.0, 0.0);
}
