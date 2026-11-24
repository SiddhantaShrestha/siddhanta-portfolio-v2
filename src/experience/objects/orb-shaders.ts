/**
 * GLSL for the AI orb. Three small materials, no textures:
 * - shell: fresnel glass with a soft highlight
 * - core: a slow swirl of cyan and violet light, built from sine layers
 * - halo: a radial glow on a camera-facing plane
 * Colors are passed as THREE.Color uniforms, which are already linear.
 */

const OUTPUT = /* glsl */ `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`;

export const SHELL_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

export const SHELL_FRAGMENT = /* glsl */ `
  uniform vec3 uTint;
  uniform vec3 uRim;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vView);
    float facing = clamp(dot(n, v), 0.0, 1.0);
    float fresnel = pow(1.0 - facing, 2.4);
    vec3 color = mix(uTint, uRim, fresnel);
    // Soft window highlight from the upper left of the view.
    vec3 lightDir = normalize(vec3(-0.45, 0.75, 0.5));
    float spec = pow(max(dot(reflect(-lightDir, n), v), 0.0), 60.0);
    color += vec3(0.9, 0.97, 1.0) * spec * 0.9;
    float alpha = clamp(0.05 + fresnel * 0.7 + spec * 0.8, 0.0, 1.0);
    gl_FragColor = vec4(color, alpha);
    ${OUTPUT}
  }
`;

export const CORE_VERTEX = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vPos = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

export const CORE_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uA;
  uniform vec3 uB;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec3 p = vPos * 24.0;
    float t = uTime;
    float w = sin(p.x * 2.1 + t * 0.7 + sin(p.y * 1.7 - t * 0.5) * 1.6);
    w += sin(p.y * 2.4 - t * 0.6 + sin(p.z * 1.9 + t * 0.4) * 1.4);
    w += sin(p.z * 2.2 + t * 0.5 + sin(p.x * 1.5 - t * 0.8) * 1.2);
    float swirl = smoothstep(-1.8, 1.8, w);
    float facing = clamp(dot(normalize(vNormal), normalize(vView)), 0.0, 1.0);
    float rim = pow(1.0 - facing, 2.0);
    // Dark base with bright veins, so the core has depth instead of a flat glow.
    // The core is drawn without tone mapping (it is a light source), so these
    // values are close to the final on-screen colors.
    vec3 color = mix(uA * 0.05, uB * 0.1, swirl);
    float vein = smoothstep(0.66, 0.95, swirl);
    color += mix(uA, uB, smoothstep(0.7, 1.0, swirl)) * vein * 0.9;
    color += uA * rim * 0.6;
    gl_FragColor = vec4(color, 1.0);
    ${OUTPUT}
  }
`;

export const HALO_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const HALO_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float glow = pow(clamp(1.0 - d, 0.0, 1.0), 2.6) * uStrength;
    gl_FragColor = vec4(uColor * glow, glow);
    ${OUTPUT}
  }
`;
