import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createCar4Art } from '../src/art/car4';
import { createVehicleArt } from '../src/art/vehicle-catalog';
import { createPersonArt } from '../src/art/people';
import { createSurfaceHazardArt } from '../src/art/hazards';
import { createSceneryCluster } from '../src/art/scenery';
import { createRoadTileArt } from '../src/art/road-kit';
import { createRainArt } from '../src/art/weather';
import { balance } from '../src/config';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const sky = document.createElement('canvas'); sky.width = 512; sky.height = 256;
const skyContext = sky.getContext('2d')!;
const skyColor = skyContext.createLinearGradient(0, 0, 0, sky.height);
skyColor.addColorStop(0, '#56828c');
skyColor.addColorStop(.55, '#8eafb0');
skyColor.addColorStop(1, '#d5c9a9');
skyContext.fillStyle = skyColor; skyContext.fillRect(0, 0, sky.width, sky.height);
skyContext.filter = 'blur(17px)';
skyContext.fillStyle = 'rgba(42,70,76,.24)';
for (const [x, y, width, height] of [[80, 42, 134, 32], [325, 58, 163, 36],
  [470, 25, 111, 25]] as const) {
  skyContext.beginPath(); skyContext.ellipse(x, y, width, height, -.12, 0, Math.PI * 2);
  skyContext.fill();
}
skyContext.filter = 'none';
const skyTexture = new THREE.CanvasTexture(sky);
skyTexture.colorSpace = THREE.SRGBColorSpace;
scene.background = skyTexture;
const skyEnvironment = skyTexture.clone();
skyEnvironment.mapping = THREE.EquirectangularReflectionMapping;
skyEnvironment.needsUpdate = true;
scene.environment = skyEnvironment;
scene.environmentIntensity = .12;
scene.fog = new THREE.Fog('#9eada7', 104, 156);
scene.add(new THREE.HemisphereLight('#fff0d2', '#426c6c', 1.42));
const sun = new THREE.DirectionalLight('#ffe5bf', 1.74);
sun.position.set(-12, 19, 10); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -34; sun.shadow.camera.right = 34;
sun.shadow.camera.top = 48; sun.shadow.camera.bottom = -32;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 85;
sun.shadow.bias = -.0004; scene.add(sun);
const fill = new THREE.DirectionalLight('#a9d8d4', .78); fill.position.set(11, 8, -10); scene.add(fill);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120),
  new THREE.MeshLambertMaterial({ color: '#719570' }));
ground.rotation.x = -Math.PI / 2; ground.position.set(0, -.12, 17); ground.receiveShadow = true; scene.add(ground);
const shadowCanvas = document.createElement('canvas');
shadowCanvas.width = 128; shadowCanvas.height = 128;
const shadowContext = shadowCanvas.getContext('2d')!;
const cloudFade = shadowContext.createRadialGradient(58, 66, 7, 64, 64, 62);
cloudFade.addColorStop(0, 'rgba(255,255,255,.88)');
cloudFade.addColorStop(.50, 'rgba(255,255,255,.52)');
cloudFade.addColorStop(1, 'rgba(255,255,255,0)');
shadowContext.fillStyle = cloudFade;
shadowContext.fillRect(0, 0, 128, 128);
const shadowMap = new THREE.CanvasTexture(shadowCanvas);
for (const [x, z, width, length] of [[-2, 37, 26, 14], [4, 72, 21, 11]] as const) {
  const cloudShadow = new THREE.Mesh(new THREE.PlaneGeometry(width, length),
    new THREE.MeshBasicMaterial({ color: '#26434b', alphaMap: shadowMap,
      transparent: true, opacity: .20, depthWrite: false }));
  cloudShadow.name = `cloud_shadow_${z}`;
  cloudShadow.rotation.x = -Math.PI / 2;
  cloudShadow.position.set(x, .027, z);
  scene.add(cloudShadow);
}
for (let z = -6; z <= 106; z += 4) {
  const tile = createRoadTileArt(z < -2 ? 'near' : 'far');
  tile.setWetness(.70);
  tile.root.position.z = z; scene.add(tile.root);
}
const rain = createRainArt(17);
rain.setIntensity(.42);
scene.add(rain.root);
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
let nativeMarket: THREE.Object3D | undefined;
for (const [side, z, variantSeed] of [[-1, 17, 0], [1, 17, 1]] as const) {
  const art = createSceneryCluster('city', side, 'near', variantSeed);
  art.root.position.z = z; scene.add(art.root);
  if (side === -1) nativeShop = art.root.getObjectByName('porch_house');
  if (side === 1) {
    nativeMidrise = art.root.getObjectByName('midrise_apartments');
    nativeMarket = art.root.getObjectByName('wide_storefront');
  }
  const nextDistrict = createSceneryCluster('city', side, 'far', variantSeed + 2);
  nextDistrict.root.position.z = z + 66;
  scene.add(nextDistrict.root);
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
const marketUrl = new URL('../assets/art/corner-market.glb', import.meta.url).href;
new GLTFLoader().load(marketUrl, gltf => {
  if (!nativeMarket) return;
  const placement = nativeMarket.getWorldPosition(new THREE.Vector3());
  gltf.scene.position.copy(placement);
  gltf.scene.position.x += 1.45;
  gltf.scene.rotation.y = -Math.PI / 2;
  const bounds = new THREE.Box3().setFromObject(gltf.scene);
  if (bounds.min.x <= balance.laneWidth * balance.laneCount / 2) return;
  nativeMarket.visible = false;
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
let lastRainFrame = 0;
function animateRain(timeMs: number) {
  if (timeMs - lastRainFrame >= 33) {
    lastRainFrame = timeMs;
    rain.update(timeMs / 1000, 0, 25);
    water.setVisualTime?.(timeMs / 1000);
    draw();
  }
  requestAnimationFrame(animateRain);
}
requestAnimationFrame(animateRain);
