// ----------------------
// Terrain Vertex Shader
// ----------------------
uniform sampler2D uHeightData;
uniform float uResolution;

varying vec3 vPosition;

float lod = 0.0f;

float getHeight(vec3 pos)
{
    vec2 st = pos.xz / uResolution;

    float height = textureLod(uHeightData, st, lod).a * 1000.0;

    return height;
}

void main()
{
    vec3 vPosition = position + vec3(0.0f, 1.0f, 0.0f) * getHeight(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
}
