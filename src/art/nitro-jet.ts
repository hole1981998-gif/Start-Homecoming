import * as THREE from 'three';

/** Continuous exhaust flame stays attached while detached smoke trails behind. */
export function createNitroJet() {
  const root = new THREE.Group(); root.name = 'nitro_exhaust_flame';
  root.userData.noStarAura = true;
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } }, transparent: true, depthWrite: false,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uTime; varying vec2 vUv;
      void main() {
        float flicker = .8 + .2 * sin(vUv.y * 25.0 - uTime * 18.0 + vUv.x * 6.28);
        vec3 color = mix(vec3(.14, .65, 1.5), vec3(1.7, .65, .12), smoothstep(.3, .95, vUv.y));
        gl_FragColor = vec4(color * flicker, (.35 + .55 * sin(vUv.y * 3.14159)) * flicker);
      }`,
  });
  const geometry = new THREE.ConeGeometry(.22, 1.3, 9, 4, true);
  geometry.rotateX(-Math.PI / 2); geometry.translate(0, 0, -.65);
  const flame = new THREE.Mesh(geometry, material); root.add(flame);
  root.visible = false;
  const update = (socket: THREE.Object3D, active: boolean, seconds: number, reduced: boolean) => {
    root.visible = active;
    if (!active) return;
    socket.updateWorldMatrix(true, false);
    socket.getWorldPosition(root.position); socket.getWorldQuaternion(root.quaternion);
    root.position.y += .22;
    material.uniforms.uTime.value = seconds * (reduced ? .35 : 1);
    flame.scale.set(1, 1, 1 + Math.sin(seconds * (reduced ? 3 : 19)) * .13);
  };
  return { root, update, dispose: () => { geometry.dispose(); material.dispose(); } };
}
