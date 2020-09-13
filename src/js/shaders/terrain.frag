// ----------------------
// Terrain Frag Shader
// ----------------------
struct DirLight
{
    vec3 direction;
    vec3 position;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

#define MAX_HEIGHT 700.0

varying vec3 vPosition;
varying vec3 vNormal;

uniform vec3 uLookDir;
uniform float uAlpha;
uniform DirLight uSunlight;

const float lod = 0.0;
const vec3 snow = vec3(0.94, 0.91, 1.0);
const vec3 rock = vec3(0.25, 0.25, 0.28);
const vec3 grass = vec3(0.4, 0.58, 0.14);
const vec3 sand = vec3(0.8, 0.76, 0.68);
const vec3 water = vec3(0.52, 0.76, 0.87);

// function prototypes
vec3 surfaceColor();
vec3 directLightColor(vec3 color);

#include Noise.glsl

void main()
{
    // Base color
    vec3 color = vec3(0.0, 0.0, 0.0);

    color += surfaceColor();
    color += directLightColor(color);

    gl_FragColor = vec4(color, uAlpha);
}

vec3 surfaceColor()
{
    // float height = vPosition.z;
    float r_small = iqFBM(vPosition.xy * 100.0);
    float r_large = iqFBM(vPosition.xy * 0.01);
    vec3 color = vec3(0.0, clamp(r_small, 0.0, 1.0) * 0.3 + 0.5, 0.0);
    vec3 color2 = vec3(clamp(r_large, 0.0, 1.0) * 0.2 + 0.5, clamp(r_large, 0.0, 1.0) * 0.2 + 0.5, 0.0);
    return mix(color, color2, 0.5);}

vec3 directLightColor(vec3 color)
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
