// ----------------------
// Terrain Frag Shader
// ----------------------
struct DirLight {
    vec3 direction;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

#define MAX_HEIGHT 50.0

varying vec3 vPosition;
varying vec3 vNormal;

uniform vec3 uLookDir;
uniform vec2 uAlpha;
uniform DirLight uSunlight;

vec3 white = vec3(1.0, 1.0, 1.0);
vec3 rock = vec3(0.25, 0.25, 0.28);
vec3 grass = vec3(0.4, 0.58, 0.14);
vec3 sand = vec3(0.8, 0.76, 0.68);
vec3 water = vec3(0.52, 0.76, 0.87);

// function prototypes
vec3 calcHeightColor();
vec3 calcDirectLight(vec3 color);

void main()
{
    // Base color
    vec3 color = vec3(0.0, 0.0, 0.0);

    color += calcHeightColor();
    color += calcDirectLight(color);

    gl_FragColor = vec4(color, uAlpha.x);
}

vec3 calcHeightColor()
{
    float height = vPosition.z;

    if (height >= MAX_HEIGHT * 0.99)
    {
        return white;
    }
    else if (height >= MAX_HEIGHT * 0.6)
    {
        return rock;
    }
    else if (height >= MAX_HEIGHT * 0.1)
    {
        return grass;
    }
    else if (height >= MAX_HEIGHT * 0.05)
    {
        return sand;
    }
    else
    {
        return water;
    }
}

vec3 calcDirectLight(vec3 color)
{
    vec3 light_dir = normalize(-uSunlight.direction);

    //ambient
    vec3 ambient = uSunlight.ambient * color;

    // diffuse shading
    float diff = max(dot(vNormal, light_dir), 0.0);
    vec3 diffuse = uSunlight.diffuse * diff * color;

    // specular light
    vec3 specular = vec3(0.0);
    if (light_dir.z > 0.0)
    {
        vec3 half_vector = normalize(normalize(cameraPosition - vPosition) + light_dir);
        float spec = dot(vNormal, half_vector);
        spec = max(0.0, spec);
        spec = pow(spec, 25.0);
        specular = uSunlight.specular * spec * color;
    }


    return (ambient + diffuse + specular);
}
