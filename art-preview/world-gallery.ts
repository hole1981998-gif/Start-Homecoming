import * as THREE from 'three';
import { createPropHazardArt, createSurfaceHazardArt, type PropHazardKind } from '../src/art/hazards';
import { createAmbulanceArt, createOfficerArt, createTrainArt, createVendorArt } from '../src/art/moving-events';
import { createRoadTileArt } from '../src/art/road-kit';
import { createSceneryCluster } from '../src/art/scenery';
import { createAccidentArt, createShopArt } from '../src/art/special-hazards';
import type { LandscapeKind } from '../src/landscape';

type Art = { root: THREE.Group; dispose: () => void };
type Kind = PropHazardKind | 'water' | 'pothole' | 'train' | 'ambulance' |
  'police' | 'militia' | 'vendor' | 'accident' | 'shop' | 'road' | LandscapeKind;
function make(kind: Kind, lod: 'near' | 'far'): Art {
  if (kind === 'water') return createSurfaceHazardArt('water', 3.2, 7, lod);
  if (kind === 'pothole') return createSurfaceHazardArt('pothole', 2.3, 4, lod);
  if (kind === 'train') return createTrainArt(1, lod);
  if (kind === 'ambulance') return createAmbulanceArt(lod);
  if (kind === 'police' || kind === 'militia') return createOfficerArt(kind, lod);
  if (kind === 'vendor') return createVendorArt(lod);
  if (kind === 'accident') return createAccidentArt(lod);
  if (kind === 'shop') return createShopArt(lod);
  if (kind === 'road') return createRoadTileArt(lod);
  if (['city', 'trees', 'cliffs', 'rice', 'sea'].includes(kind))
    return createSceneryCluster(kind as LandscapeKind, 1, lod);
  return createPropHazardArt(kind as PropHazardKind, lod);
}
const views = (['gameplay', 'rear', 'front', 'side', 'top'] as const).map(name => {
  const canvas = document.getElementById(name) as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene(); scene.background = new THREE.Color(name === 'gameplay' ? '#50666c' : '#617278');
  scene.add(new THREE.HemisphereLight('#fff6e2', '#374b51', 2.5));
  const sun = new THREE.DirectionalLight('#fff0d5', 2.1); sun.position.set(-6, 9, 7); scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshLambertMaterial({ color: '#52605b' }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.20; scene.add(ground);
  let art = make('water', 'near'); scene.add(art.root);
  const camera = name === 'gameplay' ? new THREE.PerspectiveCamera(43, 9 / 16, .1, 130) :
    new THREE.OrthographicCamera(-10, 10, 10, -10, .1, 130);
  return { name, canvas, renderer, scene, camera, setArt(next: Art) {
    scene.remove(art.root); art.dispose(); art = next; scene.add(art.root);
  } };
});
function draw() {
  const kind = (document.getElementById('kind') as HTMLSelectElement).value as Kind;
  const lod = (document.getElementById('lod') as HTMLSelectElement).value as 'near' | 'far';
  const scenery = ['city', 'trees', 'cliffs', 'rice', 'sea'].includes(kind);
  const big = kind === 'train' ? 24 : scenery ? 31 : kind === 'road' ? 10 :
    kind === 'water' ? 7 : kind === 'pothole' ? 4 : kind === 'barrier' ? 6.2 :
    kind === 'fallen_tree' ? 4.3 : kind === 'ambulance' || kind === 'accident' ? 5 :
      kind === 'shop' ? 4.2 : 2.5;
  const focusX = scenery ? 10 : 0, focusY = scenery ? 2 : kind === 'train' ? 1.2 :
    kind === 'ambulance' ? 1.0 : .5;
  for (const view of views) {
    view.setArt(make(kind, lod));
    const { width, height } = view.canvas.getBoundingClientRect();
    view.renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    const camera = view.camera;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(scenery ? -4 : focusX, big * .62 + 1, -big * 1.0 - 2);
      camera.lookAt(focusX, focusY, 0);
      camera.aspect = width / height; camera.updateProjectionMatrix();
    } else {
      const half = big * .62;
      camera.left = -half * width / height; camera.right = half * width / height;
      camera.top = half; camera.bottom = -half;
      camera.position.set(focusX + (view.name === 'side' ? 20 : 0),
        view.name === 'top' ? 25 : big * .42 + 1,
        view.name === 'rear' ? -25 : view.name === 'front' ? 25 : 0);
      camera.lookAt(focusX, focusY, 0); camera.updateProjectionMatrix();
    }
    view.renderer.render(view.scene, camera);
  }
}
for (const id of ['kind', 'lod']) document.getElementById(id)?.addEventListener('change', draw);
new ResizeObserver(draw).observe(document.body);
draw();
