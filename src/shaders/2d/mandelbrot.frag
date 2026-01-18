varying vec2 vUv;
uniform vec2 u_resolution;
uniform vec2 u_zoomCenter;
uniform float u_zoom;
uniform int u_maxIterations;

vec3 colorPalette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);
    return a + b * cos(6.28318 * (c * t + d));
}

void main() {
    vec2 uv = vUv - 0.5;
    uv.x *= u_resolution.x / u_resolution.y;
    
    // Apply zoom and center
    vec2 c = u_zoomCenter + uv * (1.0 / u_zoom);
    vec2 z = vec2(0.0);
    
    float iter = 0.0;
    for (int i = 0; i < 1000; i++) { // Max loop constant for unroll safety, check uniform break
        if (i >= u_maxIterations) break;
        
        // z = z^2 + c
        // (x+yi)^2 = x^2 - y^2 + 2xyi
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        
        if (dot(z, z) > 4.0) {
            iter = float(i);
            break;
        }
    }
    
    // Smooth coloring
    float sn = iter - log2(log2(dot(z, z))) + 4.0;
    float t = sn / 50.0;
    
    vec3 color = iter == float(u_maxIterations) ? vec3(0.0) : colorPalette(t);
    
    gl_FragColor = vec4(color, 1.0);
}
