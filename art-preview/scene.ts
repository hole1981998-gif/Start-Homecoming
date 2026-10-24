import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createCar4Art } from '../src/art/car4';
import { createVehicleArt } from '../src/art/vehicle-catalog';
import { createPersonArt } from '../src/art/people';
import { createSurfaceHazardArt } from '../src/art/hazards';
import { createSceneryCluster, optimizeNearScenery } from '../src/art/scenery';
import { createRoadTileArt } from '../src/art/road-kit';
import { createRainArt, createRainSplashArt } from '../src/art/weather';
import { balance } from '../src/config';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
const scene = new THREE.Scene();
const sky = document.createElement('canvas'); sky.width = 512; sky.height = 256;
const skyContext = sky.getContext('2d')!;
const skyColor = skyContext.createLinearGradient(0, 0, 0, sky.height);
skyColor.addColorStop(0, '#56828c');
skyColor.addColorStop(.55, '#8eafb0');
skyColor.addColorStop(1, '#d5c9a9');
skyContext.fillStyle = skyColor; skyContext.fillRect(0, 0, sky.width, sky.height);
skyContext.filter = 'blur(11px)';
skyContext.fillStyle = 'rgba(35,59,69,.43)';
for (const [x, y, width, height] of [[64, 48, 163, 35], [260, 74, 175, 34],
  [467, 44, 144, 30]] as const) {
  skyContext.beginPath(); skyContext.ellipse(x, y, width, height, -.12, 0, Math.PI * 2);
  skyContext.fill();
}
skyContext.fillStyle = 'rgba(234,213,172,.20)';
for (const [x, y, width, height] of [[108, 112, 145, 12], [367, 136, 199, 14]] as const) {
  skyContext.beginPath(); skyContext.ellipse(x, y, width, height, -.04, 0, Math.PI * 2);
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
new THREE.TextureLoader().load(new URL('../assets/art/storm-sky-study.png', import.meta.url).href,
  texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.mapping = THREE.UVMapping;
    texture.repeat.set(.2, .52);
    texture.offset.set(.50, .035);
    scene.background = texture;
    draw();
  });
scene.fog = new THREE.Fog('#9eada7', 104, 156);
scene.add(new THREE.HemisphereLight('#fff0d2', '#45666b', 1.12));
scene.add(new THREE.AmbientLight('#cde1d7', .16));
const sun = new THREE.DirectionalLight('#ffe5bf', 2.08);
sun.position.set(-12, 19, 10); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -34; sun.shadow.camera.right = 34;
sun.shadow.camera.top = 48; sun.shadow.camera.bottom = -32;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 85;
sun.shadow.bias = -.0004; sun.shadow.blurSamples = 16; sun.shadow.radius = 8; scene.add(sun);
const fill = new THREE.DirectionalLight('#a9d8d4', .42); fill.position.set(11, 8, -10); scene.add(fill);
const sunBreak = new THREE.SpotLight('#ffdfaa', 2400, 65, Math.PI / 3, 1, 2);
sunBreak.position.set(-10, 22, 19);
sunBreak.target.position.set(0, 0, 24);
scene.add(sunBreak, sunBreak.target);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120),
  new THREE.MeshLambertMaterial({ color: '#719570' }));
