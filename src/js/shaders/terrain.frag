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
uniform sampler2D uGrass;
uniform vec2 uCenter;

// function prototypes
vec3 surfaceColor();
vec3 directLightColor(vec3 color);

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
    vec2 uv = (vPosition.xy - uCenter + DATA_WIDTH_2) / DATA_WIDTH;

    #ifdef WEBGL2
        vec3 grass1 = textureLod(uGrass, uv, 0.0).rgb;
        return grass1;
    #else
        return texture2DLod(uGrass, uv, 0.0).rgb;
    #endif
}

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
