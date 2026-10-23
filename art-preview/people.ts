import * as THREE from 'three';
import { createPersonArt, type EssentialPose, type PersonArchetype } from '../src/art/people';

const views = (['rear', 'front'] as const).map(name => {
  const canvas = document.getElementById(name) as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#53696c');
  scene.add(new THREE.HemisphereLight('#fff7e5', '#34464c', 2.5));
  const light = new THREE.DirectionalLight('#fff0d7', 2.1); light.position.set(-3, 6, 4); scene.add(light);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshLambertMaterial({ color: '#374f50' }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.02; scene.add(ground);
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 40);
  camera.position.set(name === 'rear' ? -.3 : .3, 2.0, name === 'rear' ? -5.3 : 5.3);
  camera.lookAt(0, .9, 0);
  let person = createPersonArt('driver'); scene.add(person.root);
  return { canvas, renderer, scene, camera, setPerson(next: typeof person) {
    scene.remove(person.root); person.dispose(); person = next; scene.add(person.root);
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
