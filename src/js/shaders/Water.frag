// ----------------------
// Water Frag Shader
// ----------------------
struct DirLight {
    vec3 direction;
    vec3 position;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

varying vec3 vPosition;
varying vec3 vNormal;
varying float vDepth;

uniform vec3 uLookDir;
uniform DirLight uSunlight;
uniform vec2 uCenter;

// function prototypes
vec3 surfaceColor();
vec3 directLightColor(vec3 color);

void main() {
    // Base color
    vec3 color = vec3(0.0, 0.0, 0.0);

    color += surfaceColor();
    color += directLightColor(color);

    gl_FragColor = vec4(color, 0.6 * clamp((vDepth / 25.0), 0.0, 1.0) + 0.3);
}

vec3 surfaceColor() {
    return vec3(0.05, 0.3, 0.9);
}

vec3 directLightColor(vec3 color) {
    vec3 light_dir = normalize(-uSunlight.direction);

    //ambient
    vec3 ambient = uSunlight.ambient * color;

    // diffuse shading
    float diff = max(dot(vNormal, light_dir), 0.0);
    vec3 diffuse = uSunlight.diffuse * diff * color;

    return (ambient + diffuse + uSunlight.specular);
}
