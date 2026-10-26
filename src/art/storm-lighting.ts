import * as THREE from 'three';

export const stormExposure = 1.05;
export const gameplayAccentLayer = 1;

/** Keep layer 0 visible; render cameras also enable layer 1 to collect the accent light. */
export function markGameplayAccentTarget(root: THREE.Object3D): void {
  root.traverse(object => {
    if (object instanceof THREE.Mesh) object.layers.enable(gameplayAccentLayer);
  });
}

export function configureStormRenderer(renderer: THREE.WebGLRenderer): void {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = stormExposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
}

/** Grade a loaded city GLB once, without mutating materials shared with the source asset. */
export function gradeStormCityBuilding(root: THREE.Object3D): void {
  if (root.userData.stormCityGraded) return;
  const graded = new Map<THREE.Material, THREE.Material>();
  const grade = (source: THREE.Material): THREE.Material => {
    let material = graded.get(source);
    if (!material) {
      material = source.clone();
      if (material instanceof THREE.MeshStandardMaterial) {
        // Named GLB facades form the city's quiet midground. Preserve the
        // warmer shop, foliage and roof accents that give the storm life.
        const facade = /plaster|columns|paving|stone|concrete/i.test(material.name);
        material.color.offsetHSL(0, facade ? -.16 : -.08, facade ? -.16 : -.07);
        material.roughness = Math.max(material.roughness, .78);
      }
      graded.set(source, material);
    }
    return material;
  };
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    object.material = Array.isArray(object.material)
      ? object.material.map(grade) : grade(object.material);
  });
  root.userData.stormCityGraded = true;
}

/** Reusable art lighting study. Runtime owns shadow-map quality and updates the anchor from pathPose. */
export function createStormLighting(scene: THREE.Scene) {
  const previous = { background: scene.background, environment: scene.environment,
    fog: scene.fog, environmentIntensity: scene.environmentIntensity };
  const sky = document.createElement('canvas');
  sky.width = 512; sky.height = 256;
  const context = sky.getContext('2d')!;
  const gradient = context.createLinearGradient(0, 0, 0, sky.height);
  gradient.addColorStop(0, '#344a5b');
  gradient.addColorStop(.18, '#70989b');
  gradient.addColorStop(.35, '#7a9da0');
  gradient.addColorStop(.62, '#83a4a5');
  gradient.addColorStop(1, '#a3b9b2');
  context.fillStyle = gradient;
  context.fillRect(0, 0, sky.width, sky.height);
  context.filter = 'blur(11px)';
  context.fillStyle = 'rgba(43,87,104,.15)';
  for (const [x, y, width, height] of [[64, 48, 163, 35], [260, 74, 175, 34],
    [467, 44, 144, 30]] as const) {
    context.beginPath(); context.ellipse(x, y, width, height, -.12, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = 'rgba(193,224,209,.10)';
  for (const [x, y, width, height] of [[108, 112, 145, 12], [367, 136, 199, 14]] as const) {
    context.beginPath(); context.ellipse(x, y, width, height, -.04, 0, Math.PI * 2);
    context.fill();
  }
  context.filter = 'none';
  const skyTexture = new THREE.CanvasTexture(sky);
  skyTexture.colorSpace = THREE.SRGBColorSpace;
  const environment = skyTexture.clone();
  environment.mapping = THREE.EquirectangularReflectionMapping;
  environment.needsUpdate = true;
  const fog = new THREE.Fog('#70989b', 43, 108);
  scene.background = skyTexture;
  scene.environment = environment;
  scene.environmentIntensity = .035;
  scene.fog = fog;

  const hemisphere = new THREE.HemisphereLight('#8daeb9', '#28566f', .39);
  const ambient = new THREE.AmbientLight('#5a91a3', .07);
  const sun = new THREE.DirectionalLight('#fff0de', 2.88);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -34; sun.shadow.camera.right = 34;
  sun.shadow.camera.top = 48; sun.shadow.camera.bottom = -32;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 105;
  sun.shadow.bias = -.0004; sun.shadow.blurSamples = 16; sun.shadow.radius = 8;
  const fill = new THREE.DirectionalLight('#5babc8', .20);
  const sunBreak = new THREE.SpotLight('#fff0da', 1050, 65, Math.PI / 3, 1, 2);
  const facadeSun = new THREE.SpotLight('#fff1df', 245, 43, Math.PI / 4.2, .9, 2);
  const gameplayAccent = new THREE.DirectionalLight('#d6edf0', .72);
  gameplayAccent.layers.set(gameplayAccentLayer);
  scene.add(hemisphere, ambient, sun, sun.target, fill, fill.target,
    sunBreak, sunBreak.target, facadeSun, facadeSun.target, gameplayAccent, gameplayAccent.target);
  const setAnchor = (x: number, z: number) => {
    sun.position.set(x - 23, 16, z + 22);
    sun.target.position.set(x, 0, z);
    fill.position.set(x - 11, 8, z - 10);
    fill.target.position.set(x, 0, z);
    sunBreak.position.set(x - 10, 22, z + 19);
    sunBreak.target.position.set(x, 0, z + 24);
    facadeSun.position.set(x + 1, 17, z + 11);
    facadeSun.target.position.set(x + 8, 5, z + 24);
    gameplayAccent.position.set(x + 14, 12, z - 16);
    gameplayAccent.target.position.set(x, 0, z);
  };
  setAnchor(0, 0);
  const dispose = () => {
    scene.remove(hemisphere, ambient, sun, sun.target, fill, fill.target,
      sunBreak, sunBreak.target, facadeSun, facadeSun.target, gameplayAccent, gameplayAccent.target);
    skyTexture.dispose();
    environment.dispose();
    if (scene.background === skyTexture) scene.background = previous.background;
    if (scene.environment === environment) scene.environment = previous.environment;
    if (scene.fog === fog) scene.fog = previous.fog;
    scene.environmentIntensity = previous.environmentIntensity;
    sun.shadow.dispose();
  };
  return { sun, fill, sunBreak, gameplayAccent, fog, setAnchor, dispose };
}
