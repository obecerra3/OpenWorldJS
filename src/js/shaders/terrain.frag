// ----------------------
// Terrain Frag Shader
// ----------------------
uniform vec2 uAlpha;
uniform vec3 uSunlightPos;

varying vec3 vPosition;
varying vec3 vNormal;

#define MAX_HEIGHT 50.0

void main()
{
    // Base color
    vec3 color = vec3(0.0, 0.0, 0.0);
    float height = vPosition.z;

    vec3 white = vec3(1.0, 1.0, 1.0);
    vec3 rock = vec3(0.25, 0.25, 0.28);
    vec3 grass = vec3(0.4, 0.58, 0.14);
    vec3 sand = vec3(0.8, 0.76, 0.68);
    vec3 water = vec3(0.52, 0.76, 0.87);

    if (height >= MAX_HEIGHT * 0.99)
    {
        color = white;
    }
    else if (height >= MAX_HEIGHT * 0.6)
    {
        color = rock;
    }
    else if (height >= MAX_HEIGHT * 0.1)
    {
        color = grass;
    }
    else if (height >= MAX_HEIGHT * 0.05)
    {
        color = sand;
    }
    else
    {
        color = water;
    }

    // Incident light
    float incidence = dot(normalize(uSunlightPos - vPosition), vNormal);
    incidence = clamp(incidence, 0.01, 1.0);
    incidence = pow(incidence, 0.05);
    color = mix(vec3(0, 0, 0), color, incidence);

    // Mix in specular light
    vec3 half_vector = normalize(normalize(cameraPosition - vPosition) + normalize(uSunlightPos - vPosition));
    float specular = dot(vNormal, half_vector);
    specular = max(0.0, specular);
    specular = pow(specular, 25.0);
    color = mix(color, vec3(1.0, 1.0, 1.0), 0.5 * specular);

    // gamma color correction
    // color = pow(color, vec3(1.0/2.2));

    gl_FragColor = vec4(color, uAlpha.x);
}
