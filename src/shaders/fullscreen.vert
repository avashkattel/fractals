varying vec2 vUv;

void main() {
  vUv = uv;
  // Ignore model/view/projection matrices
  // Output a fullscreen quad (assuming geometry is [-1, 1] or similar)
  // If input geometry is standard Plane (1x1), position is -0.5 to 0.5
  // We want to fill clip space -1.0 to 1.0
  gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
}
