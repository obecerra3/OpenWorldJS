
// 2D Value Noise
// https://www.shadertoy.com/view/4dXBRH
float hash( in vec2 p )  // replace this by something better
{
    p  = 50.0*fract( p*0.3183099 + vec2(0.71,0.113));
    return -1.0+2.0*fract( p.x*p.y*(p.x+p.y) );
}

// return value noise (in x) and its derivatives (in yz)
vec3 noised( in vec2 p )
{
    vec2 i = floor( p );
    vec2 f = fract( p );

    // quintic interpolation
    vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);
    vec2 du = 30.0*f*f*(f*(f-2.0)+1.0);

    float va = hash( i + vec2(0.0,0.0) );
    float vb = hash( i + vec2(1.0,0.0) );
    float vc = hash( i + vec2(0.0,1.0) );
    float vd = hash( i + vec2(1.0,1.0) );

    float k0 = va;
    float k1 = vb - va;
    float k2 = vc - va;
    float k4 = va - vb - vc + vd;

    return vec3( va+(vb-va)*u.x+(vc-va)*u.y+(va-vb-vc+vd)*u.x*u.y, // value
                 du*(u.yx*(va-vb-vc+vd) + vec2(vb,vc) - va) );     // derivative
}

// https://iquilezles.org/www/articles/morenoise/morenoise.htm
// terrain fbm from iq
const mat2 m = mat2(0.8,-0.6,0.6,0.8);

float iqFBM( in vec2 p )
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

// https://iquilezles.org/www/articles/morenoise/morenoise.htm
// https://www.shadertoy.com/view/MdX3Rr
// =====
//   1
// =====
// uniform sampler2D uNoise;
//
// vec3 noised( in vec2 x )
// {
//     vec2 f = fract(x);
//     vec2 u = f*f*(3.0-2.0*f);
//
//     // texel fetch version
//     ivec2 p = ivec2(floor(x));
//     float a = texelFetch( uNoise, (p+ivec2(0,0))&255, 0 ).x;
//     float b = texelFetch( uNoise, (p+ivec2(1,0))&255, 0 ).x;
//     float c = texelFetch( uNoise, (p+ivec2(0,1))&255, 0 ).x;
//     float d = texelFetch( uNoise, (p+ivec2(1,1))&255, 0 ).x;
//
//     return vec3(a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y,
//                 6.0*f*(1.0-f)*(vec2(b-a,c-a)+(a-b-c+d)*u.yx));
// }

// =====
//   2
// =====

// 3d Value Noise
// // https://www.shadertoy.com/view/XsXfRH
//
// float hash(vec3 p)  // replace this by something better
// {
//     p  = 50.0*fract( p*0.3183099 + vec3(0.71,0.113,0.419));
//     return -1.0+2.0*fract( p.x*p.y*p.z*(p.x+p.y+p.z) );
// }
//
//
// // return value noise (in x) and its derivatives (in yzw)
// vec4 noised( in vec3 x )
// {
//     vec3 i = floor(x);
//     vec3 w = fract(x);
//
// #if 1
//     // quintic interpolation
//     vec3 u = w*w*w*(w*(w*6.0-15.0)+10.0);
//     vec3 du = 30.0*w*w*(w*(w-2.0)+1.0);
// #else
//     // cubic interpolation
//     vec3 u = w*w*(3.0-2.0*w);
//     vec3 du = 6.0*w*(1.0-w);
// #endif
//
//
//     float a = hash(i+vec3(0.0,0.0,0.0));
//     float b = hash(i+vec3(1.0,0.0,0.0));
//     float c = hash(i+vec3(0.0,1.0,0.0));
//     float d = hash(i+vec3(1.0,1.0,0.0));
//     float e = hash(i+vec3(0.0,0.0,1.0));
// 	float f = hash(i+vec3(1.0,0.0,1.0));
//     float g = hash(i+vec3(0.0,1.0,1.0));
//     float h = hash(i+vec3(1.0,1.0,1.0));
//
//     float k0 =   a;
//     float k1 =   b - a;
//     float k2 =   c - a;
//     float k3 =   e - a;
//     float k4 =   a - b - c + d;
//     float k5 =   a - c - e + g;
//     float k6 =   a - b - e + f;
//     float k7 = - a + b + c - d + e - f - g + h;
//
//     return vec4( k0 + k1*u.x + k2*u.y + k3*u.z + k4*u.x*u.y + k5*u.y*u.z + k6*u.z*u.x + k7*u.x*u.y*u.z,
//                  du * vec3( k1 + k4*u.y + k6*u.z + k7*u.y*u.z,
//                             k2 + k5*u.z + k4*u.x + k7*u.z*u.x,
//                             k3 + k6*u.x + k5*u.y + k7*u.x*u.y ) );
// }


