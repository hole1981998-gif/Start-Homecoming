import * as THREE from 'three';
import { createCar4Art } from '../src/art/car4';
import { createVehicleArt } from '../src/art/vehicle-catalog';
import { createPersonArt } from '../src/art/people';
import { createSurfaceHazardArt } from '../src/art/hazards';
import { createSceneryCluster } from '../src/art/scenery';
import { createRoadTileArt } from '../src/art/road-kit';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setClearColor('#66757a');
const scene = new THREE.Scene(); scene.background = new THREE.Color('#66757a');
scene.add(new THREE.HemisphereLight('#fff6df', '#314751', 2.3));
const sun = new THREE.DirectionalLight('#fff0cf', 2.0); sun.position.set(-8, 12, 14); scene.add(sun);
const fill = new THREE.DirectionalLight('#9ebec0', .9); fill.position.set(10, 7, -8); scene.add(fill);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120),
  new THREE.MeshLambertMaterial({ color: '#59685e' }));
ground.rotation.x = -Math.PI / 2; ground.position.set(0, -.12, 17); scene.add(ground);
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
for (const [kind, side, z] of [['city', -1, 17], ['trees', 1, 17]] as const) {
  const art = createSceneryCluster(kind, side); art.root.position.z = z; scene.add(art.root);
}
const camera = new THREE.PerspectiveCamera(42, 9 / 16, .1, 140);
camera.position.set(0, 10.5, -14.5); camera.lookAt(0, 0, 19);
function draw() {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.render(scene, camera);
  document.getElementById('metrics')!.textContent =
    `Cảnh tĩnh: ${renderer.info.render.calls} draw calls · ${renderer.info.render.triangles} tam giác`;
}
new ResizeObserver(draw).observe(canvas); draw();
