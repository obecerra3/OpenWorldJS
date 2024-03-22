// https://github.com/felixpalmer/lod-terrain
// ----------------------
// Water Vertex Shader
// ----------------------
struct Wave {
    float Ai;
    vec2 Di;
    float wi;
    float phase_i;
};

uniform vec3 uGlobalOffset;
uniform vec2 uTileOffset;
uniform float uScale;
uniform sampler2D uHeightmap;
// uniform sampler2D uWatermap;
uniform vec2 uCenter;
uniform Wave uWaves[WAVE_COUNT];
uniform float uTime;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vMorphFactor;
varying float vDepth;

// function prototypes
void calcWaveData();

#include Edgemorph.glsl

void main() {
    // Morph factor tells us how close we are to next level.
    // 0.0 is this level
    // 1.0 is next level
    vMorphFactor = calculateMorph(position);

    // Move into correct place
    vPosition = uScale * position + vec3(uTileOffset, 0.0) + uGlobalOffset;

    // Snap to grid
    float grid = uScale / RESOLUTION;
    vPosition = floor(vPosition / grid) * grid;

    // Morph between zoom layers
    if (vMorphFactor > 0.0) {
        // Get position that we would have if we were on higher level grid
        grid = 2.0 * grid;
        vec3 position2 = floor(vPosition / grid) * grid;

        // Linearly interpolate the two, depending on morph factor
        vPosition = mix(vPosition, position2, vMorphFactor);
    }

    // get wave data
    calcWaveData();

    gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
}

void calcWaveData() {
    vec2 uv = (vPosition.xy + - uCenter + DATA_WIDTH_2) / DATA_WIDTH;
    float d = 0.0;                           // water height
    float b = 0.0;                           // terrain height
    float height = 0.0;                      // final height
    vec3 normal = vec3(0.0, 0.0, 1.0);       // normal sum
    float depth = 0.0;

    #ifdef WEBGL2
        // d = texture(uWatermap, uv).r;
        b = texture(uHeightmap, uv).r;
    #else
        // d = texture2D(uWatermap, uv).r;
        b = texture2D(uHeightmap, uv).r;
    #endif

    // if (d > 0.0) {
    //     height = d + b;
    // }

    if (b < 20.0) {
        height = 20.0;
        for (int i = 0; i < WAVE_COUNT; i++) {
            Wave w = uWaves[i];
            height += w.Ai * sin(dot(w.Di, vPosition.xy) * w.wi + uTime * w.phase_i);
            normal.x += w.wi * w.Di.x * w.Ai * cos(dot(w.Di, vPosition.xy) * w.wi + uTime * w.phase_i); // change cos to LUT
            normal.y += w.wi * w.Di.y * w.Ai * cos(dot(w.Di, vPosition.xy) * w.wi + uTime * w.phase_i); // change cos to LUT
            normal.z += w.wi * w.Di.y * w.Ai * cos(dot(w.Di, vPosition.yz) * w.wi + uTime * w.phase_i); // change cos to LUT
        }
        depth = height - b;
        normal.xyz *= -1.0;
    }

    vDepth = depth;
    vPosition = vPosition + vec3(0.0, 0.0, 1.0) * height;
    vNormal = normal;
}
