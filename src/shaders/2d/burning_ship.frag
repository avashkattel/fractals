varying vec2 vUv;
uniform vec2 u_resolution;
uniform vec2 u_zoomCenter;
uniform float u_zoom;
uniform int u_maxIterations;

vec3 colorPalette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.3, 0.2, 0.2); // Reddish palette
    return a + b * cos(6.28318 * (c * t + d));
}

void main() {
    vec2 uv = vUv - 0.5;
    uv.x *= u_resolution.x / u_resolution.y;
    
    vec2 c = u_zoomCenter + uv * (1.0 / u_zoom);
    vec2 z = vec2(0.0);
    
    float iter = 0.0;
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
    
    vec3 color = iter == float(u_maxIterations) ? vec3(0.0) : colorPalette(t);
    gl_FragColor = vec4(color, 1.0);
}
