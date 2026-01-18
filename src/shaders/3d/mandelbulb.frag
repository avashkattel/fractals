varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_cameraPos;
uniform vec3 u_cameraDir;
uniform float u_power; // Power for Mandelbulb (usually 8)

// Mandelbulb Distance Estimator
float DE(vec3 pos) {
    vec3 z = pos;
    float dr = 1.0;
    float r = 0.0;
    for (int i = 0; i < 15; i++) {
        r = length(z);
        if (r > 2.0) break;
        
        // Convert to polar coordinates
        float theta = acos(z.z/r);
        float phi = atan(z.y, z.x);
        dr =  pow(r, u_power - 1.0) * u_power * dr + 1.0;
        
        // Scale and rotate the point
        float zr = pow(r, u_power);
        theta = theta * u_power;
        phi = phi * u_power;
        
        // Convert back to cartesian coordinates
        z = zr * vec3(sin(theta)*cos(phi), sin(theta)*sin(phi), cos(theta));
        z += pos;
    }
    return 0.5 * log(r) * r / dr;
}

// Raymarching Loop
void main() {
    vec2 uv = vUv - 0.5;
    uv.x *= u_resolution.x / u_resolution.y;

    // Simple Camera Logic (Look at origin)
    vec3 ro = u_cameraPos;
    vec3 target = vec3(0.0);
    vec3 fwd = normalize(target - ro);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
    vec3 up = cross(fwd, right);
    vec3 rd = normalize(fwd + uv.x * right + uv.y * up);

    float t = 0.0;
    float d = 0.0;
    int steps = 0;
    bool hit = false;
    
    // Raymarch
    for(int i = 0; i < 100; i++) {
        vec3 p = ro + t * rd;
        d = DE(p);
        if (d < 0.001) {
            hit = true;
            break;
        }
        t += d;
        if (t > 10.0) break;
        steps = i;
    }
    
    vec3 color = vec3(0.0);
    if (hit) {
        // Simple lighting based on steps (Ambient Occlusion approximation)
        float glow = 1.0 - (float(steps) / 100.0);
        color = vec3(glow * 0.8, glow * 0.9, glow);
        
        // Add basic coloring based on position
        // color += cos(vec3(0.0, 0.33, 0.67) + t * 0.5) * 0.2;
    } 

    gl_FragColor = vec4(color, 1.0);
}
