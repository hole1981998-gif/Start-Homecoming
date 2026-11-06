import * as THREE from 'three';

/** A lit shell follows the actual visible body, wheels and rider geometry. */
export function createStarAura() {
  const root = new THREE.Group(); root.name = 'player_star_silhouette';
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } }, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
    vertexShader: `varying vec3 vNormal; varying vec3 vView; varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vec3 viewNormal = normalize(normalMatrix * normal);
        vec3 outward = normalize(viewNormal * mat3(viewMatrix));
        world.xyz += outward * .035;
        vec4 view = viewMatrix * world;
        vNormal = viewNormal;
        vView = -view.xyz; vWorld = world.xyz;
        gl_Position = projectionMatrix * view;
      }`,
    fragmentShader: `uniform float uTime;
      varying vec3 vNormal; varying vec3 vView; varying vec3 vWorld;
      void main() {
        float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 1.6);
        float sweep = .5 + .5 * sin(vWorld.y * 8.0 + vWorld.x * 2.0 - uTime * 5.0);
        vec3 hue = .65 + .35 * cos(vec3(0.0, 2.1, 4.2) + vWorld.y * 2.3 - uTime * 2.0);
        gl_FragColor = vec4(hue * 1.6, (.10 + rim * .68) * (.65 + sweep * .35));
      }`,
  });
  const shells = new Map<THREE.Mesh, THREE.Mesh>();
  const update = (sources: readonly THREE.Object3D[], active: boolean, seconds: number, reduced = false) => {
    root.visible = active;
    if (!active) return;
    material.uniforms.uTime.value = seconds * (reduced ? .35 : 1);
    const live = new Set<THREE.Mesh>();
    for (const source of sources) {
      source.updateWorldMatrix(true, true);
      source.traverseVisible(object => {
        if (!(object instanceof THREE.Mesh) || object instanceof THREE.InstancedMesh || object.userData.noStarAura) return;
        live.add(object);
        let shell = shells.get(object);
        if (!shell) {
          shell = new THREE.Mesh(object.geometry, material);
          shell.matrixAutoUpdate = false; shell.frustumCulled = false;
          shell.name = `star_shell_${object.name}`; root.add(shell); shells.set(object, shell);
        }
        shell.matrix.copy(object.matrixWorld);
      });
    }
    for (const [source, shell] of shells) if (!live.has(source)) {
      root.remove(shell); shells.delete(source);
    }
  };
  return { root, update, dispose: () => { shells.clear(); root.clear(); material.dispose(); } };
}
