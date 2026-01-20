varying vec2 vUv;
uniform vec2 u_resolution;
uniform vec2 u_zoomCenterHigh;
uniform vec2 u_zoomCenterLow;
uniform float u_zoom;
uniform int u_maxIterations;

// Emulated Double Precision (DS)
vec2 ds_set(float a) { return vec2(a, 0.0); }
vec2 ds_add(vec2 dsa, vec2 dsb) {
    vec2 dsc; float t1, t2, e;
    t1 = dsa.x + dsb.x; e = t1 - dsa.x; t2 = ((dsb.x - e) + (dsa.x - (t1 - e))) + dsa.y + dsb.y;
    dsc.x = t1 + t2; dsc.y = t2 - (dsc.x - t1); return dsc;
}
vec2 ds_sub(vec2 dsa, vec2 dsb) {
    vec2 dsc; float t1, t2, e;
    t1 = dsa.x - dsb.x; e = t1 - dsa.x; t2 = ((-dsb.x - e) + (dsa.x - (t1 - e))) + dsa.y - dsb.y;
    dsc.x = t1 + t2; dsc.y = t2 - (dsc.x - t1); return dsc;
}
vec2 ds_mul(vec2 dsa, vec2 dsb) {
    vec2 dsc; float c11, c21, c2, e, t1, t2; float a1, a2, b1, b2, cona, conb, split = 8193.0;
    cona = dsa.x * split; a1 = cona - (cona - dsa.x); a2 = dsa.x - a1;
    conb = dsb.x * split; b1 = conb - (conb - dsb.x); b2 = dsb.x - b1;
    c11 = dsa.x * dsb.x; c21 = a2 * b2 + (a2 * b1 + (a1 * b2 + (a1 * b1 - c11)));
    c2 = dsa.x * dsb.y + dsa.y * dsb.x; t1 = c11 + c2; e = t1 - c11; t2 = dsa.y * dsb.y + ((c2 - e) + (c11 - (t1 - e))) + c21;
    dsc.x = t1 + t2; dsc.y = t2 - (dsc.x - t1); return dsc;
}

uniform sampler2D u_palette;
uniform float u_colorCycle;

vec3 getPaletteColor(float t) {
    float cycle = u_colorCycle * 0.2;
    vec2 uv = vec2(mod(t + cycle, 1.0), 0.5);
    return texture2D(u_palette, uv).rgb;
}

vec3 solve(vec2 p) {
    vec2 zoomVal = ds_set(1.0 / u_zoom);
    vec2 uvx = ds_set(p.x);
    vec2 uvy = ds_set(p.y);
    vec2 offX = ds_mul(uvx, zoomVal);
    vec2 offY = ds_mul(uvy, zoomVal);
    vec2 cx = ds_add(vec2(u_zoomCenterHigh.x, u_zoomCenterLow.x), offX);
    vec2 cy = ds_add(vec2(u_zoomCenterHigh.y, u_zoomCenterLow.y), offY);

    // Lambda: z_n+1 = c * z_n * (1 - z_n)
    // Critical point z0 = 0.5
    vec2 zx = ds_set(0.5);
    vec2 zy = ds_set(0.0);
    
    vec2 one = ds_set(1.0);
    
    float iter = float(u_maxIterations);

    for(int i=0; i<2000; i++) {
        if(i >= u_maxIterations) break;

        // check escape
        if (zx.x*zx.x + zy.x*zy.x > 4.0) { iter = float(i); break; }

        // w = 1 - z
        // wx = 1 - zx, wy = -zy
        vec2 wx = ds_sub(one, zx);
        vec2 wy = vec2(-zy.x, -zy.y); // Negate DS

        // term = z * w
        // term = (zx + izy) * (wx + iwy)
        // term.x = zx*wx - zy*wy
        // term.y = zx*wy + zy*wx
        
        vec2 termX = ds_sub(ds_mul(zx, wx), ds_mul(zy, wy));
        vec2 termY = ds_add(ds_mul(zx, wy), ds_mul(zy, wx));

        // z_new = c * term
        // z_new = (cx + icy) * (termX + itermY)
        vec2 nextX = ds_sub(ds_mul(cx, termX), ds_mul(cy, termY));
        vec2 nextY = ds_add(ds_mul(cx, termY), ds_mul(cy, termX));
        
        zx = nextX;
        zy = nextY;
    }
    
    // Smooth coloring logic not standard for Lambda? 
    // Just use iter count
    vec3 color = getPaletteColor(iter / 50.0);
    if(iter > float(u_maxIterations)-0.5) return vec3(0.0);
    return color;
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = vUv - 0.5;
    uv.x *= aspect;
    vec3 col = solve(uv); // No supersampling for Lambda (speed)
    gl_FragColor = vec4(col, 1.0);
}
