import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createCar4Art } from '../src/art/car4';
import { createVehicleArt } from '../src/art/vehicle-catalog';
import { createPersonArt } from '../src/art/people';
import { createSurfaceHazardArt } from '../src/art/hazards';
import { createSceneryCluster } from '../src/art/scenery';
import { createRoadTileArt } from '../src/art/road-kit';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#78a7ad');
scene.add(new THREE.HemisphereLight('#fff0d2', '#315a5c', 1.25));
const sun = new THREE.DirectionalLight('#ffe5bf', 2.0);
sun.position.set(-12, 19, 10); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -34; sun.shadow.camera.right = 34;
sun.shadow.camera.top = 48; sun.shadow.camera.bottom = -32;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 85;
sun.shadow.bias = -.0004; scene.add(sun);
const fill = new THREE.DirectionalLight('#a9d8d4', .68); fill.position.set(11, 8, -10); scene.add(fill);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120),
  new THREE.MeshLambertMaterial({ color: '#719570' }));
ground.rotation.x = -Math.PI / 2; ground.position.set(0, -.12, 17); ground.receiveShadow = true; scene.add(ground);
for (let z = -6; z <= 42; z += 4) {
  const tile = createRoadTileArt(z < -2 ? 'near' : 'far'); tile.root.position.z = z; scene.add(tile.root);
}
const player = createCar4Art(); player.root.position.set(0, .02, 1.5); scene.add(player.root);
const traffic = createVehicleArt('car7', 'traffic', 'near', '#a88772');
traffic.root.position.set(-3.2, .02, 21); traffic.root.rotation.y = Math.PI; scene.add(traffic.root);
const bike = createVehicleArt('motorcycle', 'traffic', 'far', '#c5a36c');
bike.root.position.set(3.2, .02, 31); scene.add(bike.root);
const water = createSurfaceHazardArt('water', 3.2, 7); water.root.position.set(3.2, .025, 12); scene.add(water.root);
const pothole = createSurfaceHazardArt('pothole', 2.3, 4); pothole.root.position.set(0, .035, 27); scene.add(pothole.root);
const waiting = createPersonArt('commuter'); waiting.setPose('hail', .25);
waiting.root.position.set(-6.6, 0, 12); waiting.root.rotation.y = Math.PI / 2; scene.add(waiting.root);
let nativeShop: THREE.Object3D | undefined;
let nativeMidrise: THREE.Object3D | undefined;
for (const [side, z, variantSeed] of [[-1, 17, 0], [1, 17, 1]] as const) {
  const art = createSceneryCluster('city', side, 'near', variantSeed);
  art.root.position.z = z; scene.add(art.root);
  if (side === -1) nativeShop = art.root.getObjectByName('porch_house');
  if (side === 1) nativeMidrise = art.root.getObjectByName('midrise_apartments');
}
scene.traverse(object => {
  if (object instanceof THREE.Mesh && object !== ground) {
    object.castShadow = object.position.y > .05;
    object.receiveShadow = true;
  }
});
const camera = new THREE.PerspectiveCamera(52, 9 / 16, .1, 140);
const cameraMode = document.getElementById('cameraMode') as HTMLSelectElement;
function setCamera() {
  if (cameraMode.value === 'study') {
    camera.fov = 49;
    camera.position.set(0, 16, -13);
    camera.lookAt(0, 0, 13);
  } else {
    camera.fov = 52;
    camera.position.set(0, 7.5, -11);
    camera.lookAt(0, 0, 12);
  }
  camera.updateProjectionMatrix();
  draw();
}
cameraMode.addEventListener('change', setCamera);
const shopUrl = new URL('../assets/art/roadside-shop.glb', import.meta.url).href;
new GLTFLoader().load(shopUrl, gltf => {
  nativeShop!.visible = false;
  gltf.scene.position.set(-8.48, 0, 20);
  gltf.scene.rotation.y = Math.PI / 2;
  gltf.scene.traverse(object => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  scene.add(gltf.scene);
  draw();
});
const midriseUrl = new URL('../assets/art/roadside-midrise.glb', import.meta.url).href;
new GLTFLoader().load(midriseUrl, gltf => {
  if (!nativeMidrise) return;
  const placement = nativeMidrise.getWorldPosition(new THREE.Vector3());
  nativeMidrise.visible = false;
  gltf.scene.position.copy(placement);
  gltf.scene.rotation.y = -Math.PI / 2;
  gltf.scene.traverse(object => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  scene.add(gltf.scene);
  draw();
});
function draw() {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.render(scene, camera);
  document.getElementById('metrics')!.textContent =
    `Cảnh tĩnh: ${renderer.info.render.calls} draw calls · ${renderer.info.render.triangles} tam giác`;
}
new ResizeObserver(draw).observe(canvas); setCamera();
