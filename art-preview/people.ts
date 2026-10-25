import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createPersonArt, type EssentialPose, type PersonArchetype } from '../src/art/people';

let adjustedDriver: THREE.Group | null = null;
function poseAdjustedDriver(root: THREE.Group, pose: EssentialPose, phase: number) {
  const nodes: THREE.Object3D[] = [];
  root.traverse(object => nodes.push(object));
  const named = (prefix: string) => nodes.find(object => object.name.startsWith(prefix));
  const pair = (prefix: string) => nodes.filter(object => object.name.startsWith(prefix))
    .sort((a, b) => a.position.x - b.position.x);
  const hips = named('hip_pivot')!, torso = named('torso_pivot')!, head = named('head_pivot')!;
  const arms = pair('shoulder_'), legs = pair('hip_leg_');
  const elbows = arms.map(arm => arm.children.find(child => child.name.startsWith('elbow_'))!);
  const knees = legs.map(leg => leg.children.find(child => child.name.startsWith('knee_'))!);
  const turn = (object: THREE.Object3D, axis: THREE.Vector3, radians: number) =>
    object.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, radians));
  const x = new THREE.Vector3(1, 0, 0), y = new THREE.Vector3(0, 1, 0), z = new THREE.Vector3(0, 0, 1);
  const t = Math.max(0, Math.min(1, phase));
  if (pose === 'walk') {
    const stride = Math.sin(t * Math.PI * 2);
    turn(legs[0], x, stride * .48); turn(legs[1], x, -stride * .48);
    turn(knees[0], x, Math.max(0, -stride) * .48);
    turn(knees[1], x, Math.max(0, stride) * .48);
    turn(arms[0], x, -stride * .34 - .14); turn(arms[1], x, stride * .34 - .14);
    turn(elbows[0], x, -.22); turn(elbows[1], x, -.22);
    turn(torso, z, stride * .035); turn(head, z, -stride * .02);
  } else if (pose === 'seated' || pose === 'riding') {
    if (pose === 'seated') torso.position.y -= .19;
    for (const leg of legs) turn(leg, x, pose === 'riding' ? -.77 : -1.25);
    for (const knee of knees) turn(knee, x, pose === 'riding' ? 1.0 : 1.33);
    if (pose === 'riding') {
      turn(torso, x, .22);
      for (const arm of arms) turn(arm, x, -.92);
      for (const elbow of elbows) turn(elbow, x, -.35);
    }
  } else if (pose === 'hail') {
    turn(arms[1], z, 2.35 + Math.sin(t * Math.PI * 2) * .15);
    turn(elbows[1], z, -.33); turn(head, y, -.15);
  } else if (pose === 'refuse') {
    turn(arms[1], z, 1.18); turn(elbows[1], x, -1);
    turn(head, y, -.42); turn(torso, y, -.24);
  } else if (pose === 'ejected') {
    turn(torso, x, -.25 - .36 * t); turn(torso, z, .10 + .20 * t);
    turn(arms[0], z, -.5 - .6 * t); turn(arms[1], z, .5 + .5 * t);
    turn(legs[0], x, -.16 - .19 * t); turn(legs[1], x, .19 + .23 * t);
  } else if (pose === 'grounded' || pose === 'recover') {
    hips.position.y = pose === 'grounded' ? .33 : .33 + (.85 - .33) * t;
    const drop = pose === 'grounded' ? 1 : 1 - t;
    turn(torso, x, -1.25 * drop);
    for (const arm of arms) turn(arm, x, -1.12 * drop);
    if (pose === 'grounded') {
      turn(legs[0], z, -.32); turn(legs[1], z, .30);
    } else for (const knee of knees) turn(knee, x, .52 * drop);
  }
}
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
  let delivered: THREE.Group | null = null;
  return { canvas, renderer, scene, camera, setPerson(next: typeof person) {
    scene.remove(person.root); person.dispose(); person = next;
    person.root.traverse(object => { if (object instanceof THREE.Mesh) object.castShadow = true; });
    scene.add(person.root);
  }, showAdjustedDriver(show: boolean, pose: EssentialPose) {
    if (delivered) scene.remove(delivered);
    delivered = show && adjustedDriver ? adjustedDriver.clone(true) : null;
    if (delivered) {
      poseAdjustedDriver(delivered, pose, .25);
      delivered.traverse(object => { if (object instanceof THREE.Mesh) object.castShadow = true; });
      scene.add(delivered);
    }
    person.root.visible = !delivered;
  }, get person() { return person; } };
});
function draw() {
  const archetype = (document.getElementById('person') as HTMLSelectElement).value as PersonArchetype;
  const pose = (document.getElementById('pose') as HTMLSelectElement).value as EssentialPose;
  const showAdjusted = archetype === 'driver' && !!adjustedDriver;
  (document.getElementById('source-note') as HTMLElement).textContent = showAdjusted
    ? 'Tài xế: mesh Blender driver.adjusted; pose preview theo pivot'
    : 'NPC: mesh procedural; chưa ghép asset Blender vào gameplay';
  for (const view of views) {
    view.setPerson(createPersonArt(archetype)); view.person.setPose(pose, .25);
    view.showAdjustedDriver(showAdjusted, pose);
    const { width, height } = view.canvas.getBoundingClientRect();
    view.renderer.setSize(width, height, false);
    view.camera.aspect = width / height; view.camera.updateProjectionMatrix();
    view.renderer.render(view.scene, view.camera);
  }
}
for (const id of ['person', 'pose']) document.getElementById(id)?.addEventListener('change', draw);
new ResizeObserver(draw).observe(document.body);
draw();
new GLTFLoader().load(new URL('../assets/art/driver-adjusted-delivery.glb', import.meta.url).href,
  gltf => { adjustedDriver = gltf.scene; draw(); }, undefined,
  () => { (document.getElementById('source-note') as HTMLElement).textContent = 'Không tải được mesh Blender'; });
