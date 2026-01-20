varying vec2 vUv;
uniform vec2 u_resolution;
uniform vec2 u_zoomCenter;
uniform float u_zoom;

// Using a fixed iteration count for Newton usually suffices
const int MAX_ITER = 50;

// Complex math utils
vec2 c_mult(vec2 a, vec2 b) {
    return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}
vec2 c_div(vec2 a, vec2 b) {
    float dom = dot(b,b);
    return vec2(dot(a,b), a.y*b.x - a.x*b.y) / dom;
}
vec2 c_pow3(vec2 z) {
    float x = z.x; float y = z.y;
    return vec2(x*x*x - 3.0*x*y*y, 3.0*x*x*y - y*y*y);
}

uniform sampler2D u_palette;
uniform float u_colorCycle;

vec3 getPaletteColor(float t) {
    float cycle = u_colorCycle * 0.2;
    vec2 uv = vec2(mod(t + cycle, 1.0), 0.5);
    return texture2D(u_palette, uv).rgb;
}

void main() {
    vec2 uv = vUv - 0.5;
    uv.x *= u_resolution.x / u_resolution.y;
    vec2 z = u_zoomCenter + uv * (1.0 / u_zoom);
    
    int i = 0;
    vec3 baseColor = vec3(0.0);
    
    // Roots of z^3 - 1
    vec2 r1 = vec2(1.0, 0.0);
    vec2 r2 = vec2(-0.5, sqrt(3.0)/2.0);
    vec2 r3 = vec2(-0.5, -sqrt(3.0)/2.0);
    
    for(int n=0; n<MAX_ITER; n++) {
        vec2 z3 = c_pow3(z);
        vec2 num = z3 - vec2(1.0, 0.0);
        vec2 den = 3.0 * c_mult(z, z);
        z = z - c_div(num, den);
        
        if (distance(z, r1) < 0.001) { 
            baseColor = getPaletteColor(0.0 + float(n)*0.05); i=n; break; 
        }
        if (distance(z, r2) < 0.001) { 
            baseColor = getPaletteColor(0.33 + float(n)*0.05); i=n; break; 
        }
        if (distance(z, r3) < 0.001) { 
            baseColor = getPaletteColor(0.66 + float(n)*0.05); i=n; break; 
        }
    }
    
    // Soft shading
    vec3 color = baseColor * (1.0 - float(i)/float(MAX_ITER));
    gl_FragColor = vec4(color, 1.0);
}
