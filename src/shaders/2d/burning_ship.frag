varying vec2 vUv;
uniform vec2 u_resolution;
uniform vec2 u_zoomCenter;
uniform float u_zoom;
uniform int u_maxIterations;

uniform sampler2D u_palette;
uniform float u_colorCycle;
uniform float u_smoothIterations;

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
    
    float iter = float(u_maxIterations);
    for (int i = 0; i < 1000; i++) {
        if (i >= u_maxIterations) break;
        
        // Burning Ship: (|Re(z)| + i|Im(z)|)^2 + c
        z = vec2(abs(z.x), abs(z.y));
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        // Flip y to match standard visualization orientation if needed
        // z.y = -z.y; 
        
        if (dot(z, z) > 4.0) {
            iter = float(i);
            break;
        }
    }
    
    float sn = iter - log2(log2(dot(z, z))) + 4.0;
    float t = sn / 50.0;
    
    float edge = u_smoothIterations - 20.0;
    float fade = clamp((iter - edge) / 20.0, 0.0, 1.0);
    
    vec3 paletteCol = getPaletteColor(t);
    vec3 color = iter > float(u_maxIterations) - 0.5 ? vec3(0.0) : mix(paletteCol, vec3(0.0), fade);
    gl_FragColor = vec4(color, 1.0);
}
