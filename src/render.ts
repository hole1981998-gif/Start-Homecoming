import * as THREE from 'three';
import { balance } from './config';
import type { State } from './simulation';

export class RoadRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(52, 9 / 16, 0.1, 180);
  private bike = new THREE.Group();
  private markers: THREE.Mesh[] = [];
  private posts: THREE.Mesh[] = [];
  private observer: ResizeObserver;
  constructor(canvas: HTMLCanvasElement, host: HTMLElement) {
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
  draw(s: State, previous: State, alpha: number): void {
    const x = THREE.MathUtils.lerp(previous.x, s.x, alpha);
    const distance = THREE.MathUtils.lerp(previous.distance, s.distance, alpha);
    this.bike.position.x = x;
    this.bike.rotation.z = -s.lateralVelocity * 0.035;
    // Follow the full lateral range: partial tracking clips the bike at road edges in 9:16.
    this.camera.position.set(x, 7.5, 11);
    this.camera.lookAt(x, 0, -12);
    for (let i = 0; i < this.markers.length; i++) this.markers[i].position.z = 12 - ((Math.floor(i / 2) * 6 - distance % 240 + 240) % 240);
    for (let i = 0; i < this.posts.length; i++) this.posts[i].position.z = 12 - ((Math.floor(i / 2) * 9 - distance % 144 + 144) % 144);
    this.renderer.render(this.scene, this.camera);
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
