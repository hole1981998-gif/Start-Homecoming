import * as THREE from 'three';
import { balance } from './config';
import type { Run } from './survival';
import type { EntityKind } from './world';

export class RoadRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(52, 9 / 16, 0.1, 180);
  private bike = new THREE.Group();
  private markers: THREE.Mesh[] = [];
  private posts: THREE.Mesh[] = [];
  private entityMeshes = new Map<string, { kind: EntityKind; mesh: THREE.Group }>();
  private pools: Record<EntityKind, THREE.Group[]> = { water: [], pothole: [], traffic: [], fuel: [], repair: [] };
  private makeBox!: (w: number, h: number, d: number, color: string, parent?: THREE.Object3D) => THREE.Mesh;
  private observer: ResizeObserver;
  private host: HTMLElement;
  private projected = new THREE.Vector3();
  constructor(canvas: HTMLCanvasElement, host: HTMLElement) {
    this.host = host;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.scene.background = new THREE.Color('#566770');
    this.scene.fog = new THREE.Fog('#566770', 45, 120);
    this.scene.add(new THREE.HemisphereLight('#dae5e5', '#444b49', 2.4));
    const sun = new THREE.DirectionalLight('#f9e5c3', 2); sun.position.set(-8, 15, 10); this.scene.add(sun);
    const box = (w: number, h: number, d: number, color: string, parent: THREE.Object3D = this.scene) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
      parent.add(mesh); return mesh;
    };
    this.makeBox = box;
    const ground = box(100, 0.1, 200, '#425951'); ground.position.set(0, -0.15, -70);
    const road = box(9.6, 0.1, 200, '#303e46'); road.position.set(0, -0.05, -70);
    for (const x of [-4.9, 4.9]) { const edge = box(0.12, 0.03, 200, '#d3d4bc'); edge.position.set(x, 0.02, -70); }
    for (let i = 0; i < 40; i++) for (const x of [-balance.laneWidth / 2, balance.laneWidth / 2]) {
      const m = box(0.09, 0.02, 2.5, '#9caeae'); m.position.set(x, 0.02, -i * 6); this.markers.push(m);
    }
    for (let i = 0; i < 32; i++) {
      const m = box(0.18, 0.7, 0.18, '#b0b7ab'); m.position.set(i % 2 ? -5.3 : 5.3, 0.35, 0); this.posts.push(m);
    }
    this.scene.add(this.bike);
    const body = box(0.65, 0.42, 1.5, '#dbb55c', this.bike); body.position.y = 0.65;
    for (const z of [-0.68, 0.68]) { const wheel = box(0.22, 0.48, 0.46, '#172126', this.bike); wheel.position.set(0, 0.25, z); }
    const rider = box(0.5, 0.75, 0.45, '#7dabb3', this.bike); rider.position.set(0, 1.2, 0.1);
    const helmet = box(0.4, 0.35, 0.4, '#e4d9c2', this.bike); helmet.position.set(0, 1.75, 0.06);
    const lamp = box(0.3, 0.16, 0.05, '#fff0ba', this.bike); lamp.position.set(0, 0.72, -0.77);
    this.observer = new ResizeObserver(() => {
      const { width, height } = host.getBoundingClientRect();
      this.renderer.setSize(width, height, false); this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
    });
    this.observer.observe(host);
  }
  private entityMesh(kind: EntityKind): THREE.Group {
    const pooled = this.pools[kind].pop(); if (pooled) return pooled;
    const g = new THREE.Group(), box = this.makeBox;
    const part = (w: number, h: number, d: number, color: string, x: number, y: number, z: number) => {
      const m = box(w, h, d, color, g); m.position.set(x, y, z);
    };
    if (kind === 'water') { part(3.2, .05, 7, '#5799aa', 0, .035, 0); part(2.5, .01, .1, '#abd1d5', 0, .065, -1.5); }
    else if (kind === 'pothole') {
      part(1.5, .03, 1.8, '#191d23', 0, .025, 0);
      for (const x of [-.85, .85]) part(.15, .08, 2, '#dfb357', x, .05, 0);
    } else if (kind === 'traffic') {
      part(1.9, .8, 3.6, '#d59561', 0, .6, 0); part(1.6, .6, 1.8, '#a9c6cb', 0, 1.3, 0);
      for (const x of [-.65, .65]) part(.25, .18, .06, '#fa9d80', x, .65, 1.83);
      for (const x of [-.65, .65]) part(.25, .18, .06, '#fff0ba', x, .65, -1.83);
    } else {
      const color = kind === 'fuel' ? '#82c5a0' : '#e1ded0';
      part(.8, .8, .8, color, 0, .6, 0);
      if (kind === 'fuel') { part(.5, .12, .2, '#e6d18f', 0, 1.1, 0); part(.18, .16, .18, '#e6d18f', .22, 1.05, .15); }
      else { part(.48, .14, .03, '#a8423d', 0, .65, .415); part(.14, .48, .03, '#a8423d', 0, .65, .415); }
    }
    this.scene.add(g); return g;
  }
  draw(s: Run, previous: Run, alpha: number): void {
    const x = THREE.MathUtils.lerp(previous.x, s.x, alpha);
    const distance = THREE.MathUtils.lerp(previous.distance, s.distance, alpha);
    this.bike.position.x = x;
    this.bike.rotation.z = -s.lateralVelocity * 0.035;
    // Follow the full lateral range: partial tracking clips the bike at road edges in 9:16.
    this.camera.position.set(x, 7.5, 11);
    this.camera.lookAt(x, 0, -12);
    for (let i = 0; i < this.markers.length; i++) this.markers[i].position.z = 12 - ((Math.floor(i / 2) * 6 - distance % 240 + 240) % 240);
    for (let i = 0; i < this.posts.length; i++) this.posts[i].position.z = 12 - ((Math.floor(i / 2) * 9 - distance % 144 + 144) % 144);
    const live = new Set<string>();
    for (const e of s.world.entities) {
      if (e.consumed) continue;
      live.add(e.id);
      let entry = this.entityMeshes.get(e.id);
      if (!entry) { entry = { kind: e.kind, mesh: this.entityMesh(e.kind) }; this.entityMeshes.set(e.id, entry); }
      entry.mesh.visible = true; entry.mesh.position.set(e.x, 0, -(e.distance - distance));
      entry.mesh.rotation.y = e.kind === 'traffic' && e.speed < 0 ? Math.PI : 0;
      const baseWidth = e.kind === 'water' ? 3.2 : e.kind === 'pothole' ? 1.5 : e.kind === 'traffic' ? 1.9 : .8;
      const baseLength = e.kind === 'water' ? 7 : e.kind === 'pothole' ? 1.8 : e.kind === 'traffic' ? 3.6 : .8;
      entry.mesh.scale.set(e.width / baseWidth, 1, e.length / baseLength);
    }
    for (const [id, entry] of this.entityMeshes) if (!live.has(id)) {
      entry.mesh.visible = false; this.pools[entry.kind].push(entry.mesh); this.entityMeshes.delete(id);
    }
    this.renderer.render(this.scene, this.camera);
    const tail = this.project(x, 0, 1.9);
    this.host.style.setProperty('--bike-x', `${Math.max(30, Math.min(70, tail.x))}%`);
    this.host.style.setProperty('--bike-tail-y', `${Math.max(76, Math.min(86, tail.y))}%`);
  }
  project(x: number, y: number, z: number): { x: number; y: number } {
    this.projected.set(x, y, z).project(this.camera);
    return { x: (this.projected.x + 1) * 50, y: (1 - this.projected.y) * 50 };
  }
  dispose(): void {
    this.observer.disconnect();
    this.scene.traverse(object => { if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => material.dispose());
    } });
    this.renderer.dispose();
  }
}