// 2D Gradient Noise
// vec2 hash( in vec2 x )  // replace this by something better
// {
//     const vec2 k = vec2( 0.3183099, 0.3678794 );
//     x = x*k + k.yx;
//     return -1.0 + 2.0*fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
// }
//
//
// // return gradient noise (in x) and its derivatives (in yz)
// vec3 noised( in vec2 p )
// {
//     vec2 i = floor( p );
//     vec2 f = fract( p );
//
//     // quintic interpolation
//     vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);
//     vec2 du = 30.0*f*f*(f*(f-2.0)+1.0);
//
//     vec2 ga = hash( i + vec2(0.0,0.0) );
//     vec2 gb = hash( i + vec2(1.0,0.0) );
//     vec2 gc = hash( i + vec2(0.0,1.0) );
//     vec2 gd = hash( i + vec2(1.0,1.0) );
//
//     float va = dot( ga, f - vec2(0.0,0.0) );
//     float vb = dot( gb, f - vec2(1.0,0.0) );
//     float vc = dot( gc, f - vec2(0.0,1.0) );
//     float vd = dot( gd, f - vec2(1.0,1.0) );
//
//     return vec3( va + u.x*(vb-va) + u.y*(vc-va) + u.x*u.y*(va-vb-vc+vd),   // value
//                  ga + u.x*(gb-ga) + u.y*(gc-ga) + u.x*u.y*(ga-gb-gc+gd) +  // derivatives
//                  du * (u.yx*(va-vb-vc+vd) + vec2(vb,vc) - va));
// }

// =====
//   3
// =====
//    Simplex 3D Noise
//    by Ian McEwan, Ashima Arts
//
// vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
// vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
//
// float snoise(vec3 v){
//   const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
//   const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
//
// // First corner
//   vec3 i  = floor(v + dot(v, C.yyy) );
//   vec3 x0 =   v - i + dot(i, C.xxx) ;
//
// // Other corners
//   vec3 g = step(x0.yzx, x0.xyz);
//   vec3 l = 1.0 - g;
//   vec3 i1 = min( g.xyz, l.zxy );
//   vec3 i2 = max( g.xyz, l.zxy );
//
//   //  x0 = x0 - 0. + 0.0 * C
//   vec3 x1 = x0 - i1 + 1.0 * C.xxx;
//   vec3 x2 = x0 - i2 + 2.0 * C.xxx;
//   vec3 x3 = x0 - 1. + 3.0 * C.xxx;
//
// // Permutations
//   i = mod(i, 289.0 );
//   vec4 p = permute( permute( permute(
//              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
//            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
//            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
//
// // Gradients
// // ( N*N points uniformly over a square, mapped onto an octahedron.)
//   float n_ = 1.0/7.0; // N=7
//   vec3  ns = n_ * D.wyz - D.xzx;
//
//   vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)
//
//   vec4 x_ = floor(j * ns.z);
//   vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
//
//   vec4 x = x_ *ns.x + ns.yyyy;
//   vec4 y = y_ *ns.x + ns.yyyy;
//   vec4 h = 1.0 - abs(x) - abs(y);
//
//   vec4 b0 = vec4( x.xy, y.xy );
//   vec4 b1 = vec4( x.zw, y.zw );
//
//   vec4 s0 = floor(b0)*2.0 + 1.0;
//   vec4 s1 = floor(b1)*2.0 + 1.0;
//   vec4 sh = -step(h, vec4(0.0));
//
//   vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
//   vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
//
//   vec3 p0 = vec3(a0.xy,h.x);
//   vec3 p1 = vec3(a0.zw,h.y);
//   vec3 p2 = vec3(a1.xy,h.z);
//   vec3 p3 = vec3(a1.zw,h.w);
//
// //Normalise gradients
//   vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
//   p0 *= norm.x;
//   p1 *= norm.y;
//   p2 *= norm.z;
//   p3 *= norm.w;
//
// // Mix final noise value
//   vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
//   m = m * m;
//   return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
//                                 dot(p2,x2), dot(p3,x3) ) );
// }
//
// #define NUM_OCTAVES 5
//
// float fbm(vec3 x) {
//     float v = 0.0;
//     float a = 0.5;
//     vec3 shift = vec3(100);
//     for (int i = 0; i < NUM_OCTAVES; ++i) {
//         v += a * snoise(x);
//         x = x * 2.0 + shift;
//         a *= 0.5;
//     }
//     return v;
// }
