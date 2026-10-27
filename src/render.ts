import { isSpecial, trainClosed } from './special-events';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { balance, movingBalance } from './config';
import { jumpHeight, hasStar, hasBoost } from './items';
import { activeVehicle, type Run } from './survival';
import { passengerPose, trafficTypes, type EntityKind, type TrafficKind } from './world';
import { junction, pathPose } from './route';
import { car7BodyCenterX, containerParts, heavyFrontCenterX } from './tail-sweep';
import { LANDSCAPE_REGION_METRES, landscapeColors, roadsidePoint, roadsideRegions, type LandscapeKind } from './landscape';
import { attachArticulatedContainerArt, attachVehicleArtToPrototype } from './art/prototype-adapter';
import { createVehicleArt, type VehicleArt } from './art/vehicle-catalog';
import { createPropHazardArt, createSurfaceHazardArt, type HazardArt } from './art/hazards';
import { createOfficerArt, createTrainArt, createVendorArt, type MovingArt } from './art/moving-events';
import { createAccidentArt, createShopArt } from './art/special-hazards';
import { createRoadTileArt } from './art/road-kit';
import { createJunctionAsphaltMaterial, createJunctionTurnArt, type JunctionTurnArt } from './art/junction-turn';
import { configureStormRenderer, createStormLighting, gameplayAccentLayer, gradeStormCityBuilding, shadePlacedStormCityFacades } from './art/storm-lighting';
import { createBendSceneryStrip, createSceneryCluster, mountBlenderCityMarket, mountBlenderCityMidrise, mountBlenderCityShop, mountBlenderCitySkyline, mountBlenderCoastalBoat, optimizeNearScenery, scenerySectionCrossesTurn, type SceneryArt } from './art/scenery';
import { createRainArt, createRainSplashArt, type RainArt } from './art/weather';
import { createCloudShadowArt, type CloudShadowArt } from './art/cloud-shadows';
import { createStormPostProcessing } from './art/storm-post';
import { passengerWindowPoses } from './art/passenger-windows';
import { createWindStreakArt, type WindStreakArt } from './art/wind-streaks';
import { createPersonArt, mountPersonOnSeat, type PersonArt, type PersonArchetype } from './art/people';
import { openPassengerSeat } from './art/open-passengers';
import { roadsideArchetype, roadsidePose, roadsideWalkingYaw } from './art/runtime-people';
import { driverCrashPose, passengerCrashPose } from './art/timing';
import { createCrashBlenderDriver, createRidingBlenderDriver, type AnimatedBlenderDriver,
  type CrashBlenderDriver } from './art/blender-driver';
import type { VehicleKind } from './vehicles';

interface JunctionView { group: THREE.Group; straightStub: THREE.Group; barrier: THREE.Mesh;
  turnRoad: JunctionTurnArt;
  landscapeStub: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshLambertMaterial>[] }

