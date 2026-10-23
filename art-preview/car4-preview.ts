import * as THREE from 'three';
import { createCar4Art, type Car4Condition, type Car4Finish } from '../src/art/car4';

type ViewName = 'gameplay' | 'rear' | 'front' | 'side' | 'top';
const names: ViewName[] = ['gameplay', 'rear', 'front', 'side', 'top'];
const scenes = names.map(name => {
  const canvas = document.getElementById(name) as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(name === 'gameplay' ? '#516b72' : '#617278');
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#f6f5e9', '#43535b', 2.5));
  const sun = new THREE.DirectionalLight('#fff1d7', 2.2); sun.position.set(-4, 8, 7); scene.add(sun);
  const fill = new THREE.DirectionalLight('#91b0ba', 1.1); fill.position.set(5, 4, -3); scene.add(fill);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshLambertMaterial({ color: name === 'gameplay' ? '#35484e' : '#56676b' }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.018; scene.add(ground);
  if (name === 'gameplay') {
    for (const x of [-1.6, 1.6]) for (let z = -16; z < 22; z += 5) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(.045, .005, 2), new THREE.MeshBasicMaterial({ color: '#9fb0ad' }));
      stripe.position.set(x, -.009, z); scene.add(stripe);
    }
  }
  let art = createCar4Art(); scene.add(art.root);
  const camera = name === 'gameplay' ? new THREE.PerspectiveCamera(43, 9 / 16, .1, 100) : new THREE.OrthographicCamera(-3.6, 3.6, 3.6, -3.6, .1, 100);
  if (name === 'gameplay') camera.position.set(0, 6.1, -9.2);
  if (name === 'rear') camera.position.set(0, 2.1, -8);
  if (name === 'front') camera.position.set(0, 2.1, 8);
  if (name === 'side') camera.position.set(8, 2.1, 0);
  if (name === 'top') camera.position.set(0, 10, 0);
  camera.lookAt(0, .85, name === 'gameplay' ? 1.8 : 0);
  return { name, canvas, renderer, scene, camera, get art() { return art; }, setArt(next: typeof art) { scene.remove(art.root); art.dispose(); art = next; scene.add(art.root); } };
});

function update() {
  const finish = (document.getElementById('finish') as HTMLSelectElement).value as Car4Finish;
  const condition = (document.getElementById('condition') as HTMLSelectElement).value as Car4Condition;
  const lod = (document.getElementById('lod') as HTMLSelectElement).value as 'near' | 'far';
  for (const view of scenes) {
    if (view.art.root.userData.lod !== lod) view.setArt(createCar4Art(lod));
    view.art.setFinish(finish);
    view.art.setCondition(condition);
    const { width, height } = view.canvas.getBoundingClientRect();
    view.renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    if (view.camera instanceof THREE.PerspectiveCamera) {
      view.camera.aspect = width / height; view.camera.updateProjectionMatrix();
    } else {
      const half = view.name === 'side' ? 2.8 : 2.45;
      view.camera.left = -half * width / height; view.camera.right = half * width / height;
      view.camera.top = half; view.camera.bottom = -half; view.camera.updateProjectionMatrix();
    }
    view.renderer.render(view.scene, view.camera);
  }
}
for (const id of ['finish', 'condition', 'lod']) document.getElementById(id)?.addEventListener('change', update);
new ResizeObserver(update).observe(document.body);
update();
