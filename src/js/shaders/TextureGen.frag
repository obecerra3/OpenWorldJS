// GPGPU Fragment shader used to generate Data Textures

#include Noise.glsl
void main()
{
    gl_FragColor = vec4(noised(gl_FragCoord.xy).x, 0.0, 0.0, 0.0);
}
