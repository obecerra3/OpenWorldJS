// ----------------------
// Terrain Vertex Shader
// ----------------------
uniform sampler2D uHeightData;
uniform float uResolution;

varying vec3 vPosition;

float getHeight(vec3 pos)
{
    vec2 st = pos.xy / uResolution;
    float lod = 0.0;

    float height = 1024.0 * textureLod(uHeightData, st, lod).a;

    return height;
}

void main()
{
    // vPosition = position + normal * getHeight(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
