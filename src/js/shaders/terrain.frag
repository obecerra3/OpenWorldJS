// ----------------------
// Terrain Frag Shader
// ----------------------

varying vec3 vPosition;

void main()
{
    if (vPosition.y > 0.0)
    {
        //green
        gl_FragColor = vec4(0.2, 0.7, 0.2, 1.0);
    }
    else if (vPosition.y < 0.0)
    {
        //red
        gl_FragColor = vec4(1.0, 0.0, 0, 1.0);
    }
    else if (vPosition.y == 0.0)
    {
        //blue
        gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
    }
    else
    {
        //white
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }

}
