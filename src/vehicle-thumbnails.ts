import * as THREE from 'three';
import { createVehicleArt } from './art/vehicle-catalog';
import { vehicles, type VehicleKind } from './vehicles';

export type VehicleThumbnailSources = Record<VehicleKind, string>;
let cached: VehicleThumbnailSources | undefined;

/** Render the actual player catalog once, while the shop has paused simulation.
 * Share one temporary WebGL context; retain only PNGs, not live scenes/meshes. */
export function vehicleThumbnailSources(): VehicleThumbnailSources {
  if (cached) return cached;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(360, 240, false); renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#fff6e5', '#607c80', 1.5));
  const key = new THREE.DirectionalLight('#fff4df', 2.6); key.position.set(-5,9,7); scene.add(key);
  const fill = new THREE.DirectionalLight('#cbe4e8', .8); fill.position.set(5,4,-3); scene.add(fill);
  const sources = {} as VehicleThumbnailSources;
  try {
    for (const kind of Object.keys(vehicles) as VehicleKind[]) {
      const art = createVehicleArt(kind, 'player', 'near');
      scene.add(art.root);
      try {
        art.root.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(art.root);
        const center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
        const diameter = size.length(), camera = new THREE.OrthographicCamera(-1,1,1,-1,.01,diameter*6);
        camera.position.copy(center).add(new THREE.Vector3(4,2.8,5).normalize().multiplyScalar(diameter*2));
        camera.lookAt(center); camera.updateMatrixWorld(true);
        const viewBox = new THREE.Box3();
        for (const x of [box.min.x,box.max.x]) for (const y of [box.min.y,box.max.y]) for (const z of [box.min.z,box.max.z]) {
          viewBox.expandByPoint(new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
        }
        const halfHeight = Math.max(viewBox.max.y-viewBox.min.y, (viewBox.max.x-viewBox.min.x)/1.5)*.56;
        camera.top = halfHeight; camera.bottom = -halfHeight;
        camera.left = -halfHeight*1.5; camera.right = halfHeight*1.5; camera.updateProjectionMatrix();
        renderer.render(scene,camera);
        sources[kind] = renderer.domElement.toDataURL('image/png');
      } finally { scene.remove(art.root); art.dispose(); }
    }
    cached = sources; return sources;
  } finally { renderer.dispose(); renderer.forceContextLoss(); }
}
