import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.getElementById('model') as HTMLCanvasElement;
const metrics = document.getElementById('metrics')!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#84aeb0');
scene.add(new THREE.HemisphereLight('#ffefcd', '#466368', 1.4));
const sun = new THREE.DirectionalLight('#ffe0af', 2.2);
sun.position.set(-7, 12, 8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -12; sun.shadow.camera.right = 12;
sun.shadow.camera.top = 12; sun.shadow.camera.bottom = -12;
scene.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({ color: '#77916b', roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const path = new THREE.Mesh(new THREE.BoxGeometry(6, .08, 3.0),
  new THREE.MeshStandardMaterial({ color: '#b49d7a', roughness: 1 }));
path.position.set(0, .01, 3.65); path.receiveShadow = true; scene.add(path);
const camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
camera.position.set(9.5, 8.3, 11.5);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 3, 0);
controls.enableDamping = true;
controls.minDistance = 7; controls.maxDistance = 30;
controls.update();
let loaded = false;
const url = new URL('../assets/art/roadside-shop.glb', import.meta.url).href;
new GLTFLoader().load(url, gltf => {
  gltf.scene.traverse(object => {
    if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; }
  });
  scene.add(gltf.scene);
  const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
  metrics.textContent = `Model Blender: ${size.x.toFixed(2)} rộng × ${size.y.toFixed(2)} cao × ${size.z.toFixed(2)} sâu m · 11 cụm vật liệu`;
  loaded = true;
}, undefined, () => { metrics.textContent = 'Không tải được GLB.'; });
function draw() {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  renderer.setSize(Math.max(1, width), Math.max(1, height), false);
  camera.aspect = width / height; camera.updateProjectionMatrix();
}
new ResizeObserver(draw).observe(canvas);
draw();
function frame() {
  controls.update();
  renderer.render(scene, camera);
  if (loaded) metrics.dataset.drawCalls = String(renderer.info.render.calls);
  requestAnimationFrame(frame);
}
frame();
