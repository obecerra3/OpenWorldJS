// GPGPU Fragment shader used to generate eroded height data
// https://www.researchgate.net/publication/4295561_Fast_Hydraulic_Erosion_Simulation_and_Visualization_on_GPU

struct SimConstants {
    float A;                            // cross sectional area of pipe
    float lX;                           // x distance between grid points
    float lY;                           // y distance between grid points
    float g;                            // gravity constant
    float Kc;                           // sediment capacity constant
    float Ks;                           // sediment dissolving constant
    float Kd;                           // sediment deposition constant
    float Ke;                           // evaporation constant
    float delta;                        // ∆t
};
uniform SimConstants uSC;
uniform sampler2D uT1;                   // Terrain Height b, Water Height d, Sediment s -> .x = b byte 1, .y = b byte 2, .z = d, .w = s
uniform sampler2D uT2;                   // Flux .x = L, .y = R, .z = T, .w = D
uniform sampler2D uT3;                   // Velocity .x = u, .y = v
uniform int uStep;                       // what step we are at in the simulation

float rainfall(vec2 uv);

#include Noise.glsl

// 1. Water level increases from rainfall or a water source
// 2. Simulate flow and update the velocity field and water level
// 3. Erosion and deposition from velocity field
// 4. Suspended sediment is transported from velocity field
// 5. Water level decreases from evaporation

// 1. d1 ← WaterIncrement(dt);
// 2. (d2,ft+∆t, vt+∆t) ← FlowSimulation(d1,bt,ft);
// 3. (bt+∆t,s1) ← ErosionDeposition(vt+∆t,bt,st);
// 4. st+∆t ← SedimentTransport(s1, vt+∆t);
// 5. dt+∆t ← Evaporation(d2)

void main() {
    switch (uStep) {
        // 1. Water level increases from rainfall or a water source
        // ---------------------------------------------------------
        case 1:
            // d1(x, y) = dt(x, y) + ∆t · rt(x, y)
            vec2 uv = gl_FragCoord.xy / resolution.xy;
            vec4 current = texture(uT1, uv);
            float water_level = current.z + uSC.delta * rainfall(uv);
            gl_FragColor = vec4(current.x, current.y, water_level, current.w);
            break;

        // 2. Simulate flow
        // ---------------------------------------------------------
        case 2:
            // ft+∆t(x, y) = max(0, ft(x, y) + ∆t * A * ((g * h(x,y)) / l))
            // hL(x,y) = bt(x, y) + d1(x, y) − bt(x−1, y) − d1(x−1, y)
            // K = min(1, (d1 ·lXlY) / ((fL+fR+fT+fB)·∆t))
            // fi(x,y)= K·fi (x,y), i=L,R,T,B
            break;

        // 3. Update water surface
        // ---------------------------------------------------------
        case 3:
            break;

        // 4. Update velocity field
        // ---------------------------------------------------------
        case 4:
            break;

        // 5. Erosion and Deposition
        // ---------------------------------------------------------
        case 5:
            break;

        // 6. Suspended sediment transport
        // ---------------------------------------------------------
        case 6:
            break;

        // 7. Evaporation
        // ---------------------------------------------------------
        case 7:
            break;

    }
}

float rainfall(vec2 uv) {
    return noised(uv).x;
}
