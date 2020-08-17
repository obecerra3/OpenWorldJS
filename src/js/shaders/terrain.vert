// https://github.com/felixpalmer/lod-terrain
// ----------------------
// Terrain Vertex Shader
// ----------------------
uniform vec3 uGlobalOffset;
uniform sampler2D uHeightData;
uniform vec2 uTileOffset;
uniform float uScale;
uniform float uResolution;
uniform float uWorldWidth;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vMorphFactor;

const float lod = 0.0;

float getHeight(vec3 pos)
{
    vec2 st = pos.xy / uWorldWidth;

    #ifdef WEBGL2
        float height = 250.0 * textureLod(uHeightData, st, lod).a;
    #else
        float height = 250.0 * texture2DLod(uHeightData, st, lod).a;
    #endif

    return height;
}

vec3 getNormal()
{
    // Get 2 vectors perpendicular to the unperturbed normal, and create at point at each (relative to position)
    float delta = (vMorphFactor + 1.0) * uScale / uResolution;
    vec3 dA = delta * normalize(cross(normal.yzx, normal));
    vec3 dB = delta * normalize(cross(dA, normal));
    vec3 p = vPosition;
    vec3 pA = vPosition + dA;
    vec3 pB = vPosition + dB;

    // Now get the height at those points
    float h = getHeight(vPosition);
    float hA = getHeight(pA);
    float hB = getHeight(pB);

    // Update the points with their correct heights and calculate true normal
    p += normal * h;
    pA += normal * hA;
    pB += normal * hB;
    return normalize(cross(pB - p, pA - p));
}

#include edgemorph.glsl

void main()
{
    // Morph factor tells us how close we are to next level.
    // 0.0 is this level
    // 1.0 is next level
    vMorphFactor = calculateMorph(position);

    // Move into correct place
    vPosition = uScale * position + vec3(uTileOffset, 0.0) + uGlobalOffset;

    // Snap to grid
    float grid = uScale / uResolution;
    vPosition = floor(vPosition / grid) * grid;

    // Morph between zoom layers
    if (vMorphFactor > 0.0)
    {
        // Get position that we would have if we were on higher level grid
        grid = 2.0 * grid;
        vec3 position2 = floor(vPosition / grid) * grid;

        // Linearly interpolate the two, depending on morph factor
        vPosition = mix(vPosition, position2, vMorphFactor);
    }

    // Get height and calculate normal
    vNormal = getNormal();
    vPosition = vPosition + vNormal * getHeight(vPosition);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
}
