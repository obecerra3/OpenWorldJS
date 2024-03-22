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
uniform sampler2D uT3;                   // Velocity .x = u, .y = v, .z = d2
uniform int uStep;                       // what sub step we are at in the simulation
uniform int uFrame;                      // how many total simulation steps we have run

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
            vec4 state = texture(uT1, uv);
            float water_level = state.z + uSC.delta * rainfall(uv);
            gl_FragColor = vec4(state.x, state.y, water_level, state.w);
            break;

        // 2. Simulate flow
        // ---------------------------------------------------------
        case 2:
            // ft+∆t(x, y) = max(0, ft(x, y) + ∆t * A * ((g * h(x,y)) / l))
            // hL(x,y) = bt(x, y) + d1(x, y) − bt(x−1, y) − d1(x−1, y)
            // K = min(1, (d1 ·lXlY) / ((fL+fR+fT+fB)·∆t))
            // fi(x,y)= K·fi (x,y), i=L,R,T,B
            vec2 cell_size = 1.0 / resolution.xy;
            uv = gl_FragCoord.xy / resolution.xy;
            state = texture(uT1, uv);
            float b = ((state.x * 255.0) + float(int((state.y * 255.0)) << 8)) / 70.0;
            vec4 left_state = texture(uT1, uv + vec2(-cell_size.x, 0.0));
            float bL = ((left_state.x * 255.0) + float(int((left_state.y * 255.0)) << 8)) / 70.0;
            vec4 right_state = texture(uT1, uv + vec2(cell_size.x, 0.0));
            float bR = ((right_state.x * 255.0) + float(int((right_state.y * 255.0)) << 8)) / 70.0;
            vec4 up_state = texture(uT1, uv + vec2(0.0, cell_size.y));
            float bU = ((up_state.x * 255.0) + float(int((up_state.y * 255.0)) << 8)) / 70.0;
            vec4 down_state = texture(uT1, uv + vec2(0.0, -cell_size.y));
            float bD = ((down_state.x * 255.0) + float(int((down_state.y * 255.0)) << 8)) / 70.0;
            vec4 flow = texture(uT2, uv);
            // left
            float hL = b + state.z - bL - left_state.z;
            float left = max(0.0, flow.x + uSC.delta * uSC.A * ((uSC.g * hL) / uSC.lX));
            // right
            float hR = b + state.z - bR - right_state.z;
            float right = max(0.0, flow.y + uSC.delta * uSC.A * ((uSC.g * hR) / uSC.lX));
            // up
            float hU = b + state.z - bU - up_state.z;
            float up = max(0.0, flow.z + uSC.delta * uSC.A * ((uSC.g * hU) / uSC.lY));
            // down
            float hD = b + state.z - bD - down_state.z;
            float down = max(0.0, flow.w + uSC.delta * uSC.A * ((uSC.g * hD) / uSC.lY));
            // K
            float K = min(1.0, (state.z * uSC.lX * uSC.lY) / ((left + right + up + down) * uSC.delta));
            gl_FragColor = K * vec4(left, right, up, down);
            break;

        // 3. Update velocity field
        // ---------------------------------------------------------
        case 3:
            cell_size = 1.0 / resolution.xy;
            uv = gl_FragCoord.xy / resolution.xy;
            state = texture(uT1, uv);
            flow = texture(uT2, uv);
            vec4 left_flow = texture(uT2, uv + vec2(-cell_size.x, 0.0));
            vec4 right_flow = texture(uT2, uv + vec2(cell_size.x, 0.0));
            vec4 up_flow = texture(uT2, uv + vec2(0.0, cell_size.y));
            vec4 down_flow = texture(uT2, uv + vec2(0.0, -cell_size.y));
            float fin_sum = right_flow.x + left_flow.y + up_flow.w + down_flow.z;
            float fout_sum = flow.x + flow.y + flow.z + flow.w;
            float net_volume = uSC.delta * (fin_sum - fout_sum);
            float d2 = max(0.0, state.z + (net_volume / (uSC.lX * uSC.lY)));
            float outflow_flux_x = (left_flow.y - flow.x + flow.y - right_flow.x) / 2.0;
            float d_bar = (state.z + d2) / 2.0;
            float u = outflow_flux_x / (uSC.lY * d_bar);
            float outflow_flux_y = (up_flow.w - flow.z + flow.w - down_flow.z) / 2.0;
            float v = outflow_flux_y / (uSC.lX * d_bar);
            float bit_mask = 0.0;
            if (u < 0.0) {
                u = abs(u);
                bit_mask += 1.0;
            }
            if (v < 0.0) {
                v = abs(v);
                bit_mask += 2.0;
            }
            gl_FragColor = vec4(u, v, d2, bit_mask);
            break;

        // 4. Update water surface
        // ---------------------------------------------------------
        case 4:
            uv = gl_FragCoord.xy / resolution.xy;
            state = texture(uT1, uv);
            vec4 velocity = texture(uT3, uv);
            gl_FragColor = vec4(state.x, state.y, velocity.z, state.w);
            break;

        // 5. Erosion and Deposition
        // ---------------------------------------------------------
        case 5:
            cell_size = 1.0 / resolution.xy;
            uv = gl_FragCoord.xy / resolution.xy;
            state = texture(uT1, uv);
            velocity = texture(uT3, uv);
            left_state = texture(uT1, uv + vec2(-cell_size.x, 0.0));
            bL = ((left_state.x * 255.0) + float(int((left_state.y * 255.0)) << 8)) / 70.0;
            right_state = texture(uT1, uv + vec2(cell_size.x, 0.0));
            bR = ((right_state.x * 255.0) + float(int((right_state.y * 255.0)) << 8)) / 70.0;
            up_state = texture(uT1, uv + vec2(0.0, cell_size.y));
            bU = ((up_state.x * 255.0) + float(int((up_state.y * 255.0)) << 8)) / 70.0;
            down_state = texture(uT1, uv + vec2(0.0, -cell_size.y));
            bD = ((down_state.x * 255.0) + float(int((down_state.y * 255.0)) << 8)) / 70.0;
            float p_x = (bR - bL) / 2.0;
            float p_y = (bU - bD) / 2.0;
            float tilt_angle = sqrt((p_x * p_x) + (p_y * p_y)) / sqrt(1.0 + (p_x * p_x) + (p_y * p_y));
            float C = uSC.Kc * tilt_angle * length(velocity.xy); // sediment transport capacity
            b = ((state.x * 255.0) + float(int((state.y * 255.0)) << 8)) / 70.0;
            float st = state.w;
            float s1 = 0.0;
            float b_new = 0.0;
            if (C > st) {
                b_new = b - uSC.Ks * (C - st);
                s1 = st + uSC.Ks * (C - st);
            } else {
                b_new = b + uSC.Kd * (st - C);
                s1 = st - uSC.Kd * (st - C);
            }
            if (b_new < 0.0) {
                b_new = 0.0;
            }
            b_new *= 70.0;
            float byte1 = float(int(b_new) & 0xff) / 255.0;
            float byte2 = float((int(b_new) >> 8) & 0xff) / 255.0;
            gl_FragColor = vec4(byte1, byte2, state.z, s1);
            break;

        // 6. Suspended sediment transport
        // ---------------------------------------------------------
        case 6:
            cell_size = 1.0 / resolution.xy;
            uv = gl_FragCoord.xy / resolution.xy;
            state = texture(uT1, uv);
            velocity = texture(uT3, uv);
            if (velocity.w == 1.0) {
                velocity.x *= -1.0;
            } else if (velocity.w == 2.0) {
                velocity.y *= -1.0;
            } else if (velocity.w == 3.0) {
                velocity.x *= -1.0;
                velocity.y *= -1.0;
            }
            vec4 p_state = texture(uT1, uv - (velocity.xy * uSC.delta));
            float s2 = p_state.w;
            gl_FragColor = vec4(state.x, state.y, state.z, s2);
            break;

        // 7. Evaporation
        // ---------------------------------------------------------
        case 7:
            cell_size = 1.0 / resolution.xy;
            uv = gl_FragCoord.xy / resolution.xy;
            state = texture(uT1, uv);
            water_level = max(0.0, state.z * (1.0 - uSC.Ke * uSC.delta));
            gl_FragColor = vec4(state.x, state.y, water_level, state.w);
            break;
    }
}

float rainfall(vec2 uv) {
    return 5.0 * noised((uv + vec2(uFrame, uFrame)) * 1000.0).x;
}