ground.rotation.x = -Math.PI / 2; ground.position.set(0, -.12, 17); ground.receiveShadow = true; scene.add(ground);
const shadowCanvas = document.createElement('canvas');
shadowCanvas.width = 128; shadowCanvas.height = 128;
const shadowContext = shadowCanvas.getContext('2d')!;
const shadowPixels = shadowContext.createImageData(128, 128);
for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
  const nx = (x - 64) / 64, ny = (y - 64) / 64;
  const blob = (cx: number, cy: number, rx: number, ry: number) =>
    Math.exp(-3.5 * (((nx - cx) / rx) ** 2 + ((ny - cy) / ry) ** 2));
  const shape = .81 * blob(-.32, -.14, .60, .64) +
    .83 * blob(.17, .09, .68, .56) + .55 * blob(.49, -.24, .38, .43);
  const waviness = .88 + .12 * Math.sin(x * .13 + Math.sin(y * .09) * 2.1);
  const density = Math.min(1, shape * waviness);
  const index = (y * 128 + x) * 4;
  shadowPixels.data[index] = shadowPixels.data[index + 1] =
    shadowPixels.data[index + 2] = Math.round(density * 255);
  shadowPixels.data[index + 3] = 255;
}
shadowContext.putImageData(shadowPixels, 0, 0);
const shadowMap = new THREE.CanvasTexture(shadowCanvas);
for (const [x, z, width, length] of [[-2, 36, 29, 21], [4, 77, 25, 16]] as const) {
  const cloudShadow = new THREE.Mesh(new THREE.PlaneGeometry(width, length),
    new THREE.MeshBasicMaterial({ color: '#26434b', alphaMap: shadowMap,
      transparent: true, opacity: .34, depthWrite: false }));
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
const splashes = createRainSplashArt(17);
splashes.setIntensity(.55);
scene.add(splashes.root);
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
let nativeSkyline: THREE.Object3D | undefined;
for (const [side, z, variantSeed] of [[-1, 17, 0], [1, 17, 1]] as const) {
  const art = createSceneryCluster('city', side, 'near', variantSeed);
  optimizeNearScenery(art.root);
  art.root.position.z = z; scene.add(art.root);
  if (side === -1) {
    nativeShop = art.root.getObjectByName('porch_house');
    nativeSkyline = art.root.getObjectByName('corner_shop');
  }
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
let driveDistance = 0;
let lastDriveFrame = 0;
const driveFrames: number[] = [];
function setCamera() {
  if (cameraMode.value === 'study') {
    camera.fov = 49;
    camera.position.set(0, 16, -13);
    camera.lookAt(0, 0, 13);
  } else {
    camera.fov = 52;
    const z = cameraMode.value === 'drive' ? driveDistance : 0;
    player.root.position.z = 1.5 + z;
    camera.position.set(0, 7.5, -11 + z);
    camera.lookAt(0, 0, 12 + z);
  }
  camera.updateProjectionMatrix();
  draw();
}
cameraMode.addEventListener('change', () => {
  driveDistance = 0;
  lastDriveFrame = 0;
  driveFrames.length = 0;
  player.root.position.z = 1.5;
  setCamera();
});
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
const skylineUrl = new URL('../assets/art/skyline-shophouse.glb', import.meta.url).href;
new GLTFLoader().load(skylineUrl, gltf => {
  if (!nativeSkyline) return;
  const placement = nativeSkyline.getWorldPosition(new THREE.Vector3());
  gltf.scene.position.copy(placement);
  gltf.scene.position.x -= 1.5;
  gltf.scene.position.z += 27;
  gltf.scene.rotation.y = Math.PI / 2;
  const bounds = new THREE.Box3().setFromObject(gltf.scene);
  if (bounds.max.x >= -balance.laneWidth * balance.laneCount / 2) return;
  nativeSkyline.visible = false;
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
  const frameP95 = driveFrames.length >= 30 ?
    [...driveFrames].sort((a, b) => a - b)[Math.floor(driveFrames.length * .95)] : null;
  document.getElementById('metrics')!.textContent =
    `${cameraMode.value === 'drive' ? 'Preview chuyển động' : 'Cảnh tĩnh'}: ` +
    `${renderer.info.render.calls} draw calls · ${renderer.info.render.triangles} tam giác` +
    (frameP95 === null || cameraMode.value !== 'drive' ? '' : ` · frame P95 ${frameP95.toFixed(1)} ms (máy hiện tại)`);
}
new ResizeObserver(draw).observe(canvas); setCamera();
let lastRainFrame = 0;
function animateRain(timeMs: number) {
  const driving = cameraMode.value === 'drive';
  if (driving && lastDriveFrame) {
    const frame = timeMs - lastDriveFrame;
    if (frame > 0 && frame < 100) {
      driveFrames.push(frame);
      if (driveFrames.length > 120) driveFrames.shift();
      driveDistance = (driveDistance + frame * .005) % 28;
    }
  }
  lastDriveFrame = driving ? timeMs : 0;
  if (driving || timeMs - lastRainFrame >= 33) {
    lastRainFrame = timeMs;
    if (driving) {
      player.root.position.z = 1.5 + driveDistance;
      camera.position.z = -11 + driveDistance;
      camera.lookAt(0, 0, 12 + driveDistance);
    }
    rain.update(timeMs / 1000, 0, 25 + driveDistance);
    splashes.update(timeMs / 1000, 0, 25 + driveDistance);
    water.setVisualTime?.(timeMs / 1000);
    draw();
  }
  requestAnimationFrame(animateRain);
}
requestAnimationFrame(animateRain);
