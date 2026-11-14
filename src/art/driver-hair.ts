import * as THREE from 'three';

/** A partial, enlarged copy of the driver's head forms hair at the back and temples. */
export function addDriverBackHair(head: THREE.Object3D, centerY = 0, scale = 1): void {
  const face = head.children.find(node => node instanceof THREE.Mesh && node.name.startsWith('head'));
  if (!(face instanceof THREE.Mesh)) return;
  const source = face.geometry.index ? face.geometry.toNonIndexed() : face.geometry.clone();
  const positions = source.getAttribute('position');
  const hairPositions: number[] = [];
  for (let i = 0; i < positions.count; i += 3) {
    const y = (positions.getY(i) + positions.getY(i + 1) + positions.getY(i + 2)) / 3;
    const z = (positions.getZ(i) + positions.getZ(i + 1) + positions.getZ(i + 2)) / 3;
    // Preserve the scalp, rear and both temples; leave the face and lower cheeks open.
    if (y < -.13 || (z > .07 && y < .12)) continue;
    for (let j = i; j < i + 3; j++) {
      const vertexY = positions.getY(j);
      const napeTaper = THREE.MathUtils.clamp((-vertexY - .03) / .10, 0, 1);
      const width = 1 - napeTaper * .09;
      hairPositions.push(positions.getX(j) * width, vertexY, positions.getZ(j) * width);
    }
  }
  source.dispose();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(hairPositions, 3));
  geometry.computeVertexNormals();
  const dark = new THREE.MeshStandardMaterial({ color: '#181b1d', roughness: .94, flatShading: true,
    side: THREE.DoubleSide });
  const hair = new THREE.Group();
  hair.name = 'driver_back_hair';
  hair.position.y = centerY;
  hair.scale.setScalar(scale);
  const crown = new THREE.Mesh(geometry, dark);
  crown.name = 'back_hair_crown';
  crown.position.copy(face.position);
  crown.position.y -= centerY;
  crown.quaternion.copy(face.quaternion);
  crown.scale.copy(face.scale).multiplyScalar(1.18);
  hair.add(crown);
  for (const side of [-1, 1]) {
    const sideburn = new THREE.Mesh(new THREE.SphereGeometry(.052, 7, 6), dark);
    sideburn.name = `back_hair_sideburn_${side}`;
    sideburn.scale.set(.56, 1.15, .7);
    sideburn.position.set(side * .225, -.075, -.035);
    hair.add(sideburn);
  }
  head.add(hair);
}
