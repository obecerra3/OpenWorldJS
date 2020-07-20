// ----------------------
// Terrain Frag Shader
// ----------------------

varying vec3 vPosition;

#define MAX_HEIGHT 120.0

void main()
{
    float height = vPosition.y;

    vec4 white = vec4(1.0, 1.0, 1.0, 1.0);
    vec4 rock = vec4(0.25, 0.25, 0.28, 1.0);
    vec4 grass = vec4(0.4, 0.58, 0.14, 1.0);
    vec4 sand = vec4(0.8, 0.76, 0.68, 1.0);
    vec4 water = vec4(0.52, 0.76, 0.87, 1.0);


    if (height >= MAX_HEIGHT * 0.95)
    {
        gl_FragColor = white;
    }
    else if (height >= MAX_HEIGHT * 0.6)
    {
        gl_FragColor = rock;
    }
    else if (height >= MAX_HEIGHT * 0.4)
    {
        gl_FragColor = grass;
    }
    else if (height >= MAX_HEIGHT * 0.35)
    {
        gl_FragColor = sand;
    }
    else
    {
        gl_FragColor = water;
    }


}
