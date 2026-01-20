varying vec2 vUv;
uniform vec2 u_resolution;
uniform vec2 u_zoomCenterHigh;
uniform vec2 u_zoomCenterLow;
uniform float u_zoom;
uniform int u_maxIterations;

// Emulated Double Precision (DS) Math
vec2 ds_set(float a) { return vec2(a, 0.0); }

vec2 ds_add(vec2 dsa, vec2 dsb) {
    vec2 dsc;
    float t1, t2, e;
    t1 = dsa.x + dsb.x;
    e = t1 - dsa.x;
    t2 = ((dsb.x - e) + (dsa.x - (t1 - e))) + dsa.y + dsb.y;
    dsc.x = t1 + t2;
    dsc.y = t2 - (dsc.x - t1);
    return dsc;
}

vec2 ds_sub(vec2 dsa, vec2 dsb) {
    vec2 dsc;
    float t1, t2, e;
    t1 = dsa.x - dsb.x;
    e = t1 - dsa.x;
    t2 = ((-dsb.x - e) + (dsa.x - (t1 - e))) + dsa.y - dsb.y;
    dsc.x = t1 + t2;
    dsc.y = t2 - (dsc.x - t1);
    return dsc;
}

vec2 ds_mul(vec2 dsa, vec2 dsb) {
    vec2 dsc;
    float c11, c21, c2, e, t1, t2;
    float a1, a2, b1, b2, cona, conb, split = 8193.0;
    
    cona = dsa.x * split;
    a1 = cona - (cona - dsa.x);
    a2 = dsa.x - a1;
    
    conb = dsb.x * split;
    b1 = conb - (conb - dsb.x);
    b2 = dsb.x - b1;
    
    c11 = dsa.x * dsb.x;
    c21 = a2 * b2 + (a2 * b1 + (a1 * b2 + (a1 * b1 - c11)));
    
    c2 = dsa.x * dsb.y + dsa.y * dsb.x;
    
    t1 = c11 + c2;
    e = t1 - c11;
    t2 = dsa.y * dsb.y + ((c2 - e) + (c11 - (t1 - e))) + c21;
    
    dsc.x = t1 + t2;
    dsc.y = t2 - (dsc.x - t1);
    return dsc;
}

vec2 ds_sqr(vec2 dsa) {
    return ds_mul(dsa, dsa);
}

uniform sampler2D u_palette;
uniform float u_colorCycle;
uniform float u_smoothIterations; 

vec3 getPaletteColor(float t) {
    float cycle = u_colorCycle * 0.2; 
    vec2 uv = vec2(mod(t + cycle, 1.0), 0.5);
    return texture2D(u_palette, uv).rgb;
}

// Core Solver Function
vec3 solve(vec2 p) {
    vec2 zoomVal = ds_set(1.0 / u_zoom);
    vec2 uvx = ds_set(p.x);
    vec2 uvy = ds_set(p.y);
    
    vec2 offX = ds_mul(uvx, zoomVal);
    vec2 offY = ds_mul(uvy, zoomVal);
    
    vec2 cx = ds_add(vec2(u_zoomCenterHigh.x, u_zoomCenterLow.x), offX);
    vec2 cy = ds_add(vec2(u_zoomCenterHigh.y, u_zoomCenterLow.y), offY);
    
    vec2 zx = ds_set(0.0);
    vec2 zy = ds_set(0.0);
    
    float iter = float(u_maxIterations);
    
    for (int i = 0; i < 2000; i++) {
        if (i >= u_maxIterations) break;
        
        vec2 x2 = ds_sqr(zx);
        vec2 y2 = ds_sqr(zy);
        
        if (x2.x + y2.x > 4.0) {
            iter = float(i);
            break;
        }
        
        // Tricorn: (x - iy)^2 + c
        // = (x^2 - y^2) - 2ixy + c
        
        vec2 two = ds_set(2.0);
        vec2 xy = ds_mul(zx, zy);
        vec2 twoxy = ds_mul(two, xy);
        
        // Difference from Mandelbrot: SUBTRACT 2xy from cy? No.
        // zy = -2xy + cy
        // zy = cy - 2xy
        zy = ds_sub(cy, twoxy);
        
        vec2 x2my2 = ds_sub(x2, y2);
        zx = ds_add(x2my2, cx);
    }
    
    float sqMod = zx.x*zx.x + zy.x*zy.x;
    float sn = iter - log2(log2(sqMod)) + 4.0;
    float t = sn / 50.0;

    float edge = u_smoothIterations - 20.0;
    float fade = clamp((iter - edge) / 20.0, 0.0, 1.0);
    
    vec3 color = getPaletteColor(t);
    if (iter > float(u_maxIterations) - 0.5) return vec3(0.0);
    return mix(color, vec3(0.0), fade);
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = vUv - 0.5;
    uv.x *= aspect;
    
    float pixelScale = 1.0 / u_resolution.y; 
    float d = pixelScale * 0.25;
    
    vec3 col = vec3(0.0);
    
    col += solve(uv + vec2(-d, -d));
    col += solve(uv + vec2(+d, -d));
    col += solve(uv + vec2(-d, +d));
    col += solve(uv + vec2(+d, +d));
    
    col *= 0.25;
    
    gl_FragColor = vec4(col, 1.0);
}
