import * as THREE from 'three';

/** Bounded soft headlight ground washes; one draw, no shadow lights or gameplay rays. */
export function createVehicleLightBeams(capacity = 64) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -.3, 0, 0, .3, 0, 0, -1, 0, 1, 1, 0, 1,
  ], 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 1, 1], 2));
  geometry.setIndex([0, 2, 1, 1, 2, 3]);
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; vec4 p = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          p = instanceMatrix * p;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * p;
      }`,
    fragmentShader: `varying vec2 vUv;
      void main() {
        float side = smoothstep(0.0, .25, vUv.x) * (1.0 - smoothstep(.75, 1.0, vUv.x));
        float fade = pow(1.0 - vUv.y, 1.8) * smoothstep(0.0, .12, vUv.y);
        gl_FragColor = vec4(.95, .86, .60, side * fade * .28);
      }`,
  });
  const root = new THREE.InstancedMesh(geometry, material, capacity);
  root.name = 'vehicle_headlight_ground_washes'; root.frustumCulled = false; root.count = 0;
  const dummy = new THREE.Object3D();
  const reset = () => { root.count = 0; };
  const add = (position: THREE.Vector3, direction: THREE.Vector3, width = 1, length = 6) => {
    if (root.count >= capacity) return;
    dummy.position.set(position.x, .10, position.z);
    dummy.rotation.set(0, Math.atan2(direction.x, direction.z), 0);
    dummy.scale.set(width, 1, length); dummy.updateMatrix();
    root.setMatrixAt(root.count++, dummy.matrix); root.instanceMatrix.needsUpdate = true;
  };
  return { root, add, reset, dispose: () => { geometry.dispose(); material.dispose(); } };
}
