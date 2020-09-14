// The MIT License
// Copyright © 2017 Inigo Quilez
// https://www.shadertoy.com/view/Xtl3zf

float sum( vec3 v ) { return v.x+v.y+v.z; }

vec3 textureNoTile( vec2 x, sampler2D sample_texture )
{
    float k = texture( uNoise, 0.005*x ).a; // cheap (cache friendly) lookup

    vec2 duvdx = dFdx( x );
    vec2 duvdy = dFdx( x );

    float l = k*8.0;
    float f = fract(l);

    // float ia = floor(l); // iq's method
    // float ib = ia + 1.0;
    float ia = floor(l+0.5); // suslik's method (see comments)
    float ib = floor(l);
    f = min(f, 1.0-f)*2.0;

    vec2 offa = sin(vec2(3.0,7.0)*ia); // can replace with any other hash
    vec2 offb = sin(vec2(3.0,7.0)*ib); // can replace with any other hash

    vec3 cola = textureGrad( sample_texture, x + offa, duvdx, duvdy ).xyz;
    vec3 colb = textureGrad( sample_texture, x + offb, duvdx, duvdy ).xyz;

    return mix( cola, colb, smoothstep(0.2,0.8,f-0.1*sum(cola-colb)) );
}
