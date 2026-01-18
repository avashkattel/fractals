varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_cameraPos;
uniform vec3 u_cameraDir;

// SDF for Box
float sdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

// Menger Sponge SDF
float map(vec3 p) {
    float d = sdBox(p, vec3(1.0));
    float s = 1.0;
    for(int m=0; m<4; m++) {
        vec3 a = mod( p*s, 2.0 )-1.0;
        s *= 3.0;
        vec3 r = abs(1.0 - 3.0*abs(a));
        float da = max(r.x,r.y);
        float db = max(r.y,r.z);
        float dc = max(r.z,r.x);
        float c = (min(da,min(db,dc))-1.0)/s;
        d = max(d,c);
    }
    return d;
}

void main() {
    vec2 uv = vUv - 0.5;
    uv.x *= u_resolution.x / u_resolution.y;

    vec3 ro = u_cameraPos;
    // Simple look-at target 0,0,0 logic for now 
    // Ideally we use u_cameraDir from R3F which is correct view direction
    vec3 rd = u_cameraDir; // This uniform must be the *ray direction*? 
    // Wait, u_cameraDir from R3F is just the camera's forward vector.
    // We need to compute the ray direction for *this pixel*.
    // Re-computing view matrix here is expensive/complex without passing more uniforms.
    // Simpler hack: Use LookAt logic in shader or update u_cameraDir to be "Quat" or "ViewMatrix".
    
    // BETTER APPROACH: u_cameraDir was meant to be the forward vector. 
    // Let's re-implement standard camera ray gen.
    vec3 target = vec3(0.0);
    // Actually, use u_cameraDir (Forward) to build basis.
    vec3 fwd = normalize(u_cameraDir); // Camera Forward
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd)); // Approximate Up=Y
    vec3 up = cross(fwd, right);
    
    rd = normalize(fwd + uv.x * right + uv.y * up);

    float t = 0.0;
    for(int i = 0; i < 100; i++) {
        vec3 p = ro + t * rd;
        float d = map(p);
        if(d < 0.001) {
            // Hit
             vec3 col = vec3(0.5) + 0.5 * cos(vec3(0,2,4) + float(i)*0.1);
             gl_FragColor = vec4(col * (1.0 - float(i)/100.0), 1.0);
             return;
        }
        t += d;
        if(t > 20.0) break;
    }
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // Background
}
