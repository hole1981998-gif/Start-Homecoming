import * as THREE from 'three';

export type RoadEffect = 'water' | 'impact' | 'spark' | 'smoke' | 'fire' | 'nitro';
interface Particle {
  born: number; life: number; origin: THREE.Vector3; velocity: THREE.Vector3;
  size: number; kind: RoadEffect; owner: string;
}
const colors: Record<RoadEffect, string> = {
  water: '#83b3ad', impact: '#a69e86', spark: '#ebc87e', smoke: '#4b5a5c', fire: '#e69b48', nitro: '#66b9c5',
};
const noise = (i: number) => Math.abs(Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1;

/** A bounded presentation pool. Its clock and event identities belong to the caller. */
export function createRoadEffects(capacity = 192) {
  const root = new THREE.Group(); root.name = 'road_event_effects';
  const geometry = new THREE.IcosahedronGeometry(1, 0);
  const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: .55,
    depthWrite: false, toneMapped: true });
  const mesh = new THREE.InstancedMesh(geometry, material, capacity);
  mesh.frustumCulled = false; mesh.count = 0; root.add(mesh);
  const signalMaterial = new THREE.MeshBasicMaterial({ depthWrite: false });
  const signals = new THREE.InstancedMesh(geometry, signalMaterial, 128);
  signals.name = 'socket_signal_accents'; signals.frustumCulled = false;
  signals.count = 0; root.add(signals);
  const particles: Particle[] = [];
  const emitted = new Map<string, number>();
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  let time = 0, epoch = '', low = false;
  const reset = () => { particles.length = 0; emitted.clear(); mesh.count = 0; signals.count = 0; };
  const begin = (seconds: number, runId: string, reduced: boolean) => {
    if (runId !== epoch || seconds < time || low !== reduced) reset();
    time = seconds; epoch = runId; low = reduced;
    signals.count = 0;
    for (const [key, at] of emitted) if (time - at > 3) emitted.delete(key);
  };
  const signal = (position: THREE.Vector3, tint: string, size = .06) => {
    if (signals.count >= 128) return;
    dummy.position.copy(position); dummy.scale.setScalar(size); dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix(); signals.setMatrixAt(signals.count, dummy.matrix);
    signals.setColorAt(signals.count++, color.set(tint));
  };
  const burst = (key: string, origin: THREE.Vector3, direction: THREE.Vector3,
    kind: RoadEffect, amount = 8, owner = '') => {
    if (emitted.has(key)) return;
    emitted.set(key, time);
    // Bounded even if a broken caller produces thousands of unique events.
    if (emitted.size > capacity * 2) emitted.delete(emitted.keys().next().value!);
    const count = Math.max(1, Math.round(amount * (low ? .3 : 1)));
    for (let i = 0; i < Math.min(count, capacity); i++) {
      if (particles.length >= capacity) particles.shift();
      const smoke = kind === 'smoke', flame = kind === 'fire';
      const spread = smoke ? .18 : low ? .3 : .8;
      const velocity = direction.clone().multiplyScalar(smoke ? .12 : .55 + noise(i + 3) * .45);
      velocity.x += (noise(i + 1) - .5) * spread;
      velocity.z += (noise(i + 2) - .5) * spread;
      // Engine locators are under the hood, so smoke must rise clear of the
      // body before fading. It is still a narrow, short-lived plume.
      velocity.y = smoke ? 1.8 : flame ? 1.1 : .4 + noise(i + 4) * (low ? .3 : 1.1);
      particles.push({ born: time, life: smoke ? 1.2 : kind === 'impact' ? .24 : flame ? .55 : .42,
        origin: origin.clone(), velocity, size: smoke ? .17 : flame ? .09 : .025 + noise(i) * .025, kind, owner });
    }
  };
  const retainOwners = (live: ReadonlySet<string>) => {
    for (let i = particles.length - 1; i >= 0; i--)
      if (particles[i].owner && !live.has(particles[i].owner)) particles.splice(i, 1);
  };
  const update = () => {
    for (let i = particles.length - 1; i >= 0; i--)
      if (time - particles[i].born >= particles[i].life) particles.splice(i, 1);
    mesh.count = particles.length;
    particles.forEach((particle, i) => {
      const age = Math.max(0, time - particle.born), phase = age / particle.life;
      dummy.position.copy(particle.origin).addScaledVector(particle.velocity, age);
      if (particle.kind !== 'smoke' && particle.kind !== 'fire')
        dummy.position.y = Math.max(.06, dummy.position.y - age * age * 2.2);
      const size = particle.size * (1 - phase) * (particle.kind === 'smoke' ? 1 + phase * 3 : 1);
      dummy.scale.set(size, particle.kind === 'water' ? size * 1.8 : size, size);
      dummy.rotation.set(age, i, age * .5); dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix); mesh.setColorAt(i, color.set(colors[particle.kind]));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    signals.instanceMatrix.needsUpdate = true;
    if (signals.instanceColor) signals.instanceColor.needsUpdate = true;
  };
  root.userData = { visualOnly: true, collisionRole: 'none', capacity };
  return { root, begin, burst, signal, retainOwners, update, reset,
    get activeCount() { return particles.length; },
    get rememberedCount() { return emitted.size; },
    get signalCount() { return signals.count; },
    dispose: () => { reset(); geometry.dispose(); material.dispose(); signalMaterial.dispose(); } };
}
