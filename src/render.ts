import { isSpecial, trainClosed } from './special-events';
import * as THREE from 'three';
import { balance } from './config';
import { jumpHeight, hasStar, hasBoost } from './items';
import { activeVehicle, type Run } from './survival';
import { passengerPose, trafficTypes, type EntityKind, type TrafficKind } from './world';
import { junction, pathPose } from './route';

interface JunctionView { group: THREE.Group; straightStub: THREE.Group; barrier: THREE.Mesh }

export class RoadRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(52, 9 / 16, 0.1, 180);
  private bike = new THREE.Group();
  private powerRing!: THREE.Mesh;
  private openFrame = new THREE.Group();
  private tricycleFrame = new THREE.Group();
  private closedFrame = new THREE.Group();
  private windowPassengers: THREE.Group[] = [];
  private rider!: THREE.Mesh;
  private helmet!: THREE.Mesh;
  private fallenDriver = new THREE.Group();
  private bikePassengers: THREE.Group[] = [];
  private fallenPassengers: THREE.Group[] = [];
  private roadPieces: THREE.Group[] = [];
  private roadSurface!: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  private ground!: THREE.Mesh;
  private viewState!: Run;
  private entityMeshes = new Map<string, { kind: EntityKind; trafficKind?: TrafficKind; mesh: THREE.Group }>();
  private pools: Record<EntityKind, THREE.Group[]> = { wind: [], water: [], pothole: [], traffic: [], cargo: [], fuel: [], repair: [], passenger: [], shop: [], police: [], militia: [], train: [], accident: [], jam: [], broken: [] };
  private trafficPools = new Map<TrafficKind, THREE.Group[]>();
  private makeBox!: (w: number, h: number, d: number, color: string, parent?: THREE.Object3D) => THREE.Mesh;
  private observer: ResizeObserver;
  private host: HTMLElement;
  private projected = new THREE.Vector3();
  private crossings: JunctionView[] = [];
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
    this.ground = box(260, 0.1, 260, '#425951'); this.ground.position.y = -.15;
    const roadGeometry = new THREE.BufferGeometry();
    roadGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(53 * 2 * 3), 3));
    const roadIndices: number[] = [];
    for (let i = 0; i < 52; i++) roadIndices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    roadGeometry.setIndex(roadIndices);
    this.roadSurface = new THREE.Mesh(roadGeometry, new THREE.MeshBasicMaterial({ color: '#303e46', side: THREE.DoubleSide }));
    this.scene.add(this.roadSurface);
    for (let i = 0; i < 52; i++) {
      const piece = new THREE.Group(); this.scene.add(piece); this.roadPieces.push(piece);
      for (const side of [-1, 1]) {
        const edge = box(.12, .03, 4.5, '#d3d4bc', piece); edge.position.set(side * 4.9, .02, 0);
        const stripe = box(.09, .02, 1.8, '#9caeae', piece); stripe.position.set(side * balance.laneWidth / 2, .02, 0);
        const post = box(.18, .7, .18, '#b0b7ab', piece); post.position.set(side * 5.3, .35, 0);
      }
    }
    for (let i = 0; i < 2; i++) {
      const group = new THREE.Group(), straightStub = new THREE.Group();
      this.scene.add(group); group.add(straightStub);
      // The cross street meets the outgoing road at the end of the quarter turn.
      const crossStreet = box(90, .07, 9.6, '#33454b', group); crossStreet.position.set(0, -.055, -10.2);
      const oldRoad = box(9.6, .04, 190, '#303e46', straightStub); oldRoad.position.set(0, -.08, -95);
      for (const side of [-1, 1]) {
        const edge = box(.12, .025, 150, '#d3d4bc', straightStub); edge.position.set(side * 4.9, -.035, -95);
        const stripe = box(.09, .025, 150, '#9caeae', straightStub); stripe.position.set(side * balance.laneWidth / 2, -.035, -95);
      }
      const barrier = box(9.2, .7, .35, '#d39468', group); barrier.position.set(0, .36, -12);
      this.crossings.push({ group, straightStub, barrier });
    }
    this.scene.add(this.bike);
    this.bike.add(this.openFrame, this.tricycleFrame, this.closedFrame);
    this.powerRing = new THREE.Mesh(new THREE.TorusGeometry(1.5, .06, 4, 20), new THREE.MeshBasicMaterial({ color: '#f7df85' }));
    this.powerRing.rotation.x = Math.PI / 2; this.powerRing.position.y = .15; this.bike.add(this.powerRing);
    const body = box(0.65, 0.42, 1.5, '#dbb55c', this.openFrame); body.position.y = 0.65;
    for (const z of [-0.68, 0.68]) { const wheel = box(0.22, 0.48, 0.46, '#172126', this.openFrame); wheel.position.set(0, 0.25, z); }
    const shell = box(1, .8, 2, '#d0ad68', this.closedFrame); shell.position.y = .75;
    const cabin = box(.82, .48, 1.05, '#7a9a9e', this.closedFrame); cabin.position.set(0, 1.36, -.12);
    this.windowPassengers = this.addWindowPassengers(this.closedFrame, 1, 2, balance.riderLimit, 1.24);
    const fork = box(.48, .35, 1.25, '#dbb55c', this.tricycleFrame); fork.position.set(0, .66, -.68);
    const cargoBed = box(1.5, .17, 1.65, '#b38d59', this.tricycleFrame); cargoBed.position.set(0, .73, .62);
    for (const side of [-1, 1]) {
      const rail = box(.13, .42, 1.65, '#806746', this.tricycleFrame); rail.position.set(side * .69, 1.02, .62);
      const rearWheel = box(.24, .54, .45, '#172126', this.tricycleFrame); rearWheel.position.set(side * .66, .28, 1.12);
    }
    const frontWheel = box(.25, .56, .44, '#172126', this.tricycleFrame); frontWheel.position.set(0, .28, -1.17);
    const frontLamp = box(.3, .16, .08, '#fff0ba', this.tricycleFrame); frontLamp.position.set(0, .82, -1.31);
    this.rider = box(0.5, 0.75, 0.45, '#7dabb3', this.bike); this.rider.position.set(0, 1.2, 0.1);
    this.helmet = box(0.4, 0.35, 0.4, '#e4d9c2', this.bike); this.helmet.position.set(0, 1.75, 0.06);
    for (let i = 0; i < balance.riderLimit; i++) {
      const onBike = new THREE.Group(); this.bike.add(onBike);
      const color = i % 2 ? '#d59b79' : '#9cb7a6';
      const body = box(.45, .65, .4, color, onBike); body.position.y = .34;
      const head = box(.34, .34, .34, '#e6d8bd', onBike); head.position.y = .82;
      this.bikePassengers.push(onBike);
      const fallen = new THREE.Group(); this.scene.add(fallen);
      const fallenBody = box(.45, .65, .4, color, fallen); fallenBody.position.y = .34;
      const fallenHead = box(.34, .34, .34, '#e6d8bd', fallen); fallenHead.position.y = .82;
      this.fallenPassengers.push(fallen);
    }
    this.scene.add(this.fallenDriver);
    const fallenBody = box(0.5, 0.75, 0.45, '#7dabb3', this.fallenDriver); fallenBody.position.y = .55;
    const fallenHelmet = box(.4, .35, .4, '#e4d9c2', this.fallenDriver); fallenHelmet.position.y = 1.15;
    const lamp = box(0.3, 0.16, 0.05, '#fff0ba', this.openFrame); lamp.position.set(0, 0.72, -0.77);
    this.observer = new ResizeObserver(() => {
      const { width, height } = host.getBoundingClientRect();
      this.renderer.setSize(width, height, false); this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
    });
    this.observer.observe(host);
  }
  /** Small upper bodies lean beyond each side window; the driver is never included. */
  private addWindowPassengers(parent: THREE.Group, width: number, length: number, count: number, height: number): THREE.Group[] {
    const passengers: THREE.Group[] = [];
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1;
      const row = Math.floor(i / 2);
      const rows = Math.ceil(count / 2);
      const z = rows === 1 ? 0 : -length * .32 + row * length * .64 / (rows - 1);
      const person = new THREE.Group(); parent.add(person);
      person.position.set(side * (width * .5 + .08), height, z);
      person.rotation.z = -side * .22;
      const color = i % 2 ? '#d59b79' : '#9cb7a6';
      const torso = this.makeBox(.3, .32, .28, color, person); torso.position.y = -.12;
      const head = this.makeBox(.3, .3, .3, '#e6d8bd', person); head.position.y = .17;
      person.visible = false; passengers.push(person);
    }
    return passengers;
  }
  private entityMesh(kind: EntityKind, trafficKind: TrafficKind = 'car4'): THREE.Group {
    const pool = kind === 'traffic' ? this.trafficPools.get(trafficKind) ?? [] : this.pools[kind];
    const pooled = pool.pop(); if (pooled) return pooled;
    const g = new THREE.Group(), box = this.makeBox;
    const part = (w: number, h: number, d: number, color: string, x: number, y: number, z: number) => {
      const m = box(w, h, d, color, g); m.position.set(x, y, z); return m;
    };
    if (kind === 'train') {
      for (const x of [-.135, .135]) part(.05, .15, .4, '#35434a', x, .55, 0);
      for (const x of [-.27, 0, .27]) {
        part(.25, 1.65, .8, '#bc9368', x, .9, 0);
        for (const z of [-.41, .41]) part(.2, .38, .02, '#91abb0', x, 1.24, z);
        part(.24, .18, .5, '#303e45', x, .14, 0);
      }
    } else if (kind === 'police' || kind === 'militia') {
      const color = kind === 'police' ? '#698da8' : '#85906b';
      const legacy = part(.8, 1.1, .8, color, 0, .55, 0);
      const human = new THREE.Group(); g.add(human); g.userData.human = human; g.userData.legacy = legacy;
      const torso = box(.5, .65, .3, color, human); torso.position.y = .9; g.userData.torso = torso;
      const head = box(.36, .36, .36, '#e8d9b7', human); head.position.y = 1.45;
      const hat = box(.45, .12, .43, color, human); hat.position.y = 1.68;
      for (const x of [-.15, .15]) { const leg = box(.16, .55, .2, '#354d5a', human); leg.position.set(x, .3, 0); }
      const mark = box(.22, .16, .2, '#f1d27d', human); mark.position.y = 2; g.userData.stunMark = mark;
    } else if (isSpecial(kind)) {
      const color = kind === 'accident' ? '#ad655d' : '#9a8e78';
      part(.8, 1.1, .8, color, 0, .55, 0);
      part(.8, .1, .15, '#eee3bc', 0, .7, .42);
    } else if (kind === 'shop') {
      part(1.8, 1.6, 3, '#688e88', 0, .8, 0); part(2.2, .2, 3.4, '#cdb376', 0, 1.7, 0);
      part(.6, .8, .12, '#e1d9af', 0, 1.05, 1.55);
    }
    else if (kind === 'wind') { part(9.6, .025, 65, '#809c91', 0, .02, 0); }
    else if (kind === 'water') { part(3.2, .05, 7, '#5799aa', 0, .035, 0); part(2.5, .01, .1, '#abd1d5', 0, .065, -1.5); }
    else if (kind === 'pothole') {
      part(1.5, .03, 1.8, '#191d23', 0, .025, 0);
      for (const x of [-.85, .85]) part(.15, .08, 2, '#dfb357', x, .05, 0);
    } else if (kind === 'cargo') {
      g.userData.cargoBody = part(.8, .8, .8, '#b38b61', 0, .42, 0);
      part(.84, .08, .84, '#e5ca8f', 0, .82, 0);
      part(.08, .84, .84, '#e5ca8f', 0, .42, 0);
    } else if (kind === 'traffic') {
      const d = trafficTypes[trafficKind], w = d.width, l = d.length;
      const open = trafficKind === 'motorcycle' || trafficKind === 'motorbike' || trafficKind === 'tricycle';
      const tall = trafficKind === 'bus' || trafficKind === 'container';
      const bodyHeight = open ? .35 : tall ? 1.65 : trafficKind === 'truck' ? 1.25 : .82;
      const body = part(trafficKind === 'tricycle' ? w * .35 : w * .9,
        bodyHeight, trafficKind === 'tricycle' ? l * .43 : l * .88,
        d.color, 0, .42 + bodyHeight / 2, trafficKind === 'tricycle' ? -l * .23 : 0);
      g.userData.body = body;
      if (open) {
        const wheelZ = l * .36;
        for (const z of [-wheelZ, wheelZ]) part(.21, .48, .36, '#202a30', 0, .25, z);
        if (trafficKind === 'tricycle') for (const x of [-w * .35, w * .35])
          part(.22, .46, .38, '#202a30', x, .25, wheelZ);
        part(.34, .65, .4, '#698c91', 0, 1.05, 0);
        part(.36, .36, .36, '#e8d9bf', 0, 1.53, -.04);
        if (trafficKind === 'tricycle') {
          part(w * .84, .18, l * .48, '#9a7a4f', 0, .8, l * .21);
          for (const x of [-w * .39, w * .39]) part(.13, .4, l * .48, '#6d6561', x, 1.02, l * .21);
          part(w * .84, .4, .12, '#6d6561', 0, 1.02, l * .44);
        }
      } else if (trafficKind === 'truck' || trafficKind === 'container') {
        part(w * .75, .8, l * .24, '#a9c6cb', 0, 1.24, -l * .32);
        part(w * .82, trafficKind === 'container' ? 1.8 : .85, l * .58,
          trafficKind === 'container' ? '#8b8179' : '#726f72', 0, trafficKind === 'container' ? 1.54 : 1.13, l * .16);
      } else {
        part(w * .78, trafficKind === 'bus' ? .5 : .46, l * (trafficKind === 'bus' ? .8 : .48),
          '#a9c6cb', 0, tall ? 1.75 : 1.18, -.05);
      }
      if (!open) for (const x of [-w * .42, w * .42]) for (const z of [-l * .32, l * .32])
        part(.2, .42, .42, '#202a30', x, .27, z);
      for (const x of [-w * .3, w * .3]) {
        part(.2, .13, .06, '#fa9d80', x, .63, l * .45);
        part(.2, .13, .06, '#fff0ba', x, .63, -l * .45);
      }
      const service = new THREE.Group(); g.add(service); g.userData.service = service;
      const serviceX = box(.65, .12, .22, '#ba625e', service); serviceX.position.y = 1.7;
      const serviceZ = box(.22, .12, .65, '#ba625e', service); serviceZ.position.y = 1.7;
      const hpBack = part(w, .09, .04, '#29373e', 0, 2.6, 0);
      const hpFill = part(w, .1, .045, '#a0d2ae', 0, 2.6, 0);
      g.userData.hpBack = hpBack; g.userData.hpFill = hpFill;
    } else if (kind === 'passenger') {
      part(.38, .7, .28, '#e2c486', 0, .92, 0);
      part(.38, .38, .38, '#e6dbc4', 0, 1.47, 0);
      const marker = new THREE.Mesh(new THREE.OctahedronGeometry(.22), new THREE.MeshBasicMaterial({ color: '#8fd3a5' }));
      marker.position.y = 2; g.add(marker); g.userData.grabMarker = marker;
      for (const x of [-.12, .12]) part(.13, .55, .16, '#344d5a', x, .3, 0);
    } else {
      const color = kind === 'fuel' ? '#82c5a0' : '#e1ded0';
      part(.8, .8, .8, color, 0, .6, 0);
      if (kind === 'fuel') { part(.5, .12, .2, '#e6d18f', 0, 1.1, 0); part(.18, .16, .18, '#e6d18f', .22, 1.05, .15); }
      else { part(.48, .14, .03, '#a8423d', 0, .65, .415); part(.14, .48, .03, '#a8423d', 0, .65, .415); }
    }
    this.scene.add(g); return g;
  }
  draw(s: Run, previous: Run, alpha: number): void {
    this.viewState = s;
    const vehicle = activeVehicle(s);
    this.powerRing.visible = hasStar(s) || hasBoost(s);
    (this.powerRing.material as THREE.MeshBasicMaterial).color.set(hasStar(s) ? '#f7df85' : '#86d6ec');
    const tricycle = vehicle.kind === 'tricycle';
    const open = ['motorcycle', 'motorbike', 'tricycle'].includes(vehicle.kind);
    this.openFrame.visible = open && !tricycle; this.tricycleFrame.visible = tricycle;
    this.closedFrame.visible = !open;
    const scaleX = tricycle ? 1 : vehicle.width / (open ? balance.vehicleWidth : 1);
    const scaleZ = tricycle ? 1 : vehicle.length / (open ? balance.vehicleLength : 2);
    this.bike.scale.set(scaleX, 1, scaleZ);
    const x = THREE.MathUtils.lerp(previous.x, s.x, alpha);
    const distance = THREE.MathUtils.lerp(previous.distance, s.distance, alpha);
    const playerPose = pathPose(distance, s.route, s.seed);
    const playerX = playerPose.x + Math.cos(playerPose.heading) * x;
    const playerZ = playerPose.z + Math.sin(playerPose.heading) * x;
    this.bike.position.set(playerX, jumpHeight(s), playerZ);
    this.bike.rotation.set(0, -playerPose.heading, -s.lateralVelocity * .035, 'YXZ');
    this.rider.visible = !s.crash && open; this.helmet.visible = !s.crash && open;
    this.windowPassengers.forEach((person, i) => {
      person.visible = !s.crash && !open && i < s.riderIds.length;
      // Vehicle footprint stretches for bus/container; people keep human-sized proportions.
      person.scale.set(1 / scaleX, 1, 1 / scaleZ);
      const rows = Math.ceil(s.riderIds.length / 2);
      person.position.z = vehicle.kind === 'truck' || vehicle.kind === 'container' ? -.36 + Math.floor(i / 2) * .18 :
        rows <= 1 ? 0 : -.58 + Math.floor(i / 2) * 1.16 / (rows - 1);
    });
    this.bikePassengers.forEach((person, i) => {
      person.visible = !s.crash && open && i < s.riderIds.length;
      person.position.set((i % 2 ? 1 : -1) * (.15 + Math.floor(i / 2) * .09),
        1.15 + Math.floor(i / 2) * .38, .65 + Math.floor(i / 2) * .32);
      person.rotation.z = (i % 2 ? -1 : 1) * .16;
    });
    this.fallenDriver.visible = !!s.crash;
    this.fallenPassengers.forEach(person => { person.visible = false; });
    if (s.crash) {
      const { elapsed, side, originDistance, impactSpeed, returningRiderIds } = s.crash;
      const ejection = Math.min(1, elapsed / balance.driverFallSeconds);
      const returnProgress = Math.max(0, Math.min(1, (elapsed - balance.driverFallSeconds - balance.driverPauseSeconds) / balance.driverReturnSeconds));
      const away = ejection * (1 - returnProgress);
      const ejectedDistance = originDistance + impactSpeed * balance.driverEjectionSpeedFactor *
        Math.min(elapsed, balance.driverFallSeconds);
      const driverDistance = THREE.MathUtils.lerp(ejectedDistance, distance, returnProgress);
      const fallenPose = pathPose(driverDistance, s.route, s.seed);
      const driverX = x + side * (.65 + balance.driverEjectionLateralMetres * away);
      this.fallenDriver.position.set(fallenPose.x + Math.cos(fallenPose.heading) * driverX, 0,
        fallenPose.z + Math.sin(fallenPose.heading) * driverX);
      this.fallenDriver.rotation.set(0, -fallenPose.heading, side * 1.25 * away, 'YXZ');
      // Lost passengers already exist as roadside entities; only animate those returning to the vehicle.
      for (let i = 0; i < returningRiderIds.length && i < this.fallenPassengers.length; i++) {
        const person = this.fallenPassengers[i];
        person.visible = true;
        const passengerReturn = returnProgress;
        const passengerDistance = THREE.MathUtils.lerp(ejectedDistance + .7 + i * .8, distance,
          passengerReturn);
        const pose = pathPose(passengerDistance, s.route, s.seed);
        const lateral = x + side * (1.3 + i * .45) * (1 - passengerReturn);
        person.position.set(pose.x + Math.cos(pose.heading) * lateral, 0,
          pose.z + Math.sin(pose.heading) * lateral);
        const topple = 1 - passengerReturn;
        person.rotation.set(0, -pose.heading, -side * .85 * Math.min(1, ejection) * topple, 'YXZ');
      }
    }
    // Camera follows the centerline tangent, so Q/E visibly bends the road and the bike.
    const cameraExtra = Math.max(0, vehicle.length - 3.5) * .9;
    this.camera.position.set(playerX - Math.sin(playerPose.heading) * (11 + cameraExtra), 7.5 + cameraExtra * .4,
      playerZ + Math.cos(playerPose.heading) * (11 + cameraExtra));
    this.camera.lookAt(playerX + Math.sin(playerPose.heading) * 12, 0,
      playerZ - Math.cos(playerPose.heading) * 12);
    this.ground.position.set(playerPose.x, -.15, playerPose.z);
    const firstRoad = Math.floor((distance - 32) / 4) * 4;
    const roadPositions = this.roadSurface.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i <= this.roadPieces.length; i++) {
      const edgePose = pathPose(firstRoad - 2 + i * 4, s.route, s.seed);
      const sideX = Math.cos(edgePose.heading) * 4.8, sideZ = Math.sin(edgePose.heading) * 4.8;
      roadPositions.setXYZ(i * 2, edgePose.x - sideX, -.045, edgePose.z - sideZ);
      roadPositions.setXYZ(i * 2 + 1, edgePose.x + sideX, -.045, edgePose.z + sideZ);
    }
    roadPositions.needsUpdate = true;
    this.roadSurface.geometry.computeBoundingSphere();
    for (let i = 0; i < this.roadPieces.length; i++) {
      const roadDistance = firstRoad + i * 4;
      const roadPose = pathPose(roadDistance, s.route, s.seed);
      this.roadPieces[i].position.set(roadPose.x, 0, roadPose.z);
      this.roadPieces[i].rotation.y = -roadPose.heading;
      // No dashed lane markers or roadside posts across the middle of a junction.
      this.roadPieces[i].visible = [s.route.index - 1, s.route.index].every(index =>
        index < 0 || Math.abs(roadDistance - junction(s.seed, index).distance) >= 13);
    }
    for (let slot = 0; slot < this.crossings.length; slot++) {
      const index = s.route.index - 1 + slot, view = this.crossings[slot];
      if (index < 0) { view.group.visible = false; continue; }
      const cross = junction(s.seed, index), offset = cross.distance - distance;
      view.group.visible = offset <= 120 && offset >= -64;
      if (!view.group.visible) continue;
      const crossingPose = pathPose(cross.distance - 8, s.route, s.seed);
      view.group.position.set(crossingPose.x, 0, crossingPose.z);
      view.group.rotation.y = -crossingPose.heading;
      view.barrier.visible = cross.blockedStraight;
      view.straightStub.visible = index === s.route.index ? s.route.choice !== null :
        s.route.history.some(turn => turn.distance === cross.distance);
    }
    const live = new Set<string>();
    const visibleEntities = [...s.world.entities.map(entity => ({ entity, route: s.route })), ...s.world.retired];
    for (const { entity: e, route } of visibleEntities) {
      if (e.consumed || e.motionWaiting) continue;
      live.add(e.id);
      let entry = this.entityMeshes.get(e.id);
      if (!entry) { entry = { kind: e.kind, trafficKind: e.trafficKind,
        mesh: this.entityMesh(e.kind, e.trafficKind) }; this.entityMeshes.set(e.id, entry); }
      const entityPose = pathPose(e.distance, route, s.seed);
      const pose = passengerPose(e, s.activeSeconds);
      const entityX = e.x + (e.kind === 'shop' ? Math.sign(e.x) * 2.8 : 0);
      entry.mesh.visible = true; entry.mesh.position.set(entityPose.x + Math.cos(entityPose.heading) * entityX, pose.height,
        entityPose.z + Math.sin(entityPose.heading) * entityX);
      entry.mesh.rotation.set(0, -entityPose.heading + (e.kind === 'traffic' && (e.baseSpeed ?? e.speed) < 0 ? Math.PI : 0),
        pose.roll, 'YXZ');
      if (e.kind === 'cargo') {
        (entry.mesh.userData.cargoBody as THREE.Mesh<THREE.BoxGeometry, THREE.MeshLambertMaterial>).material.color.set(e.cargoType === 'barrel' ? '#797f86' : '#b38b61');
        entry.mesh.rotation.z = (e.cargoVelocityX ?? 0) * s.activeSeconds * 1.5;
      }
      if (e.kind === 'traffic') {
        (entry.mesh.userData.service as THREE.Group).visible = e.serviceRole === 'ambulance';
        const hpFill = entry.mesh.userData.hpFill as THREE.Mesh, hpBack = entry.mesh.userData.hpBack as THREE.Mesh;
        hpFill.visible = hpBack.visible = !!s.world.prototype;
        hpFill.scale.x = Math.max(0, (e.hp ?? 0) / trafficTypes[e.trafficKind ?? 'car4'].hp);
        hpFill.position.x = -(1 - hpFill.scale.x) * e.width / 2;
        const body = entry.mesh.userData.body as THREE.Mesh;
        (body.material as THREE.MeshLambertMaterial).color.set(e.wrecked ? '#4e5558' : e.serviceRole === 'ambulance' ? '#d2dedd' :
          trafficTypes[e.trafficKind ?? 'car4'].color);
      }
      if (e.kind === 'train') entry.mesh.visible = !!e.crossMotion || trainClosed(e, s.activeSeconds);
      if (e.kind === 'police' || e.kind === 'militia') {
        (entry.mesh.userData.human as THREE.Group).visible = !!e.groupId;
        (entry.mesh.userData.legacy as THREE.Mesh).visible = !e.groupId;
        (entry.mesh.userData.stunMark as THREE.Mesh).visible = e.stunned === true;
        ((entry.mesh.userData.torso as THREE.Mesh).material as THREE.MeshLambertMaterial).color.set(e.stunned ? '#d3b66a' : e.kind === 'police' ? '#698da8' : '#85906b');
      }
      if (e.kind === 'passenger') (entry.mesh.userData.grabMarker as THREE.Mesh).visible = e.passengerType === 'grab';
      const baseWidth = e.kind === 'wind' ? 9.6 : e.kind === 'water' ? 3.2 : e.kind === 'pothole' ? 1.5 : e.kind === 'traffic' ? 1.9 : e.kind === 'passenger' ? .7 : .8;
      const baseLength = e.kind === 'wind' ? 65 : e.kind === 'water' ? 7 : e.kind === 'pothole' ? 1.8 : e.kind === 'traffic' ? 3.6 : e.kind === 'passenger' ? .7 : .8;
      entry.mesh.scale.set(e.kind === 'traffic' || e.kind === 'shop' ? 1 : e.width / baseWidth, 1,
        e.kind === 'traffic' || e.kind === 'shop' ? 1 : e.length / baseLength);
    }
    for (const [id, entry] of this.entityMeshes) if (!live.has(id)) {
      entry.mesh.visible = false;
      if (entry.kind === 'traffic') {
        const kind = entry.trafficKind ?? 'car4';
        const pool = this.trafficPools.get(kind) ?? []; pool.push(entry.mesh); this.trafficPools.set(kind, pool);
      } else this.pools[entry.kind].push(entry.mesh);
      this.entityMeshes.delete(id);
    }
    this.renderer.render(this.scene, this.camera);
    const tail = this.project(x, 0, vehicle.length / 2 + .45);
    this.host.style.setProperty('--bike-x', `${Math.max(30, Math.min(70, tail.x))}%`);
    this.host.style.setProperty('--bike-tail-y', `${Math.max(76, Math.min(86, tail.y))}%`);
  }
  project(x: number, y: number, z: number): { x: number; y: number } {
    const p = pathPose(this.viewState.distance - z, this.viewState.route, this.viewState.seed);
    this.projected.set(p.x + Math.cos(p.heading) * x, y, p.z + Math.sin(p.heading) * x).project(this.camera);
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
