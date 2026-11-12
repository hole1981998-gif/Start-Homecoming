import * as THREE from 'three';

/** Decorative service markings and one inexpensive alternating roof light. */
export function attachAmbulanceService(parent: THREE.Object3D) {
  const root = new THREE.Group(); root.name = 'ambulance_service'; parent.add(root);
  const redPaint = new THREE.MeshStandardMaterial({ color: '#d95e54', roughness: .58 });
  const red = new THREE.MeshStandardMaterial({ color: '#e0524d', roughness: .42,
    emissive: '#ff3b35', emissiveIntensity: .15 });
  const blue = new THREE.MeshStandardMaterial({ color: '#68b9ef', roughness: .42,
    emissive: '#4daaff', emissiveIntensity: .15 });
  const dark = new THREE.MeshStandardMaterial({ color: '#34515d', roughness: .7 });
  const addBox = (name: string, dims: [number, number, number],
    position: [number, number, number], material: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dims), material);
    mesh.name = name; mesh.position.set(...position); root.add(mesh); return mesh;
  };
  addBox('roof_beacon_base', [.82, .08, .38], [0, 1.94, .24], dark);
  addBox('beacon_red', [.31, .19, .32], [-.22, 2.08, .24], red);
  addBox('beacon_blue', [.31, .19, .32], [.22, 2.08, .24], blue);
  for (const side of [-1, 1]) {
    addBox(`medical_side_bar_${side}`, [.025, .13, 1.17],
      [side * 1.042, 1.02, -.48], redPaint);
    addBox(`cross_side_vertical_${side}`, [.026, .36, .13],
      [side * 1.049, 1.12, -.95], redPaint);
    addBox(`cross_side_horizontal_${side}`, [.026, .11, .36],
      [side * 1.052, 1.12, -.95], redPaint);
  }
  addBox('rear_medical_vertical', [.12, .32, .027], [0, 1.02, -2.39], redPaint);
  addBox('rear_medical_horizontal', [.31, .10, .028], [0, 1.02, -2.395], redPaint);
  const wash = new THREE.PointLight('#ff4b40', 1.8, 5, 2);
  wash.name = 'ambulance_beacon_wash'; wash.position.set(-.22, 2.25, .24); root.add(wash);
  const setVisualTime = (activeSeconds: number) => {
    const redOn = Math.floor(Math.max(0, activeSeconds) * 5) % 2 === 0;
    red.emissiveIntensity = redOn ? 2.7 : .08;
    blue.emissiveIntensity = redOn ? .08 : 2.7;
    wash.color.set(redOn ? '#ff4b40' : '#4daaff');
    wash.position.x = redOn ? -.22 : .22;
  };
  setVisualTime(0);
  return { root, setVisualTime };
}
