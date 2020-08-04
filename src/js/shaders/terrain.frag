// https://github.com/felixpalmer/lod-terrain
// ----------------------
// Terrain Frag Shader
// ----------------------
varying vec3 vPosition;

#define MAX_HEIGHT 50.0

void main()
{
    float height = vPosition.z;

    float alpha = 0.5;
    vec4 white = vec4(1.0, 1.0, 1.0, alpha);
    vec4 rock = vec4(0.25, 0.25, 0.28, alpha);
    vec4 grass = vec4(0.4, 0.58, 0.14, alpha);
    vec4 sand = vec4(0.8, 0.76, 0.68, alpha);
    vec4 water = vec4(0.52, 0.76, 0.87, alpha);


    if (height >= MAX_HEIGHT * 0.99)
    {
        gl_FragColor = white;
    }
    else if (height >= MAX_HEIGHT * 0.6)
    {
        gl_FragColor = rock;
    }
    else if (height >= MAX_HEIGHT * 0.1)
    {
        gl_FragColor = grass;
    }
    else if (height >= MAX_HEIGHT * 0.05)
    {
        gl_FragColor = sand;
    }
    else
    {
        gl_FragColor = water;
    }

}
