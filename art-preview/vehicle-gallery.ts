import * as THREE from 'three';
import { createCar4Art } from '../src/art/car4';
import { createCar7Art } from '../src/art/car7';
import { createTwoWheelerArt } from '../src/art/two-wheelers';
import { createUtilityVehicleArt } from '../src/art/utility-vehicles';
import { createPersonArt, mountPersonOnSeat } from '../src/art/people';
import type { VehicleCondition } from '../src/art/condition';

type Kind = 'car4' | 'car7' | 'motorcycle' | 'motorbike' | 'tricycle' | 'bus' | 'truck' | 'container';
type Lod = 'near' | 'far';
type PreviewArt = { root: THREE.Group; setCondition: (condition: VehicleCondition) => void; dispose: () => void };
const create = (kind: Kind, lod: Lod): PreviewArt => {
  if (kind === 'motorcycle' || kind === 'motorbike') {
    const art = createTwoWheelerArt(kind, lod);
    mountPersonOnSeat(createPersonArt('driver', lod), art.seats.driver, 'riding');
    return art;
  }
  if (kind === 'tricycle') {
    const art = createUtilityVehicleArt(kind, 'player', lod);
    mountPersonOnSeat(createPersonArt('driver', lod), art.seats[0], 'riding');
    return art;
  }
  return kind === 'car4' ? createCar4Art(lod) :
    kind === 'car7' ? createCar7Art(lod) : createUtilityVehicleArt(kind, 'player', lod);
};
const names = ['gameplay', 'rear', 'front', 'side', 'top'] as const;
const views = names.map(name => {
  const canvas = document.getElementById(name) as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.setClearColor(name === 'gameplay' ? '#7ba9ac' : '#7fa7a4');
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#fff0d2', '#345b5d', 1.25));
  const sun = new THREE.DirectionalLight('#ffe5bf', 2.0); sun.position.set(-5, 9, 7); scene.add(sun);
  const fill = new THREE.DirectionalLight('#afd9d7', .65); fill.position.set(4, 6, -3); scene.add(fill);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshLambertMaterial({ color: name === 'gameplay' ? '#42585a' : '#729272' }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.02; scene.add(ground);
  if (name === 'gameplay') for (const x of [-1.65, 1.65]) for (let z = -15; z < 20; z += 5) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(.045, .008, 2), new THREE.MeshBasicMaterial({ color: '#adb8b2' }));
    stripe.position.set(x, -.01, z); scene.add(stripe);
  }
  let art = create('car4', 'near'); scene.add(art.root);
  const camera = name === 'gameplay' ? new THREE.PerspectiveCamera(43, 9 / 16, .1, 80) :
    new THREE.OrthographicCamera(-3, 3, 3, -3, .1, 80);
  return { name, canvas, renderer, scene, camera,
    get art() { return art; }, setArt(next: PreviewArt) { scene.remove(art.root); art.dispose(); art = next; scene.add(art.root); } };
});

function draw() {
  const kind = (document.getElementById('kind') as HTMLSelectElement).value as Kind;
  const lod = (document.getElementById('lod') as HTMLSelectElement).value as Lod;
  const condition = (document.getElementById('condition') as HTMLSelectElement).value as VehicleCondition;
  const size = { car4: 4.2, car7: 4.8, motorcycle: 2, motorbike: 2.2,
    tricycle: 3.2, bus: 10, truck: 7, container: 15 }[kind];
  for (const view of views) {
    view.setArt(create(kind, lod));
    view.art.setCondition(condition);
    const { width, height } = view.canvas.getBoundingClientRect();
    view.renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    const camera = view.camera;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(0, size * 1.43, -size * 2.05);
      camera.lookAt(0, kind === 'bus' || kind === 'truck' || kind === 'container' ? 1.5 :
        kind === 'car7' ? 1.0 : kind === 'car4' ? .9 : .7, size * .32);
      camera.aspect = width / height; camera.updateProjectionMatrix();
    } else {
      const half = view.name === 'side' ? size * .69 : size * .58;
      camera.left = -half * width / height; camera.right = half * width / height;
      camera.top = half; camera.bottom = -half;
      camera.position.set(view.name === 'side' ? 8 : 0,
        view.name === 'top' ? 10 : size * .55,
        view.name === 'rear' ? -8 : view.name === 'front' ? 8 : 0);
      camera.lookAt(0, kind === 'bus' || kind === 'truck' || kind === 'container' ? 1.5 :
        kind === 'car7' ? 1.0 : kind === 'car4' ? .85 : .7, 0);
      camera.updateProjectionMatrix();
    }
    view.renderer.render(view.scene, camera);
  }
}
for (const id of ['kind', 'lod', 'condition']) document.getElementById(id)?.addEventListener('change', draw);
new ResizeObserver(draw).observe(document.body);
draw();
