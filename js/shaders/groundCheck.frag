// GPGPU Fragment shader used to calculate whether the player is grounded
uniform vec3 uPlayerPos;
uniform vec2 uCenter;
uniform sampler2D uHeightmap;

void main() {
    vec2 uv = (uPlayerPos.xy + - uCenter + DATA_WIDTH_2) / DATA_WIDTH;

    float height = 0.0;

    #ifdef WEBGL2
        height = textureLod(uHeightmap, uv, 0.0).r;
    #else
        height = texture2DLod(uHeightmap, uv, 0.0).r;
    #endif

    gl_FragColor = vec4((uPlayerPos.z - 0.5) <= height, 0.0, 0.0, 0.0); //0.05 to check for small discrepancy between ammo collider and graphics, TODO fix this later
}
