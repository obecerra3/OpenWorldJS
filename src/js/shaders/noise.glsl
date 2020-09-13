// ---------------------------------------------
// Noise algorithms from the web/ Inigo Quilez
// ---------------------------------------------
// The MIT License
// Copyright © 2017 Inigo Quilez
// Value    Noise 2D, Derivatives: https://www.shadertoy.com/view/4dXBRH
// Gradient Noise 2D, Derivatives: https://www.shadertoy.com/view/XdXBRH
// Value    Noise 3D, Derivatives: https://www.shadertoy.com/view/XsXfRH
// Gradient Noise 3D, Derivatives: https://www.shadertoy.com/view/4dffRH
// Value    Noise 2D             : https://www.shadertoy.com/view/lsf3WH
// Value    Noise 3D             : https://www.shadertoy.com/view/4sfGzS
// Gradient Noise 2D             : https://www.shadertoy.com/view/XdXGW8
// Gradient Noise 3D             : https://www.shadertoy.com/view/Xsl3Dl
// Simplex  Noise 2D             : https://www.shadertoy.com/view/Msf3WH
// Wave     Noise 2D             : https://www.shadertoy.com/view/tldSRj

uniform sampler2D uNoise;
uniform bool uHash;

vec2 hash( vec2 x )
{
    const vec2 k = vec2( 0.3183099, 0.3678794 );
    x = x*k + k.yx;
    return -1.0 + 2.0*fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
}

// 2D Gradient Noise
// return gradient noise (in x) and its derivatives (in yz)
vec3 noised( vec2 p )
{
    vec2 i = floor(p);
    vec2 f = fract(p);

    // quintic interpolation
    vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);
    vec2 du = 30.0*f*f*(f*(f-2.0)+1.0);

    if (uHash)
    {
        vec2 ga = hash( i + vec2(0.0,0.0) );
        vec2 gb = hash( i + vec2(1.0,0.0) );
        vec2 gc = hash( i + vec2(0.0,1.0) );
        vec2 gd = hash( i + vec2(1.0,1.0) );

        float va = dot( ga, f - vec2(0.0,0.0) );
        float vb = dot( gb, f - vec2(1.0,0.0) );
        float vc = dot( gc, f - vec2(0.0,1.0) );
        float vd = dot( gd, f - vec2(1.0,1.0) );

        return vec3( va + u.x*(vb-va) + u.y*(vc-va) + u.x*u.y*(va-vb-vc+vd),   // value
                     ga + u.x*(gb-ga) + u.y*(gc-ga) + u.x*u.y*(ga-gb-gc+gd) +  // derivatives
                     du * (u.yx*(va-vb-vc+vd) + vec2(vb,vc) - va));
    }
    else
    {
        ivec2 x = ivec2(i);
        float a = texelFetch( uNoise, (x+ivec2(0,0))&255, 0 ).a;
        float b = texelFetch( uNoise, (x+ivec2(1,0))&255, 0 ).a;
        float c = texelFetch( uNoise, (x+ivec2(0,1))&255, 0 ).a;
        float d = texelFetch( uNoise, (x+ivec2(1,1))&255, 0 ).a;

        return vec3(a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y,
                        6.0*f*(1.0-f)*(vec2(b-a,c-a)+(a-b-c+d)*u.yx));
    }
}

// https://iquilezles.org/www/articles/morenoise/morenoise.htm
// terrain fbm from iq
const mat2 m = mat2(0.8,-0.6,0.6,0.8);

float iqFBM( vec2 p )
{
    float a = 0.0;
    float b = 1.0;
    vec2  d = vec2(0.0);
    for( int i=0; i<15; i++ )
    {
        vec3 n = noised(p);
        d += n.yz;
        a += b * n.x/(1.0+dot(d,d));
        b *= 0.5;
        p= m * p * 2.0;
    }
    return a;
}

// returns 3D fbm and its 3 derivatives
// vec4 fbm( in vec3 x, int octaves )
// {
//     float f = 1.98;  // could be 2.0
//     float s = 0.49;  // could be 0.5
//     float a = 0.0;
//     float b = 0.5;
//     vec3  d = vec3(0.0);
//     mat3  m = mat3(1.0,0.0,0.0,
//     0.0,1.0,0.0,
//     0.0,0.0,1.0);
//     for( int i=0; i < octaves; i++ )
//     {
//         vec4 n = noised(x);
//         a += b*n.x;          // accumulate values
//         d += b*m*n.yzw;      // accumulate derivatives
//         b *= s;
//         x = f*m3*x;
//         m = f*m3i*m;
//     }
//     return vec4( a, d );
// }
