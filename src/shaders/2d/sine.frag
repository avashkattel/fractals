varying vec2 vUv;
uniform vec2 u_resolution;
uniform vec2 u_zoomCenter; 
uniform float u_zoom;
uniform int u_maxIterations;

uniform sampler2D u_palette;
uniform float u_colorCycle;

float cosh(float x) { return (exp(x) + exp(-x)) * 0.5; }
float sinh(float x) { return (exp(x) - exp(-x)) * 0.5; }

vec2 c_sin(vec2 z) {
    return vec2(sin(z.x) * cosh(z.y), cos(z.x) * sinh(z.y));
}

vec3 getPaletteColor(float t) {
    float cycle = u_colorCycle * 0.2;
    vec2 uv = vec2(mod(t + cycle, 1.0), 0.5);
    return texture2D(u_palette, uv).rgb;
}

void main() {
    vec2 uv = vUv - 0.5;
    uv.x *= u_resolution.x / u_resolution.y;
    vec2 c = u_zoomCenter + uv * (1.0 / u_zoom);
    vec2 z = vec2(0.0);
    
    int i = 0;
    // Hard loop limit for unrolling, checks uniform inside
    for(int n=0; n<1000; n++) { 
        if (n >= u_maxIterations) break;
        
        z = c_sin(z) + c;
        
        // Sine escapes if Imag part grows large. Real part bounded.
        if (abs(z.y) > 50.0) { 
            i = n;
            break;
        }
        // Safety check for infinity
        if (dot(z,z) > 10000.0) { i=n; break; }
    }
    if (abs(z.y) <= 50.0 && dot(z,z) <= 10000.0) i = u_maxIterations;

    float t = float(i) / 50.0;
    vec3 color = getPaletteColor(t);
    
    if (i == u_maxIterations) color = vec3(0.0);
    gl_FragColor = vec4(color, 1.0);
}
