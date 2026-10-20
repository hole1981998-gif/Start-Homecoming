import * as THREE from 'three';
import { CollisionSandbox, type SandboxActor, type SandboxScenario } from './collision-sandbox';

const params = new URLSearchParams(location.search);
const requested = params.get('case');
const scenario: SandboxScenario = ['mixed', 'traffic', 'npc', 'cargo', 'chain'].includes(requested ?? '') ? requested as SandboxScenario : 'mixed';
const seed = Number(params.get('seed')) || 17;
document.querySelectorAll<HTMLAnchorElement>('[data-case]').forEach(a =>
  a.setAttribute('aria-current', a.dataset.case === scenario ? 'page' : 'false'));
const host = document.getElementById('play')!;
const speedText = document.getElementById('speed')!, distanceText = document.getElementById('distance')!;
const hpText = document.getElementById('hp')!, hitsText = document.getElementById('hits')!;
const eventsText = document.getElementById('events')!;
const overlay = document.getElementById('overlay')!, overlayTitle = document.getElementById('overlay-title')!;
const overlayText = document.getElementById('overlay-text')!, start = document.getElementById('start') as HTMLButtonElement;

const scene = new THREE.Scene(); scene.background = new THREE.Color('#304348'); scene.fog = new THREE.Fog('#304348', 70, 155);
scene.add(new THREE.HemisphereLight(0xf3eee0, 0x314143, 2.4));
const sun = new THREE.DirectionalLight(0xffedc4, 1.6); sun.position.set(-8, 16, -5); scene.add(sun);
const camera = new THREE.PerspectiveCamera(48, 1, .1, 230);
const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
host.insertBefore(renderer.domElement, host.firstChild);
const road = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 600), new THREE.MeshLambertMaterial({ color: '#27343a' }));
road.rotation.x = -Math.PI / 2; road.position.set(0, .015, 80); scene.add(road);
const vergeMaterial = new THREE.MeshLambertMaterial({ color: '#43594e' });
for (const x of [-9.8, 9.8]) {
  const verge = new THREE.Mesh(new THREE.BoxGeometry(10, .02, 600), vergeMaterial);
  verge.position.set(x, 0, 80); scene.add(verge);
}
const stripeMaterial = new THREE.MeshBasicMaterial({ color: '#a6aea7' });
for (const x of [-1.6, 1.6]) for (let z = -65; z < 260; z += 9) {
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(.08, 4), stripeMaterial);
  stripe.rotation.x = -Math.PI / 2; stripe.position.set(x, .04, z); scene.add(stripe);
}
for (const x of [-4.75, 4.75]) {
  const edge = new THREE.Mesh(new THREE.BoxGeometry(.09, .16, 600), new THREE.MeshLambertMaterial({ color: '#ded2a9' }));
  edge.position.set(x, .08, 80); scene.add(edge);
}
const meshes = new Map<string, THREE.Group>();
let sandbox = new CollisionSandbox(scenario, seed), running = false, started = false;
let last = performance.now(), accumulator = 0;
const keys = new Set<string>();
function meshFor(actor: SandboxActor): THREE.Group {
  let group = meshes.get(actor.id); if (group) return group;
  group = new THREE.Group();
  const color = new THREE.MeshLambertMaterial({ color: actor.color });
  if (actor.kind === 'npc') {
    const person = new THREE.Mesh(new THREE.CapsuleGeometry(.34, .8, 4, 8), color);
    person.position.y = .6; group.add(person);
  } else if (actor.kind === 'cargo') {
    group.add(new THREE.Mesh(actor.id.endsWith('1') ? new THREE.SphereGeometry(.6, 12, 8) :
      new THREE.BoxGeometry(1.16, 1.16, 1.16), color));
  } else {
    const body = new THREE.Mesh(new THREE.BoxGeometry(actor.width, .9, actor.length), color);
    group.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(actor.width * .72, .28, actor.length * .35),
      new THREE.MeshLambertMaterial({ color: actor.kind === 'player' ? '#8da9ac' : '#485e65' }));
    cabin.position.set(0, .57, actor.length * .08); group.add(cabin);
    const front = new THREE.Mesh(new THREE.BoxGeometry(actor.width * .72, .06, .1),
      new THREE.MeshBasicMaterial({ color: '#f2dfa8' })); front.position.set(0, .28, actor.length * .49); group.add(front);
  }
  scene.add(group); meshes.set(actor.id, group); return group;
}
function reset(): void {
  for (const mesh of meshes.values()) scene.remove(mesh); meshes.clear();
  sandbox = new CollisionSandbox(scenario, seed); running = false; started = false; accumulator = 0; keys.clear();
  overlay.hidden = false; overlayTitle.textContent = 'Sẵn sàng thử va chạm';
  overlayText.textContent = 'Lái qua các vật thể để quan sát phản lực. Đây là sân thử riêng; ván chính chưa dùng hệ vật lý này.';
  start.textContent = 'Bắt đầu'; update();
}
function update(): void {
  for (const actor of sandbox.actors) {
    const mesh = meshFor(actor), body = actor.body;
    mesh.position.set(body.position.x, body.position.y, body.position.z);
    mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
    if (actor.kind === 'player') mesh.rotation.z += THREE.MathUtils.clamp(-body.velocity.x * .025, -.17, .17);
    if (actor.disabled) mesh.children.forEach(child => { const m = child as THREE.Mesh; if (m.material instanceof THREE.MeshLambertMaterial) m.material.color.set('#677179'); });
  }
  const p = sandbox.player;
  const followZ = p.body.position.z;
  camera.position.lerp(new THREE.Vector3(p.body.position.x * .22, 19, followZ - 23), .16);
  camera.lookAt(p.body.position.x * .28, 0, followZ + 17);
  speedText.textContent = Math.max(0, Math.round(p.body.velocity.z * 3.6)).toString();
  distanceText.textContent = Math.max(0, Math.round(followZ)).toString();
  hpText.textContent = Math.ceil(p.hp).toString(); hitsText.textContent = sandbox.totalImpacts.toString();
  eventsText.innerHTML = sandbox.events.slice(-3).reverse().map(e =>
    `<div>${e.kinds} · lực ${Math.round(e.severity)}</div>`).join('');
  renderer.render(scene, camera);
}
function frame(now: number): void {
  const elapsed = Math.min(.1, Math.max(0, (now - last) / 1000)); last = now;
  if (running) {
    accumulator += elapsed;
    let steps = 0;
    while (accumulator >= 1 / 60 && steps++ < 6) {
      sandbox.step({ accelerate: keys.has('w'), brake: keys.has('s'), left: keys.has('a'), right: keys.has('d') });
      accumulator -= 1 / 60;
    }
    if (sandbox.player.hp === 0) {
      running = false; overlay.hidden = false; overlayTitle.textContent = 'Xe đã hỏng';
      overlayText.textContent = `Đã thử ${sandbox.totalImpacts} va chạm. Bấm chơi lại để thử đường khác.`;
      start.textContent = 'Chơi lại';
    }
  }
  update(); requestAnimationFrame(frame);
}
function resize(): void {
  const width = host.clientWidth, height = host.clientHeight;
  camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false);
}
new ResizeObserver(resize).observe(host); resize();
start.addEventListener('click', () => { if (sandbox.player.hp === 0) reset(); started = true;
  running = true; overlay.hidden = true; host.focus(); });
window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  if (['w','a','s','d','r','escape'].includes(key)) e.preventDefault();
  if (key === 'r') { reset(); started = true; running = true; overlay.hidden = true; host.focus(); }
  else if (key === 'escape' && started) { running = !running; overlay.hidden = running;
    if (!running) { overlayTitle.textContent = 'Tạm dừng'; overlayText.textContent = 'Bấm tiếp tục để chơi.'; start.textContent = 'Tiếp tục'; } }
  else keys.add(key);
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => { keys.clear(); if (running) { running = false; overlay.hidden = false;
  overlayTitle.textContent = 'Tạm dừng'; overlayText.textContent = 'Bấm tiếp tục để chơi.'; start.textContent = 'Tiếp tục'; } });
requestAnimationFrame(frame);
