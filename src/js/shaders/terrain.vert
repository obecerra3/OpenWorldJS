// https://github.com/felixpalmer/lod-terrain
// ----------------------
// Terrain Vertex Shader
// ----------------------
struct HeightData
{
    sampler2D top_left;
    sampler2D top_right;
    sampler2D bot_left;
    sampler2D bot_right;
};

uniform vec3 uGlobalOffset;
uniform vec2 uTileOffset;
uniform float uScale;
uniform HeightData uHeightData;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vMorphFactor;

const float lod = 0.0;

float getHeight(vec3 pos)
{
    // change this to just have a single sampler2D uHeightData and on the CPU decide which
    // set of meshes get which single sampler2D
    vec2 st = (pos.xy + float(DATA_WIDTH_2)) / float(DATA_WIDTH);

    float height = 0.0;
    if (pos.x >= 0.0 && pos.y >= 0.0)
    {
        #ifdef WEBGL2
            height = 250.0 * textureLod(uHeightData.top_right, st, lod).a;
        #else
            height = 250.0 * texture2DLod(uHeightData.top_right, st, lod).a;
        #endif
    }
    else if (pos.x < 0.0 && pos.y < 0.0)
    {
        #ifdef WEBGL2
            height = 250.0 * textureLod(uHeightData.bot_left, st, lod).a;
        #else
            height = 250.0 * texture2DLod(uHeightData.bot_left, st, lod).a;
        #endif
    }
    else if (pos.x < 0.0 && pos.y >= 0.0)
    {
        #ifdef WEBGL2
            height = 250.0 * textureLod(uHeightData.top_left, st, lod).a;
        #else
            height = 250.0 * texture2DLod(uHeightData.top_left, st, lod).a;
        #endif
    }
    else
    {
        #ifdef WEBGL2
            height = 250.0 * textureLod(uHeightData.bot_right, st, lod).a;
        #else
            height = 250.0 * texture2DLod(uHeightData.bot_right, st, lod).a;
        #endif
    }

    return height;
}

vec3 getNormal()
{
    // Get 2 vectors perpendicular to the unperturbed normal, and create at point at each (relative to position)
    float delta = (vMorphFactor + 1.0) * uScale / float(RESOLUTION);
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
    float grid = uScale / float(RESOLUTION);
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
