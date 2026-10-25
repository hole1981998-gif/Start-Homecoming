import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createVehicleArt } from '../src/art/vehicle-catalog';
import { createPersonArt, mountPersonOnSeat } from '../src/art/people';
import { createSurfaceHazardArt } from '../src/art/hazards';
import { createSceneryCluster, optimizeNearScenery } from '../src/art/scenery';
import { createRoadTileArt } from '../src/art/road-kit';
import { createRainArt, createRainSplashArt } from '../src/art/weather';
import { balance } from '../src/config';
import { vehicles, type VehicleKind } from '../src/vehicles';
import type { LandscapeKind } from '../src/landscape';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .98;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
const scene = new THREE.Scene();
const sky = document.createElement('canvas'); sky.width = 512; sky.height = 256;
const skyContext = sky.getContext('2d')!;
const skyColor = skyContext.createLinearGradient(0, 0, 0, sky.height);
skyColor.addColorStop(0, '#4f7188');
skyColor.addColorStop(.58, '#7fa8b1');
skyColor.addColorStop(1, '#a9c6bf');
skyContext.fillStyle = skyColor; skyContext.fillRect(0, 0, sky.width, sky.height);
skyContext.filter = 'blur(11px)';
skyContext.fillStyle = 'rgba(43,87,104,.15)';
for (const [x, y, width, height] of [[64, 48, 163, 35], [260, 74, 175, 34],
  [467, 44, 144, 30]] as const) {
  skyContext.beginPath(); skyContext.ellipse(x, y, width, height, -.12, 0, Math.PI * 2);
  skyContext.fill();
}
skyContext.fillStyle = 'rgba(193,224,209,.10)';
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
scene.fog = new THREE.Fog('#8ab5bb', 36, 100);
scene.add(new THREE.HemisphereLight('#bcebf0', '#335e6a', 1.23));
scene.add(new THREE.AmbientLight('#86bfd0', .17));
const sun = new THREE.DirectionalLight('#ffd399', 2.18);
sun.position.set(19, 12, 20); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -34; sun.shadow.camera.right = 34;
sun.shadow.camera.top = 48; sun.shadow.camera.bottom = -32;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 105;
sun.shadow.bias = -.0004; sun.shadow.blurSamples = 16; sun.shadow.radius = 8; scene.add(sun);
const fill = new THREE.DirectionalLight('#80c2d2', .38); fill.position.set(-11, 8, -10); scene.add(fill);
const sunBreak = new THREE.SpotLight('#ffc17d', 1400, 65, Math.PI / 3, 1, 2);
sunBreak.position.set(-10, 22, 19);
sunBreak.target.position.set(0, 0, 24);
scene.add(sunBreak, sunBreak.target);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120),
  new THREE.MeshLambertMaterial({ color: '#719570' }));
