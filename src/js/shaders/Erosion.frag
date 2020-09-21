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
}
uniform SimConstants uSC;
uniform sampler2D uCellData;            // .x = terrain height byte 1, .y = terrain height byte 2, .z = water height, .w = suspended sediment amount
uniform sampler2D uFlux;                // .x = L, .y = R, .z = T, .w = D
uniform sampler2D uNextFlux             // ft+∆t
uniform sampler2D uVelocity;            // .x = u, .y = v
uniform int uStep;                      // what step we are at in the simulation
uniform float uDelta;                   // ∆t

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
    gl_FragColor = vec4(0.0);
}
