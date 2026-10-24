import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.getElementById('model') as HTMLCanvasElement;
const metrics = document.getElementById('metrics')!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#87aaad');
scene.add(new THREE.HemisphereLight('#ffefcd', '#537c83', 1.4));
const sun = new THREE.DirectionalLight('#ffe0ae', 2);
sun.position.set(-5, 10, 7); scene.add(sun);
const water = new THREE.Mesh(new THREE.PlaneGeometry(20, 20),
  new THREE.MeshPhysicalMaterial({ color: '#65a5a5', roughness: .32,
    clearcoat: .6, metalness: .03 }));
water.rotation.x = -Math.PI / 2; water.position.y = -.06; scene.add(water);
const camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
camera.position.set(4.2, 3.2, 5.4);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, .62, 0); controls.enableDamping = true;
controls.minDistance = 2.8; controls.maxDistance = 15; controls.update();
let loaded = false;
const url = new URL('../assets/art/coastal-fishing-boat.glb', import.meta.url).href;
new GLTFLoader().load(url, gltf => {
  gltf.scene.position.y = -.12;
  scene.add(gltf.scene);
  const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
  let meshes = 0;
  gltf.scene.traverse(object => { if (object instanceof THREE.Mesh) meshes++; });
  metrics.textContent = `Model Blender: ${size.x.toFixed(2)} rộng × ${size.y.toFixed(2)} cao × ${size.z.toFixed(2)} dài m · ${meshes} cụm mesh`;
  loaded = true;
}, undefined, () => { metrics.textContent = 'Không tải được GLB.'; });
function resize() {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  renderer.setSize(Math.max(1, width), Math.max(1, height), false);
  camera.aspect = width / height; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas); resize();
function frame() {
  controls.update(); renderer.render(scene, camera);
  if (loaded) metrics.dataset.drawCalls = String(renderer.info.render.calls);
  requestAnimationFrame(frame);
}
frame();