ground.rotation.x = -Math.PI / 2; ground.position.set(0, -.24, 17); ground.receiveShadow = true; scene.add(ground);
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
      transparent: true, opacity: .46, depthWrite: false }));
  cloudShadow.name = `cloud_shadow_${z}`;
  cloudShadow.rotation.x = -Math.PI / 2;
  cloudShadow.position.set(x, .027, z);
  scene.add(cloudShadow);
}
for (const [name, corners] of [
  ['foreground', [[6.6, -4], [6.6, 1], [-6.4, -13], [-6.4, -18]]],
  ['midroad', [[6.6, 27], [6.6, 31], [-6.4, 17], [-6.4, 13]]],
] as const) {
  const positions: number[] = [];
  for (const i of [0, 1, 2, 0, 2, 3])
    positions.push(corners[i][0], .029, corners[i][1]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  const shade = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    color: '#163a48', transparent: true, opacity: .43, depthWrite: false,
    side: THREE.DoubleSide,
  }));
  shade.name = `long_shadow_${name}`;
  scene.add(shade);
}
for (let z = -34; z <= 106; z += 4) {
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
let mountedDriver: ReturnType<typeof createPersonArt> | null = null;
function createPreviewPlayer(kind: VehicleKind) {
  const art = createVehicleArt(kind);
  if (kind === 'motorcycle' || kind === 'motorbike' || kind === 'tricycle') {
    const seat = art.root.getObjectByName('seat_driver');
    if (seat) {
      mountedDriver = createPersonArt('driver');
      mountPersonOnSeat(mountedDriver, seat, 'riding');
    }
  }
  art.root.position.set(0, .02, 1.5);
  art.root.traverse(object => {
    if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; }
  });
  return art;
}
let player = createPreviewPlayer('car4'); scene.add(player.root);
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
const cityRoot = new THREE.Group(); scene.add(cityRoot);
for (const [side, z, variantSeed] of [[-1, 17, 0], [1, 17, 1]] as const) {
  const art = createSceneryCluster('city', side, 'near', variantSeed);
  optimizeNearScenery(art.root);
  art.root.position.z = z; cityRoot.add(art.root);
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
  cityRoot.add(nextDistrict.root);
}
const biomeKind = document.getElementById('biomeKind') as HTMLSelectElement;
const alternateBiome = new THREE.Group(); scene.add(alternateBiome);
let alternateArts: ReturnType<typeof createSceneryCluster>[] = [];
const importedCityBuildings: THREE.Object3D[] = [];
biomeKind.addEventListener('change', () => {
  const kind = biomeKind.value as LandscapeKind;
  cityRoot.visible = kind === 'city';
  for (const building of importedCityBuildings) building.visible = kind === 'city';
  for (const art of alternateArts) { art.root.removeFromParent(); art.dispose(); }
  alternateArts = [];
  if (kind !== 'city') for (const [side, seed] of [[-1, 0], [1, 1]] as const) {
    for (const [lod, z, seedOffset] of [['near', 17, 0], ['far', 83, 2]] as const) {
      const art = createSceneryCluster(kind, side, lod, seed + seedOffset);
      if (lod === 'near') optimizeNearScenery(art.root);
      art.root.position.z = z;
      art.root.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = object.position.y > .05;
          object.receiveShadow = true;
        }
      });
      alternateBiome.add(art.root);
      alternateArts.push(art);
    }
  }
  draw();
});
scene.traverse(object => {
  if (object instanceof THREE.Mesh && object !== ground) {
    object.castShadow = object.position.y > .05;
    object.receiveShadow = true;
  }
});
const camera = new THREE.PerspectiveCamera(52, 9 / 16, .1, 140);
const cameraMode = document.getElementById('cameraMode') as HTMLSelectElement;
const vehicleKind = document.getElementById('vehicleKind') as HTMLSelectElement;
const selectedVehicle = () => vehicles[vehicleKind.value as VehicleKind];
const cameraExtra = () => Math.max(0, selectedVehicle().length - 3.5) * .9;
const showHud = document.getElementById('showHud') as HTMLInputElement;
const reviewHud = document.getElementById('reviewHud') as HTMLElement;
showHud.addEventListener('change', () => { reviewHud.hidden = !showHud.checked; draw(); });
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
    camera.position.set(0, 7.5 + cameraExtra() * .4, -11 - cameraExtra() + z);
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
vehicleKind.addEventListener('change', () => {
  mountedDriver?.dispose(); mountedDriver = null;
  player.root.removeFromParent(); player.dispose();
  player = createPreviewPlayer(vehicleKind.value as VehicleKind);
  scene.add(player.root);
  const vehicle = selectedVehicle();
  document.getElementById('reviewOccupants')!.textContent = `1/${vehicle.capacity}`;
  document.getElementById('reviewVehicleName')!.textContent = vehicle.name;
  document.getElementById('reviewFuel')!.textContent = `⛽ ${vehicle.fuelCapacity.toFixed(0)} L`;
  document.getElementById('reviewHp')!.textContent = `⚒ ${vehicle.durabilityCapacity.toFixed(0)} HP`;
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
  importedCityBuildings.push(gltf.scene);
  gltf.scene.visible = biomeKind.value === 'city';
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
  importedCityBuildings.push(gltf.scene);
  gltf.scene.visible = biomeKind.value === 'city';
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
  importedCityBuildings.push(gltf.scene);
  gltf.scene.visible = biomeKind.value === 'city';
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
  importedCityBuildings.push(gltf.scene);
  gltf.scene.visible = biomeKind.value === 'city';
  draw();
});
function draw() {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.render(scene, camera);
  if (!reviewHud.hidden) {
    document.getElementById('reviewDistance')!.textContent =
      String(Math.round(cameraMode.value === 'drive' ? driveDistance : 0));
    for (const [id, x, z] of [['cueWater', 3.2, 12], ['cuePothole', 0, 27]] as const) {
      const cue = document.getElementById(id)!;
      const projected = new THREE.Vector3(x, .8, z).project(camera);
      cue.hidden = projected.z < -1 || projected.z > 1 ||
        Math.abs(projected.x) > 1 || Math.abs(projected.y) > 1;
      cue.style.left = `${(projected.x + 1) * 50}%`;
      cue.style.top = `${(1 - projected.y) * 50}%`;
    }
  }
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
      camera.position.z = -11 - cameraExtra() + driveDistance;
      camera.lookAt(0, 0, 12 + driveDistance);
    }
    rain.update(timeMs / 1000, 0, 25 + driveDistance);
    splashes.update(timeMs / 1000, 0, 25 + driveDistance);
    water.setVisualTime?.(timeMs / 1000);
    for (const art of alternateArts) art.setVisualTime?.(timeMs / 1000);
    draw();
  }
  requestAnimationFrame(animateRain);
}
requestAnimationFrame(animateRain);
