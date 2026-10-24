import * as THREE from 'three';
import { createPersonArt, type EssentialPose, type PersonArchetype } from '../src/art/people';

const views = (['rear', 'front'] as const).map(name => {
  const canvas = document.getElementById(name) as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#eceee8');
  scene.add(new THREE.HemisphereLight('#ffffff', '#aeb9b4', 1.35));
  const light = new THREE.DirectionalLight('#fff4dc', 2.25);
  light.position.set(-3, 7, 5); light.castShadow = true; light.shadow.mapSize.set(2048, 2048);
  light.shadow.camera.left = -4; light.shadow.camera.right = 4;
  light.shadow.camera.top = 4; light.shadow.camera.bottom = -4;
  light.shadow.bias = -.0003; scene.add(light);
  const fill = new THREE.DirectionalLight('#d5e8e4', .65); fill.position.set(4, 5, -3); scene.add(fill);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20),
    new THREE.MeshLambertMaterial({ color: '#e9e9df' }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.02;
  ground.receiveShadow = true; scene.add(ground);
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 40);
  camera.position.set(name === 'rear' ? -.3 : 3.1, 2.0, name === 'rear' ? -5.3 : 4.7);
  camera.lookAt(0, .9, 0);
  let person = createPersonArt('driver'); scene.add(person.root);
  return { canvas, renderer, scene, camera, setPerson(next: typeof person) {
    scene.remove(person.root); person.dispose(); person = next;
    person.root.traverse(object => { if (object instanceof THREE.Mesh) object.castShadow = true; });
    scene.add(person.root);
  }, get person() { return person; } };
});
function draw() {
  const archetype = (document.getElementById('person') as HTMLSelectElement).value as PersonArchetype;
  const pose = (document.getElementById('pose') as HTMLSelectElement).value as EssentialPose;
  for (const view of views) {
    view.setPerson(createPersonArt(archetype)); view.person.setPose(pose, .25);
    const { width, height } = view.canvas.getBoundingClientRect();
    view.renderer.setSize(width, height, false);
    view.camera.aspect = width / height; view.camera.updateProjectionMatrix();
    view.renderer.render(view.scene, view.camera);
  }
}
for (const id of ['person', 'pose']) document.getElementById(id)?.addEventListener('change', draw);
new ResizeObserver(draw).observe(document.body);
draw();