export class RoadRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(52, 9 / 16, 0.1, 180);
  private stormLighting: ReturnType<typeof createStormLighting>;
  private stormPost: ReturnType<typeof createStormPostProcessing>;
  private bike = new THREE.Group();
  private playerArt = new Map<VehicleKind, VehicleArt>();
  private playerDrivers = new Map<VehicleKind, PersonArt>();
  private openPassengerModels = new Map<VehicleKind, Map<string, PersonArt>>();
  private playerBlenderDrivers = new Map<VehicleKind, AnimatedBlenderDriver>();
  private driverTemplate: THREE.Group | null = null;
  private powerRing!: THREE.Mesh;
  private openFrame = new THREE.Group();
  private tricycleFrame = new THREE.Group();
  private closedFrame = new THREE.Group();
  private windowPassengerFrame = new THREE.Group();
  private tractorFrame = new THREE.Group();
  private trailerFrame = new THREE.Group();
  private tractorPlaceholder = new THREE.Group();
  private trailerPlaceholder = new THREE.Group();
  private windowPassengers: THREE.Group[] = [];
  private tractorPassengers: THREE.Group[] = [];
  private rider!: THREE.Mesh;
  private helmet!: THREE.Mesh;
  private fallenDriver = new THREE.Group();
  private fallenDriverArt!: PersonArt;
  private fallenBlenderDriver: CrashBlenderDriver | null = null;
  private bikePassengers: THREE.Group[] = [];
  private fallenPassengerModels = new Map<string, PersonArt>();
  private roadPieces: THREE.Group[] = [];
  private roadSurface!: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  private ground!: THREE.Mesh;
  private landscapeBands: THREE.Mesh<THREE.BufferGeometry, THREE.MeshLambertMaterial> | null = null;
  private landscapeMaterials: Record<LandscapeKind, THREE.MeshLambertMaterial> | null = null;
  private cloudShadows: CloudShadowArt | null = null;
  private scenery = new Map<string, SceneryArt>();
  private cityMidriseTemplate: THREE.Object3D | null = null;
  private citySkylineTemplate: THREE.Object3D | null = null;
  private cityShopTemplate: THREE.Object3D | null = null;
  private cityMarketTemplate: THREE.Object3D | null = null;
  private coastalBoatTemplate: THREE.Object3D | null = null;
  private disposed = false;
  private rainSeed = NaN;
  private rain?: RainArt;
  private rainSplashes?: RainArt;
  private viewState!: Run;
  private entityMeshes = new Map<string, { kind: EntityKind; trafficKind?: TrafficKind; mesh: THREE.Group }>();
  private pools: Record<EntityKind, THREE.Group[]> = { wind: [], water: [], pothole: [], traffic: [], cargo: [], fuel: [], repair: [], passenger: [], shop: [], police: [], militia: [], train: [], accident: [], jam: [], broken: [] };
  private trafficPools = new Map<TrafficKind, THREE.Group[]>();
  private passengerPools = new Map<PersonArchetype, THREE.Group[]>();
  private makeBox!: (w: number, h: number, d: number, color: string, parent?: THREE.Object3D) => THREE.Mesh;
  private observer: ResizeObserver;
  private host: HTMLElement;
  private projected = new THREE.Vector3();
  private crossings: JunctionView[] = [];
  constructor(canvas: HTMLCanvasElement, host: HTMLElement, private forceMode = false) {
    this.host = host;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    configureStormRenderer(this.renderer);
    this.stormLighting = createStormLighting(this.scene);
    this.stormPost = createStormPostProcessing(this.renderer, this.scene, this.camera);
    new GLTFLoader().load(new URL('../assets/art/driver-adjusted-delivery.glb', import.meta.url).href,
      gltf => {
        if (this.disposed) return;
        this.driverTemplate = gltf.scene;
        for (const kind of this.playerDrivers.keys()) this.attachBlenderDriver(kind);
        try {
          this.fallenBlenderDriver = createCrashBlenderDriver(gltf.scene);
          this.fallenDriver.add(this.fallenBlenderDriver);
          this.fallenDriverArt.root.visible = false;
        } catch { /* Keep the procedural crash driver if pose pivots are unavailable. */ }
      });
    if (this.forceMode) new GLTFLoader().load(
      new URL('../assets/art/roadside-midrise.glb', import.meta.url).href,
      gltf => {
        if (this.disposed) return;
        gradeStormCityBuilding(gltf.scene);
        this.cityMidriseTemplate = gltf.scene;
        this.refreshNearCityScenery();
      });
    if (this.forceMode) new GLTFLoader().load(
      new URL('../assets/art/skyline-shophouse.glb', import.meta.url).href,
      gltf => {
        if (this.disposed) return;
        gradeStormCityBuilding(gltf.scene);
        this.citySkylineTemplate = gltf.scene;
        this.refreshNearCityScenery();
      });
    if (this.forceMode) new GLTFLoader().load(
      new URL('../assets/art/roadside-shop.glb', import.meta.url).href,
      gltf => {
        if (this.disposed) return;
        gradeStormCityBuilding(gltf.scene);
        this.cityShopTemplate = gltf.scene;
        this.refreshNearCityScenery();
      });
    if (this.forceMode) new GLTFLoader().load(
      new URL('../assets/art/corner-market.glb', import.meta.url).href,
      gltf => {
        if (this.disposed) return;
        gradeStormCityBuilding(gltf.scene);
        this.cityMarketTemplate = gltf.scene;
        this.refreshNearCityScenery();
      });
    if (this.forceMode) new GLTFLoader().load(
      new URL('../assets/art/coastal-fishing-boat.glb', import.meta.url).href,
      gltf => {
        if (this.disposed) return;
        this.coastalBoatTemplate = gltf.scene;
        this.refreshNearSeaScenery();
      });
    this.stormLighting.sun.shadow.mapSize.set(1024, 1024);
    this.stormLighting.sun.shadow.blurSamples = 8;
    this.camera.layers.enable(gameplayAccentLayer);
    const box = (w: number, h: number, d: number, color: string, parent: THREE.Object3D = this.scene) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
      parent.add(mesh); return mesh;
    };
    this.makeBox = box;
    this.ground = box(600, 0.1, 600, '#425951'); this.ground.position.y = -.15;
    if (this.forceMode) {
      this.landscapeMaterials = Object.fromEntries(Object.entries(landscapeColors).map(([kind, color]) =>
        [kind, new THREE.MeshLambertMaterial({ color })])) as Record<keyof typeof landscapeColors, THREE.MeshLambertMaterial>;
      // Flat color shoulders follow the centerline; the road covers their shared seam.
      const bandGeometry = new THREE.BufferGeometry();
      const bandValues = 52 * 2 * 6 * 3;
      bandGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bandValues), 3));
      bandGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(bandValues), 3));
      this.landscapeBands = new THREE.Mesh(bandGeometry, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
      this.landscapeBands.receiveShadow = true;
      this.scene.add(this.landscapeBands);
      this.cloudShadows = createCloudShadowArt();
      this.scene.add(this.cloudShadows.root);
    }
    const roadGeometry = new THREE.BufferGeometry();
    roadGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(53 * 2 * 3), 3));
    const roadIndices: number[] = [];
    for (let i = 0; i < 52; i++) roadIndices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    roadGeometry.setIndex(roadIndices);
    this.roadSurface = new THREE.Mesh(roadGeometry, new THREE.MeshBasicMaterial({ color: '#525b54', side: THREE.DoubleSide }));
    this.scene.add(this.roadSurface);
    for (let i = 0; i < 52; i++) {
      const piece = new THREE.Group(); this.scene.add(piece); this.roadPieces.push(piece);
      const art = createRoadTileArt(i < 14 ? 'near' : 'far');
      art.setWetness(.7);
      art.root.traverse(object => { if (object instanceof THREE.Mesh) object.receiveShadow = true; });
      piece.add(art.root);
    }
    for (let i = 0; i < 2; i++) {
      const group = new THREE.Group(), straightStub = new THREE.Group();
      this.scene.add(group); group.add(straightStub);
      // Continuous asphalt follows the chosen quarter turn and joins the cross street.
      const turnRoad = createJunctionTurnArt(); group.add(turnRoad.root);
      const oldRoad = new THREE.Mesh(new THREE.BoxGeometry(9.6, .04, 190),
        createJunctionAsphaltMaterial());
      oldRoad.position.set(0, -.08, -95);
      oldRoad.receiveShadow = true;
      straightStub.add(oldRoad);
      const oldEdgeMaterial = new THREE.MeshStandardMaterial({ color: '#e0d7b3', roughness: 1 });
      const oldLaneMaterial = new THREE.MeshStandardMaterial({ color: '#c5d3c4', roughness: 1 });
      for (const side of [-1, 1]) {
        const edge = new THREE.Mesh(new THREE.BoxGeometry(.12, .025, 150), oldEdgeMaterial);
        edge.position.set(side * 4.9, -.035, -95); straightStub.add(edge);
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(.09, .025, 150), oldLaneMaterial);
        stripe.position.set(side * balance.laneWidth / 2, -.035, -95); straightStub.add(stripe);
      }
      const landscapeStub: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshLambertMaterial>[] = [];
      if (this.landscapeMaterials) {
        const shoulderGeometry = new THREE.PlaneGeometry(30, 1);
        for (let i = 0; i < 8; i++) {
          const shoulder = new THREE.Mesh(shoulderGeometry, this.landscapeMaterials.city);
          shoulder.rotation.x = -Math.PI / 2;
          shoulder.position.y = -.09;
          shoulder.receiveShadow = true;
          straightStub.add(shoulder);
          landscapeStub.push(shoulder);
        }
      }
      const barrier = box(9.2, .7, .35, '#d39468', group); barrier.position.set(0, .36, -12);
      this.crossings.push({ group, straightStub, barrier, turnRoad, landscapeStub });
    }
    this.scene.add(this.bike);
    this.bike.add(this.openFrame, this.tricycleFrame, this.closedFrame,
      this.windowPassengerFrame, this.tractorFrame);
    this.scene.add(this.trailerFrame);
    this.tractorFrame.add(this.tractorPlaceholder);
    this.trailerFrame.add(this.trailerPlaceholder);
    this.powerRing = new THREE.Mesh(new THREE.TorusGeometry(1.5, .06, 4, 20), new THREE.MeshBasicMaterial({ color: '#f7df85' }));
    this.powerRing.rotation.x = Math.PI / 2; this.powerRing.position.y = .15; this.bike.add(this.powerRing);
    const body = box(0.65, 0.42, 1.5, '#dbb55c', this.openFrame); body.position.y = 0.65;
    for (const z of [-0.68, 0.68]) { const wheel = box(0.22, 0.48, 0.46, '#172126', this.openFrame); wheel.position.set(0, 0.25, z); }
    const shell = box(1, .8, 2, '#d0ad68', this.closedFrame); shell.position.y = .75;
    const cabin = box(.82, .48, 1.05, '#7a9a9e', this.closedFrame); cabin.position.set(0, 1.36, -.12);
    this.windowPassengers = this.addWindowPassengers(this.windowPassengerFrame, 1, 2, balance.riderLimit, 1.24);
    const tractorBase = box(1.65, .8, 4.1, '#d0ad68', this.tractorPlaceholder); tractorBase.position.y = .8;
    const tractorCab = box(1.55, 1.15, 2.5, '#d0ad68', this.tractorPlaceholder); tractorCab.position.set(0, 1.55, -.65);
    const tractorGlass = box(1.4, .55, .08, '#7a9a9e', this.tractorPlaceholder); tractorGlass.position.set(0, 1.75, -1.94);
    this.tractorPassengers = this.addWindowPassengers(this.tractorFrame, 1.55, 2.5, 1, 1.85);
    this.tractorPassengers[0].position.z = -.65;
    for (const side of [-1, 1]) for (const z of [-1.55, 1.35]) {
      const wheel = box(.35, .63, .7, '#172126', this.tractorPlaceholder); wheel.position.set(side * .89, .32, z);
    }
    const trailerBox = box(1.8, 1.55, 9.4, '#a98d66', this.trailerPlaceholder); trailerBox.position.y = 1.38;
    for (const side of [-1, 1]) for (const z of [2.8, 3.7]) {
      const wheel = box(.35, .64, .7, '#172126', this.trailerPlaceholder); wheel.position.set(side * 1.02, .32, z);
    }
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
    }
    this.scene.add(this.fallenDriver);
    this.fallenDriverArt = createPersonArt('driver');
    this.fallenDriver.add(this.fallenDriverArt.root);
    const lamp = box(0.3, 0.16, 0.05, '#fff0ba', this.openFrame); lamp.position.set(0, 0.72, -0.77);
    this.observer = new ResizeObserver(() => {
      const { width, height } = host.getBoundingClientRect();
      this.renderer.setSize(width, height, false);
      this.stormPost.setSize(width, height);
      this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
    });
    this.observer.observe(host);
  }
  /** Small upper bodies lean beyond each side window; the driver is never included. */
  private addWindowPassengers(parent: THREE.Group, width: number, length: number, count: number, height: number): THREE.Group[] {
    const passengers: THREE.Group[] = [];
    const torsoGeometry = new THREE.CylinderGeometry(.12, .16, .27, 5);
    const headGeometry = new THREE.IcosahedronGeometry(.145, 1);
    const coats = ['#9cb7a6', '#d59b79'].map(color =>
      new THREE.MeshLambertMaterial({ color, flatShading: true }));
    const skin = new THREE.MeshLambertMaterial({ color: '#e6d8bd', flatShading: true });
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1;
      const row = Math.floor(i / 2);
      const rows = Math.ceil(count / 2);
      const z = rows === 1 ? 0 : -length * .32 + row * length * .64 / (rows - 1);
      const person = new THREE.Group(); parent.add(person);
      person.position.set(side * (width * .5 + .08), height, z);
      person.rotation.z = -side * .22;
      const torso = new THREE.Mesh(torsoGeometry, coats[i % coats.length]);
      torso.position.y = -.11; person.add(torso);
      const head = new THREE.Mesh(headGeometry, skin);
      head.name = 'window_head';
      head.position.y = .13; person.add(head);
      person.visible = false; passengers.push(person);
    }
    return passengers;
  }
  private attachBlenderDriver(kind: VehicleKind): void {
    if (!this.driverTemplate || this.playerBlenderDrivers.has(kind)) return;
    const driver = this.playerDrivers.get(kind);
    const seat = driver?.root.parent;
    if (!driver || !seat) return;
    try {
      const model = createRidingBlenderDriver(this.driverTemplate);
      seat.add(model);
      model.position.copy(driver.root.position);
      model.visible = driver.root.visible;
      driver.root.visible = false;
      this.playerBlenderDrivers.set(kind, model);
    } catch { /* Keep the procedural driver if the delivered GLB has incompatible pivots. */ }
  }
  private syncOpenPassengers(kind: VehicleKind, art: VehicleArt, riderIds: string[], visualTime: number): number {
    const visibleIds = riderIds;
    let models = this.openPassengerModels.get(kind);
    if (!models) { models = new Map(); this.openPassengerModels.set(kind, models); }
    for (const [id, person] of models) if (!visibleIds.includes(id)) {
      person.root.removeFromParent(); person.dispose(); models.delete(id);
    }
    visibleIds.forEach((id, index) => {
      let person = models!.get(id);
      if (!person) {
        person = createPersonArt(roadsideArchetype(id), 'near');
        models!.set(id, person);
      }
      mountPersonOnSeat(person, openPassengerSeat(art, kind, index),
        kind === 'tricycle' ? 'seated' : 'riding');
      person.setPose(kind === 'tricycle' ? 'seated' : 'riding', visualTime * .4 % 1);
      person.root.visible = true;
    });
    return visibleIds.length;
  }
  private entityMesh(kind: EntityKind, trafficKind: TrafficKind = 'car4', width = 1, length = 1,
    passengerCast?: PersonArchetype): THREE.Group {
    const pool = kind === 'traffic' ? this.trafficPools.get(trafficKind) ?? [] :
      kind === 'passenger' && passengerCast ? this.passengerPools.get(passengerCast) ?? [] : this.pools[kind];
    const pooled = pool.pop(); if (pooled) return pooled;
    const g = new THREE.Group(), box = this.makeBox;
    const part = (w: number, h: number, d: number, color: string, x: number, y: number, z: number) => {
      const m = box(w, h, d, color, g); m.position.set(x, y, z); return m;
    };
    if (kind === 'train') {
      const art = createTrainArt(1, 'far');
      g.add(art.root); g.userData.movingArt = art;
    } else if (kind === 'police' || kind === 'militia') {
      const art = createOfficerArt(kind);
      art.root.rotation.y = Math.PI;
      g.add(art.root); g.userData.movingArt = art;
    } else if (isSpecial(kind)) {
      if (kind === 'accident') {
        const art = createAccidentArt('far'); g.add(art.root);
      } else if (kind === 'jam') {
        const barrier = createPropHazardArt('barrier', 'far');
        const vendor = createVendorArt('far');
        g.add(barrier.root, vendor.root);
        g.userData.barrierArt = barrier; g.userData.vendorArt = vendor;
      } else {
        part(.8, 1.1, .8, '#9a8e78', 0, .55, 0);
        part(.8, .1, .15, '#eee3bc', 0, .7, .42);
      }
    } else if (kind === 'shop') {
      const art = createShopArt('far'); g.add(art.root);
    }
    else if (kind === 'wind') {
      const art = createWindStreakArt(width, length);
      g.add(art.root); g.userData.windArt = art;
    }
    else if (kind === 'water' || kind === 'pothole') {
      const art = createSurfaceHazardArt(kind, width, length, 'near');
      g.add(art.root); g.userData.hazardArt = art;
    } else if (kind === 'cargo') {
      const crate = createPropHazardArt('cargo_crate');
      const barrel = createPropHazardArt('cargo_barrel');
      g.add(crate.root, barrel.root);
      g.userData.cargoCrate = crate; g.userData.cargoBarrel = barrel;
    } else if (kind === 'traffic') {
      const d = trafficTypes[trafficKind], w = d.width;
      const service = new THREE.Group(); g.add(service); g.userData.service = service;
      const serviceX = box(.65, .12, .22, '#ba625e', service); serviceX.position.y = 1.7;
      const serviceZ = box(.22, .12, .65, '#ba625e', service); serviceZ.position.y = 1.7;
      const hpBack = part(w, .09, .04, '#29373e', 0, 2.6, 0);
      const hpFill = part(w, .1, .045, '#a0d2ae', 0, 2.6, 0);
      g.userData.hpBack = hpBack; g.userData.hpFill = hpFill;
      const art = createVehicleArt(trafficKind, 'traffic', 'far', d.color);
      art.root.rotation.y = Math.PI;
      g.add(art.root);
      g.userData.trafficArt = art;
    } else if (kind === 'passenger') {
      const person = createPersonArt(passengerCast ?? 'commuter', 'far');
      g.add(person.root); g.userData.personArt = person;
      g.userData.passengerCast = passengerCast ?? 'commuter';
      const marker = new THREE.Mesh(new THREE.OctahedronGeometry(.22), new THREE.MeshBasicMaterial({ color: '#8fd3a5' }));
      marker.position.y = 2; g.add(marker); g.userData.grabMarker = marker;
    } else {
      const art = createPropHazardArt(kind === 'fuel' ? 'fuel' : 'repair');
      g.add(art.root); g.userData.hazardArt = art;
    }
    this.scene.add(g); return g;
  }
  draw(s: Run, previous: Run, alpha: number): void {
    this.viewState = s;
    // Character gestures communicate movement and pickup state; they stay
    // visible even when optional screen motion is reduced by the OS.
    const visualTime = s.activeSeconds;
    const vehicle = activeVehicle(s);
    this.powerRing.visible = hasStar(s) || hasBoost(s);
    (this.powerRing.material as THREE.MeshBasicMaterial).color.set(hasStar(s) ? '#f7df85' : '#86d6ec');
    const tricycle = vehicle.kind === 'tricycle';
    const open = ['motorcycle', 'motorbike', 'tricycle'].includes(vehicle.kind);
    const articulated = this.forceMode && vehicle.kind === 'container';
    const useSourceArt = true;
    if (useSourceArt && !this.playerArt.has(vehicle.kind)) {
      const art = createVehicleArt(vehicle.kind, 'player', 'near');
      if (open) {
        const driver = createPersonArt('driver');
        const seat = Array.isArray(art.seats) ? art.seats[0] : art.seats.driver;
        mountPersonOnSeat(driver, seat, 'riding');
        this.playerDrivers.set(vehicle.kind, driver);
        this.attachBlenderDriver(vehicle.kind);
      }
      if (this.forceMode && vehicle.kind === 'container' && 'trailer' in art && art.trailer)
        attachArticulatedContainerArt(this.tractorFrame, this.trailerFrame, art);
      else attachVehicleArtToPrototype(this.bike, art);
      this.playerArt.set(vehicle.kind, art);
    }
    for (const [kind, art] of this.playerArt) art.root.visible = useSourceArt && kind === vehicle.kind;
    if (useSourceArt) {
      const ratio = s.durability / vehicle.durabilityCapacity;
      this.playerArt.get(vehicle.kind)!.setCondition(ratio <= 0 ? 'destroyed' :
        ratio < .45 ? 'damaged' : ratio < .8 ? 'used' : 'clean');
    }
    this.openFrame.visible = !useSourceArt && open && !tricycle;
    this.tricycleFrame.visible = !useSourceArt && tricycle;
    this.closedFrame.visible = !useSourceArt && !open && !articulated;
    this.windowPassengerFrame.visible = !s.crash && !open && !articulated;
    this.windowPassengerFrame.rotation.y = useSourceArt ? Math.PI : 0;
    this.tractorFrame.visible = articulated;
    this.trailerFrame.visible = articulated;
    this.tractorPlaceholder.visible = !useSourceArt;
    this.trailerPlaceholder.visible = !useSourceArt;
    const scaleX = articulated ? 1 : tricycle ? 1 : vehicle.width / (open ? balance.vehicleWidth : 1);
    const scaleZ = articulated ? 1 : tricycle ? 1 : vehicle.length / (open ? balance.vehicleLength : 2);
    this.bike.scale.set(useSourceArt ? 1 : scaleX, 1, useSourceArt ? 1 : scaleZ);
    const x = THREE.MathUtils.lerp(previous.x, s.x, alpha);
    const distance = THREE.MathUtils.lerp(previous.distance, s.distance, alpha);
    const playerPose = pathPose(distance, s.route, s.seed);
    this.cloudShadows?.update(s.seed, distance, s.route);
    const playerX = playerPose.x + Math.cos(playerPose.heading) * x;
    const playerZ = playerPose.z + Math.sin(playerPose.heading) * x;
    this.stormLighting.setAnchor(playerX, playerZ);
    if (this.rainSeed !== s.seed) {
      for (const art of [this.rain, this.rainSplashes]) if (art) {
        this.scene.remove(art.root); art.dispose();
      }
      this.rainSeed = s.seed;
      this.rain = createRainArt(s.seed, 300);
      this.rainSplashes = createRainSplashArt(s.seed, 110);
      this.rain.setIntensity(.34);
      this.rainSplashes.setIntensity(.20);
      this.scene.add(this.rain.root, this.rainSplashes.root);
    }
    this.rain!.update(s.activeSeconds, playerX, playerZ - 18);
    this.rainSplashes!.update(s.activeSeconds, playerX, playerZ - 18);
    const yaw = THREE.MathUtils.lerp(previous.forceYaw, s.forceYaw, alpha);
    const bodyX = !this.forceMode ? x : vehicle.kind === 'car7' ?
      car7BodyCenterX(x, vehicle.length, yaw) : vehicle.kind === 'bus' || vehicle.kind === 'truck' ?
        heavyFrontCenterX(vehicle.kind, x, vehicle.length, yaw) : x;
    const parts = articulated ? containerParts(x, distance, yaw,
      THREE.MathUtils.lerp(previous.forceTrailerRearX, s.forceTrailerRearX, alpha)) : null;
    const bodyPose = parts ? pathPose(parts.tractorDistance, s.route, s.seed) : playerPose;
    this.bike.position.set(bodyPose.x + Math.cos(bodyPose.heading) * bodyX,
      jumpHeight(s), bodyPose.z + Math.sin(bodyPose.heading) * bodyX);
    if (parts) {
      const trailerPose = pathPose(parts.trailerDistance, s.route, s.seed);
      this.trailerFrame.position.set(trailerPose.x + Math.cos(trailerPose.heading) * parts.trailerX,
        jumpHeight(s), trailerPose.z + Math.sin(trailerPose.heading) * parts.trailerX);
      this.trailerFrame.rotation.set(0, -trailerPose.heading - parts.trailerYaw, 0, 'YXZ');
    }
    const lateralAcceleration = (s.lateralVelocity - previous.lateralVelocity) / balance.fixedStep;
    const lean = THREE.MathUtils.clamp(-(s.lateralVelocity * .035 + lateralAcceleration * .012) * vehicle.leanFactor,
      -.34, .34);
    this.bike.rotation.set(0, -bodyPose.heading - yaw, lean, 'YXZ');
    this.rider.visible = !useSourceArt && !s.crash && open;
    this.helmet.visible = !useSourceArt && !s.crash && open;
    for (const [kind, driver] of this.playerDrivers) {
      const visible = kind === vehicle.kind && !s.crash;
      driver.root.visible = visible && !this.playerBlenderDrivers.has(kind);
      if (visible) driver.setPose('riding', visualTime * .4 % 1);
      const model = this.playerBlenderDrivers.get(kind);
      if (model) { model.visible = visible; if (visible) model.setVisualTime(visualTime); }
    }
    const windowPoses = useSourceArt ? passengerWindowPoses(vehicle.kind, s.riderIds.length) : [];
    this.windowPassengers.forEach((person, i) => {
      person.visible = i < s.riderIds.length && (!useSourceArt || i < windowPoses.length);
      if (useSourceArt && windowPoses[i]) {
        const pose = windowPoses[i];
        person.position.set(pose.x, pose.y, pose.z);
        person.rotation.z = -Math.sign(pose.x) * .22 + Math.sin(visualTime * 2.2 + i) * .025;
        person.scale.setScalar(1);
      } else {
        // Prototype bodies stretch for large vehicles; the people do not.
        person.scale.set(1 / scaleX, 1, 1 / scaleZ);
        const rows = Math.ceil(s.riderIds.length / 2);
        person.position.z = vehicle.kind === 'truck' || vehicle.kind === 'container' ? -.36 + Math.floor(i / 2) * .18 :
          rows <= 1 ? 0 : -.58 + Math.floor(i / 2) * 1.16 / (rows - 1);
      }
      person.getObjectByName('window_head')!.rotation.y = Math.sin(visualTime * 1.6 + i) * .08;
    });
    this.tractorPassengers.forEach((person, i) => {
      person.visible = articulated && !s.crash && i < s.riderIds.length;
      if (useSourceArt) person.position.set(-1.20, 2.19, -.78);
      person.rotation.z = Math.sin(visualTime * 2.2 + i) * .025;
    });
    const modeledPassengers = useSourceArt && open ?
      this.syncOpenPassengers(vehicle.kind, this.playerArt.get(vehicle.kind)!, s.riderIds, visualTime) : 0;
    this.bikePassengers.forEach((person, i) => {
      person.visible = !s.crash && open && i < s.riderIds.length && (!useSourceArt || i >= modeledPassengers);
      person.position.set((i % 2 ? 1 : -1) * (.15 + Math.floor(i / 2) * .09),
        1.15 + Math.floor(i / 2) * .38, .65 + Math.floor(i / 2) * .32);
      person.rotation.z = (i % 2 ? -1 : 1) * .16 + Math.sin(visualTime * 2.2 + i) * .025;
    });
    this.fallenDriver.visible = !!s.crash;
    if (s.crash) {
      const crashPose = driverCrashPose(s.crash.elapsed);
      if (this.fallenBlenderDriver) this.fallenBlenderDriver.setTimedPose(crashPose);
      else this.fallenDriverArt.setPose(crashPose.pose, crashPose.phase);
    }
    if (!s.crash) for (const [id, person] of this.fallenPassengerModels) {
      person.root.removeFromParent(); person.dispose(); this.fallenPassengerModels.delete(id);
    }
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
      for (let i = 0; i < returningRiderIds.length; i++) {
        const id = returningRiderIds[i];
        let person = this.fallenPassengerModels.get(id);
        if (!person) {
          person = createPersonArt(roadsideArchetype(id), 'far');
          this.scene.add(person.root); this.fallenPassengerModels.set(id, person);
        }
        const timed = passengerCrashPose(elapsed);
        person.setPose(timed.pose, timed.phase);
        const passengerReturn = returnProgress;
        const passengerDistance = THREE.MathUtils.lerp(ejectedDistance + .7 + i * .8, distance,
          passengerReturn);
        const pose = pathPose(passengerDistance, s.route, s.seed);
        const lateral = x + side * (1.3 + i * .45) * (1 - passengerReturn);
        person.root.position.set(pose.x + Math.cos(pose.heading) * lateral, 0,
          pose.z + Math.sin(pose.heading) * lateral);
        const topple = 1 - passengerReturn;
        person.root.rotation.set(0, -pose.heading, -side * .85 * Math.min(1, ejection) * topple, 'YXZ');
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
    const roadSamples: ReturnType<typeof pathPose>[] = [];
    for (let i = 0; i <= this.roadPieces.length; i++) {
      const edgePose = pathPose(firstRoad - 2 + i * 4, s.route, s.seed);
      roadSamples.push(edgePose);
      const sideX = Math.cos(edgePose.heading) * 4.8, sideZ = Math.sin(edgePose.heading) * 4.8;
      roadPositions.setXYZ(i * 2, edgePose.x - sideX, -.045, edgePose.z - sideZ);
      roadPositions.setXYZ(i * 2 + 1, edgePose.x + sideX, -.045, edgePose.z + sideZ);
    }
    roadPositions.needsUpdate = true;
    this.roadSurface.geometry.computeBoundingSphere();
    if (this.landscapeBands) {
      const positions = this.landscapeBands.geometry.getAttribute('position') as THREE.BufferAttribute;
      const colors = this.landscapeBands.geometry.getAttribute('color') as THREE.BufferAttribute;
      const colorAt = (metres: number, side: -1 | 1): THREE.Color => {
        const boundary = Math.round(metres / LANDSCAPE_REGION_METRES) * LANDSCAPE_REGION_METRES;
        const pick = (at: number) => {
          const pair = roadsideRegions(s.seed, at);
          return this.landscapeMaterials![side < 0 ? pair.left : pair.right].color;
        };
        if (Math.abs(metres - boundary) >= 8) return pick(metres);
        return pick(boundary - .01).clone().lerp(pick(boundary + .01),
          (metres - boundary + 8) / 16);
      };
      for (let i = 0; i < this.roadPieces.length; i++) {
        const start = roadSamples[i], end = roadSamples[i + 1];
        for (const [sideIndex, side] of ([-1, 1] as const).entries()) {
          const startColor = colorAt(firstRoad - 2 + i * 4, side);
          const endColor = colorAt(firstRoad + 2 + i * 4, side);
          const vertex = (i * 2 + sideIndex) * 6;
          const a = roadsidePoint(start, side, 0), b = roadsidePoint(start, side, 30);
          const c = roadsidePoint(end, side, 0), d = roadsidePoint(end, side, 30);
          for (const [j, xy] of [a, b, c, b, d, c].entries()) {
            positions.setXYZ(vertex + j, xy[0], -.08, xy[1]);
            const color = j === 0 || j === 1 || j === 3 ? startColor : endColor;
            colors.setXYZ(vertex + j, color.r, color.g, color.b);
          }
        }
      }
      positions.needsUpdate = true;
      colors.needsUpdate = true;
      this.landscapeBands.geometry.computeVertexNormals();
      this.landscapeBands.geometry.computeBoundingSphere();
    }
    for (let i = 0; i < this.roadPieces.length; i++) {
      const roadDistance = firstRoad + i * 4;
      const roadPose = pathPose(roadDistance, s.route, s.seed);
      this.roadPieces[i].position.set(roadPose.x, 0, roadPose.z);
      this.roadPieces[i].rotation.y = -roadPose.heading;
      // Both roadside rows now place a pair every 8 m rather than every tile.
      const posts = this.roadPieces[i].getObjectByName('roadside_posts');
      if (posts) posts.visible = Math.round(roadDistance / 4) % 2 === 0;
      // No dashed lane markers or roadside posts across the middle of a junction.
      this.roadPieces[i].visible = [s.route.index - 1, s.route.index].every(index =>
        index < 0 || Math.abs(roadDistance - junction(s.seed, index).distance) >= 13);
    }
    const visibleScenery = new Set<string>();
    const firstRegion = Math.floor((distance - 40) / LANDSCAPE_REGION_METRES);
    const lastRegion = Math.floor((distance + 170) / LANDSCAPE_REGION_METRES);
    const turns = s.route.history.map(turn => turn.distance);
    // The cross street exists while Q/E is pending, so reserve its apron then too.
    turns.push(junction(s.seed, s.route.index).distance);
    for (let section = firstRegion; section <= lastRegion; section++) {
      const center = (section + .5) * LANDSCAPE_REGION_METRES;
      const bend = scenerySectionCrossesTurn(section, turns);
      const bendPoses = bend ? Array.from({ length: 24 }, (_, i) =>
        pathPose(section * LANDSCAPE_REGION_METRES + i * 4 + 2, s.route, s.seed)) : null;
      const regions = roadsideRegions(s.seed, center);
      const pose = pathPose(center, s.route, s.seed);
      const lod = Math.abs(center - distance) < 80 ? 'near' : 'far';
      for (const side of [-1, 1] as const) {
        const kind = side < 0 ? regions.left : regions.right;
        const previous = roadsideRegions(s.seed, center - LANDSCAPE_REGION_METRES);
        const next = roadsideRegions(s.seed, center + LANDSCAPE_REGION_METRES);
        const seaEdges = { start: (side < 0 ? previous.left : previous.right) !== kind,
          end: (side < 0 ? next.left : next.right) !== kind };
        const key = `${s.seed}:${section}:${side}:${kind}:${lod}:${bend ?
          `bend:${s.route.choice ?? 'pending'}:${s.route.history.length}` : 'rigid'}`;
        visibleScenery.add(key);
        let art = this.scenery.get(key);
        if (!art) {
          const variantSeed = (s.seed ^ Math.imul(section, 0x9e3779b1) ^ (side < 0 ? 0x63c6 : 0x487d)) >>> 0;
          art = bend ? createBendSceneryStrip(kind, side, bendPoses!, lod,
            section * LANDSCAPE_REGION_METRES, turns) :
            createSceneryCluster(kind, (side * -1) as -1 | 1, lod, variantSeed, seaEdges);
          if (!bend && kind === 'city' && lod === 'near') {
            const localSide = (side * -1) as -1 | 1;
            if (this.cityMidriseTemplate)
              mountBlenderCityMidrise(art, this.cityMidriseTemplate, localSide);
            if (this.citySkylineTemplate)
              mountBlenderCitySkyline(art, this.citySkylineTemplate, localSide);
            if (this.cityShopTemplate)
              mountBlenderCityShop(art, this.cityShopTemplate, localSide);
            if (this.cityMarketTemplate)
              mountBlenderCityMarket(art, this.cityMarketTemplate, localSide);
          }
          if (!bend && kind === 'sea' && lod === 'near' && this.coastalBoatTemplate)
            mountBlenderCoastalBoat(art, this.coastalBoatTemplate, (side * -1) as -1 | 1);
          if (!bend) {
            art.root.position.set(pose.x, 0, pose.z);
            art.root.rotation.y = Math.PI - pose.heading;
          }
          if (!bend && kind === 'city' && lod === 'near')
            shadePlacedStormCityFacades(art.root, side > 0);
          if (lod === 'near') optimizeNearScenery(art.root);
          art.root.traverse(object => { if (object instanceof THREE.Mesh) {
            object.receiveShadow = true;
            object.castShadow = lod === 'near' &&
              new THREE.Box3().setFromObject(object).max.y > 1.6;
          } });
          this.scene.add(art.root);
          this.scenery.set(key, art);
        }
        // A junction choice can change pathPose while the same region stays cached.
        if (!bend) {
          art.root.position.set(pose.x, 0, pose.z);
          art.root.rotation.y = Math.PI - pose.heading;
        }
        art.setVisualTime?.(s.activeSeconds);
      }
    }
    for (const [key, art] of this.scenery) if (!visibleScenery.has(key)) {
      this.scene.remove(art.root); art.dispose(); this.scenery.delete(key);
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
      view.turnRoad.setTurn(index === s.route.index ? s.route.choice :
        s.route.history.find(turn => turn.distance === cross.distance)?.turn ?? null);
      view.barrier.visible = cross.blockedStraight;
      view.straightStub.visible = index === s.route.index ? s.route.choice !== null :
        s.route.history.some(turn => turn.distance === cross.distance);
      if (view.straightStub.visible && view.landscapeStub.length) {
        const begin = cross.distance - 8, finish = begin + 190;
        const firstSection = Math.floor(begin / LANDSCAPE_REGION_METRES);
        for (let sectionOffset = 0; sectionOffset < 4; sectionOffset++) {
          const section = firstSection + sectionOffset;
          const from = Math.max(begin, section * LANDSCAPE_REGION_METRES);
          const to = Math.min(finish, (section + 1) * LANDSCAPE_REGION_METRES);
          const regions = roadsideRegions(s.seed, (from + to) / 2);
          for (const [sideIndex, side] of ([-1, 1] as const).entries()) {
            const shoulder = view.landscapeStub[sectionOffset * 2 + sideIndex];
            shoulder.visible = to > from;
            if (!shoulder.visible) continue;
            shoulder.material = this.landscapeMaterials![side < 0 ? regions.left : regions.right];
            shoulder.scale.y = to - from;
            shoulder.position.set(side * 15, -.09, begin - (from + to) / 2);
          }
        }
      }
    }
    const live = new Set<string>();
    const visibleEntities = [...s.world.entities.map(entity => ({ entity, route: s.route })), ...s.world.retired];
    for (const { entity: e, route } of visibleEntities) {
      if (e.consumed || e.motionWaiting) continue;
      live.add(e.id);
      let entry = this.entityMeshes.get(e.id);
      if (!entry) { entry = { kind: e.kind, trafficKind: e.trafficKind,
        mesh: this.entityMesh(e.kind, e.trafficKind, e.width, e.length,
          e.kind === 'passenger' ? roadsideArchetype(e.riderId ?? e.id) : undefined) };
        this.entityMeshes.set(e.id, entry); }
      const entityPose = pathPose(e.distance, route, s.seed);
      const pose = passengerPose(e, s.activeSeconds);
      const entityX = e.x + (e.kind === 'shop' ? Math.sign(e.x) * 2.8 : 0);
      entry.mesh.visible = true; entry.mesh.position.set(entityPose.x + Math.cos(entityPose.heading) * entityX, pose.height,
        entityPose.z + Math.sin(entityPose.heading) * entityX);
      entry.mesh.rotation.set(0, -entityPose.heading + (e.kind === 'traffic' && (e.baseSpeed ?? e.speed) < 0 ? Math.PI : 0),
        pose.roll, 'YXZ');
      if (e.kind === 'cargo') {
        (entry.mesh.userData.cargoCrate as HazardArt).root.visible = e.cargoType !== 'barrel';
        (entry.mesh.userData.cargoBarrel as HazardArt).root.visible = e.cargoType === 'barrel';
        entry.mesh.rotation.z = (e.cargoVelocityX ?? 0) * s.activeSeconds * 1.5;
      }
      if (e.kind === 'water') (entry.mesh.userData.hazardArt as HazardArt).setVisualTime?.(s.activeSeconds);
      if (e.kind === 'wind') (entry.mesh.userData.windArt as WindStreakArt)
        .setVisualTime(visualTime, e.lateralPush ?? 1);
      if (e.kind === 'jam') {
        const vendor = e.crossingRole === 'vendor' || e.width === movingBalance.vendorWidth;
        (entry.mesh.userData.barrierArt as HazardArt).root.visible = !vendor;
        const vendorArt = entry.mesh.userData.vendorArt as MovingArt;
        vendorArt.root.visible = vendor;
        if (vendor) {
          vendorArt.setState(e.stunned ? 'stunned' : 'normal');
          vendorArt.setVisualTime?.(visualTime, !!e.crossMotion);
        }
      }
      if (e.kind === 'shop') entry.mesh.rotation.y += e.x > 0 ? -Math.PI / 2 : Math.PI / 2;
      if (e.kind === 'traffic') {
        (entry.mesh.userData.service as THREE.Group).visible = e.serviceRole === 'ambulance';
        const hpFill = entry.mesh.userData.hpFill as THREE.Mesh, hpBack = entry.mesh.userData.hpBack as THREE.Mesh;
        hpFill.visible = hpBack.visible = !!s.world.prototype;
        hpFill.scale.x = Math.max(0, (e.hp ?? 0) / trafficTypes[e.trafficKind ?? 'car4'].hp);
        hpFill.position.x = -(1 - hpFill.scale.x) * e.width / 2;
        const art = entry.mesh.userData.trafficArt as VehicleArt;
        art.setPaint(e.serviceRole === 'ambulance' ? '#d2dedd' : trafficTypes[e.trafficKind ?? 'car4'].color);
        const hpRatio = (e.hp ?? 0) / trafficTypes[e.trafficKind ?? 'car4'].hp;
        art.setCondition(e.wrecked ? 'destroyed' : hpRatio < .45 ? 'damaged' : hpRatio < .8 ? 'used' : 'clean');
      }
      if (e.kind === 'train') {
        entry.mesh.visible = !!e.crossMotion || trainClosed(e, s.activeSeconds);
        (entry.mesh.userData.movingArt as MovingArt).root.scale.x = (e.crossMotion?.velocity ?? 1) < 0 ? -1 : 1;
      }
      if (e.kind === 'police' || e.kind === 'militia') {
        const movingArt = entry.mesh.userData.movingArt as MovingArt;
        movingArt.setState(e.stunned ? 'stunned' : 'normal');
        movingArt.setVisualTime?.(visualTime, !!e.crossMotion);
      }
      if (e.kind === 'passenger') {
        entry.mesh.rotation.y += roadsideWalkingYaw(e, s.activeSeconds);
        (entry.mesh.userData.grabMarker as THREE.Mesh).visible = e.passengerType === 'grab';
        const person = entry.mesh.userData.personArt as PersonArt;
        const visualPose = roadsidePose(e, s.activeSeconds);
        person.setPose(visualPose.pose, visualPose.phase);
      }
      const baseWidth = e.kind === 'wind' ? 9.6 : e.kind === 'water' ? 3.2 : e.kind === 'pothole' ? 1.5 : e.kind === 'traffic' ? 1.9 : e.kind === 'passenger' ? .7 : .8;
      const baseLength = e.kind === 'wind' ? 65 : e.kind === 'water' ? 7 : e.kind === 'pothole' ? 1.8 : e.kind === 'traffic' ? 3.6 : e.kind === 'passenger' ? .7 : .8;
      const sizedArt = e.kind === 'wind' || e.kind === 'water' || e.kind === 'pothole' || e.kind === 'train' ||
        e.kind === 'police' || e.kind === 'militia' || e.kind === 'accident' ||
        e.kind === 'jam';
      entry.mesh.scale.set(e.kind === 'traffic' || e.kind === 'shop' || sizedArt ? 1 : e.width / baseWidth, 1,
        e.kind === 'traffic' || e.kind === 'shop' || sizedArt ? 1 : e.length / baseLength);
    }
    for (const [id, entry] of this.entityMeshes) if (!live.has(id)) {
      entry.mesh.visible = false;
      if (entry.kind === 'water' || entry.kind === 'pothole') {
        this.scene.remove(entry.mesh);
        (entry.mesh.userData.hazardArt as HazardArt).dispose();
      } else if (entry.kind === 'traffic') {
        const kind = entry.trafficKind ?? 'car4';
        const pool = this.trafficPools.get(kind) ?? []; pool.push(entry.mesh); this.trafficPools.set(kind, pool);
      } else if (entry.kind === 'passenger') {
        const cast = entry.mesh.userData.passengerCast as PersonArchetype;
        const pool = this.passengerPools.get(cast) ?? []; pool.push(entry.mesh); this.passengerPools.set(cast, pool);
      } else this.pools[entry.kind].push(entry.mesh);
      this.entityMeshes.delete(id);
    }
    this.stormPost.render();
    const tail = this.project(x, 0, vehicle.length / 2 + .45);
    this.host.style.setProperty('--bike-x', `${Math.max(30, Math.min(70, tail.x))}%`);
    this.host.style.setProperty('--bike-tail-y', `${Math.max(76, Math.min(86, tail.y))}%`);
  }
  project(x: number, y: number, z: number): { x: number; y: number } {
    const p = pathPose(this.viewState.distance - z, this.viewState.route, this.viewState.seed);
    this.projected.set(p.x + Math.cos(p.heading) * x, y, p.z + Math.sin(p.heading) * x).project(this.camera);
    return { x: (this.projected.x + 1) * 50, y: (1 - this.projected.y) * 50 };
  }
  renderStats(): { drawCalls: number; triangles: number } {
    return { drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles };
  }
  private refreshNearCityScenery(): void {
    // Visible lots created while the GLBs were loading fall back to native
    // geometry. Rebuild only those lots at the next render tick.
    for (const [key, art] of this.scenery) if (key.includes(':city:near:rigid')) {
      this.scene.remove(art.root); art.dispose(); this.scenery.delete(key);
    }
  }
  private refreshNearSeaScenery(): void {
    for (const [key, art] of this.scenery) if (key.includes(':sea:near:rigid')) {
      this.scene.remove(art.root); art.dispose(); this.scenery.delete(key);
    }
  }
  dispose(): void {
    this.disposed = true;
    this.observer.disconnect();
    this.stormLighting.dispose();
    this.stormPost.dispose();
    if (this.cloudShadows) { this.scene.remove(this.cloudShadows.root); this.cloudShadows.dispose(); }
    for (const art of [this.rain, this.rainSplashes]) if (art) { this.scene.remove(art.root); art.dispose(); }
    for (const art of this.scenery.values()) { this.scene.remove(art.root); art.dispose(); }
    this.scenery.clear();
    for (const template of [this.cityMidriseTemplate, this.citySkylineTemplate,
      this.cityShopTemplate, this.cityMarketTemplate, this.coastalBoatTemplate])
      template?.traverse(object => { if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        (Array.isArray(object.material) ? object.material : [object.material])
          .forEach(material => material.dispose());
      } });
    this.driverTemplate?.traverse(object => { if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose());
    } });
    for (const entry of this.entityMeshes.values()) if (entry.kind === 'water' || entry.kind === 'pothole') {
      this.scene.remove(entry.mesh);
      (entry.mesh.userData.hazardArt as HazardArt).dispose();
    }
    this.scene.traverse(object => { if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => material.dispose());
    } });
    this.renderer.dispose();
  }
}
