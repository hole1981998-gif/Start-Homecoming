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
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#84aeb0');
scene.add(new THREE.HemisphereLight('#ffefcd', '#466368', 1.3));
const sun = new THREE.DirectionalLight('#ffe0af', 2.0);
sun.position.set(-8, 17, 10); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -18; sun.shadow.camera.right = 18;
sun.shadow.camera.top = 18; sun.shadow.camera.bottom = -18;
sun.shadow.bias = -.0004; sun.shadow.normalBias = .025;
scene.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(35, 35),
  new THREE.MeshStandardMaterial({ color: '#77916b', roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
camera.position.set(12, 11, 13);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 4, 0); controls.enableDamping = true;
controls.minDistance = 8; controls.maxDistance = 40; controls.update();
let loaded = false;
const url = new URL('../assets/art/corner-market.glb', import.meta.url).href;
new GLTFLoader().load(url, gltf => {
  gltf.scene.traverse(object => {
    if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; }
  });
  scene.add(gltf.scene);
  const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
  metrics.textContent = `Model Blender: ${size.x.toFixed(2)} rộng × ${size.y.toFixed(2)} cao × ${size.z.toFixed(2)} sâu m · 12 cụm vật liệu`;
  loaded = true;
}, undefined, () => { metrics.textContent = 'Không tải được GLB.'; });
function draw() {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  renderer.setSize(Math.max(1, width), Math.max(1, height), false);
  camera.aspect = width / height; camera.updateProjectionMatrix();
}
new ResizeObserver(draw).observe(canvas); draw();
function frame() {
  controls.update(); renderer.render(scene, camera);
  if (loaded) metrics.dataset.drawCalls = String(renderer.info.render.calls);
  requestAnimationFrame(frame);
}
frame();
