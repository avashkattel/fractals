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

    vec3 ro = u_cameraPos;
    // Raymarching Camera (Simplified)
    vec3 fwd = normalize(u_cameraDir);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
    vec3 up = cross(fwd, right);
    vec3 rd = normalize(fwd + uv.x * right + uv.y * up);

    float t = 0.0;
    bool hit = false;
    for(int i = 0; i < 100; i++) {
        vec3 p = ro + t * rd;
        float d = map(p);
        if(d < 0.001) {
             float val = float(i)/100.0 + length(p)*0.1;
             vec3 baseColor = getPaletteColor(val);
             
             // 5 Lights from Palette
             vec3 lightColors[5];
             lightColors[0] = getPaletteColor(0.1);
             lightColors[1] = getPaletteColor(0.3);
             lightColors[2] = getPaletteColor(0.5);
             lightColors[3] = getPaletteColor(0.7);
             lightColors[4] = getPaletteColor(0.9);

             // Simple Normals from deriv or tricks?
             // Menger normal is tricky without DE... using box normal approx or just face checks?
             // Actually, map() IS an SDF. We can compute normals!
             float eps = 0.001;
             vec3 n = normalize(vec3(
                map(p+vec3(eps,0,0))-map(p-vec3(eps,0,0)),
                map(p+vec3(0,eps,0))-map(p-vec3(0,eps,0)),
                map(p+vec3(0,0,eps))-map(p-vec3(0,0,eps))
             ));

             vec3 viewDir = normalize(ro - p);
             vec3 accum = vec3(0.0);
             
             // Directions
             vec3 lightDirs[5];
             lightDirs[0] = normalize(vec3(1,1,1));
             lightDirs[1] = normalize(vec3(-1,1,1));
             lightDirs[2] = normalize(vec3(0,1,-1));
             lightDirs[3] = normalize(vec3(0,-1,0));
             lightDirs[4] = normalize(vec3(-1,0,-1));



             for(int k=0; k<5; k++) {
                float diff = max(dot(n, lightDirs[k]), 0.0);
                accum += lightColors[k] * diff * 0.4;
             }
             
             // Add rim
             float rim = 1.0 - max(dot(viewDir, n), 0.0);
             accum += vec3(0.5) * pow(rim, 3.0);

             gl_FragColor = vec4(baseColor * accum, 1.0);
             return;
        }
        t += d;
        if(t > 20.0) break;
    }
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
