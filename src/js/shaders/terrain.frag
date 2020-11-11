// ----------------------
// Terrain Frag Shader
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

uniform vec3 uLookDir;
uniform float uAlpha;
uniform DirLight uSunlight;
uniform sampler2D uGrassLarge;
uniform sampler2D uGrassSmall;
uniform vec2 uCenter;
uniform sampler2D uDiffmap;

// function prototypes
vec3 surfaceColor();
vec3 directLightColor(vec3 color);
vec3 grassColor(vec2 uv, float flatness);
vec3 rockColor(vec2 uv);

void main() {
    // Base color
    vec3 color = vec3(0.0, 0.0, 0.0);

    color += surfaceColor();
    color += directLightColor(color);

    gl_FragColor = vec4(color, uAlpha);
}

vec3 surfaceColor() {
    float flatness = dot(vec3(0, 1, 0), vNormal);
    vec2 uv = (vPosition.xy - uCenter + DATA_WIDTH_2) / DATA_WIDTH;
    float d = texture(uDiffmap, uv).x;
    d = (0.7 * d) + 0.3;
    vec3 base = mix(grassColor(uv, flatness), rockColor(uv), d);
    base = clamp(base * d, 0.0, 1.0);
    return base;
}

vec3 rockColor(vec2 uv) {
    return vec3(0.5, 0.5, 0.5);
}

vec3 grassColor(vec2 uv, float flatness) {
    #ifdef WEBGL2
        vec3 grass1 = texture(uGrassLarge, 4.0 * uv).rgb;
        vec3 grass2 = texture(uGrassSmall, 500.0 * uv).rgb;
    #else
        vec3 grass1 = texture2D(uGrassLarge, 4.0 * uv).rgb;
        vec3 grass2 = texture2D(uGrassSmall, 500.0 * uv).rgb;
    #endif
    vec3 grass = mix(mix(grass1, grass2, 0.5), vec3(0.1, 0.1, 0.1), flatness);
    return grass;
}

vec3 directLightColor(vec3 color) {
    vec3 light_dir = normalize(-uSunlight.direction);

    //ambient
    vec3 ambient = uSunlight.ambient * color;

    // diffuse shading
    float diff = max(dot(vNormal, light_dir), 0.0);
    vec3 diffuse = uSunlight.diffuse * diff * color;

    return (ambient + diffuse);
}
