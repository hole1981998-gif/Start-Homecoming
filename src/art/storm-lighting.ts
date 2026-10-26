import * as THREE from 'three';

export const stormExposure = .99;
export const gameplayAccentLayer = 1;
const facadeKeyDirection = new THREE.Vector3(-23, 16, 22).normalize();
const glbFacadeTargets: Readonly<Record<string, string>> = {
  // The GLB base colors are linear; the earlier HSL pass still left these
  // large planes near #c0b5a0 after sRGB output, brighter than native walls.
  'midrise ivory columns': '#7d8b8c',
  'sunlit cream plaster': '#89948e',
  pale_metal: '#899392',
  // Large sun-facing wall planes on the right row stayed peach after the
  // directional grade. Keep awnings, lit windows and shop interiors warm.
  skyline_warm_plaster: '#818984',
  'warm ochre plaster': '#858a80',
  cream_plaster: '#84908a',
};

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
        material.userData.stormFacadePlane = /plaster|columns|concrete|pale_metal/i.test(material.name);
        material.color.offsetHSL(0, facade ? -.16 : -.08, facade ? -.16 : -.07);
        if (facade && /cream|ochre|warm.plaster/i.test(material.name)) {
          // Imported cream walls are large and still blow out beneath the key.
          // Blend toward storm teal while preserving their warmer local hue.
          material.color.lerp(new THREE.Color('#789196'), .27);
          material.color.offsetHSL(0, -.05, -.07);
        }
        const target = glbFacadeTargets[material.name];
        if (target) material.color.set(target);
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

/** Bake cool ambient on imported wall faces after roadside placement, without moving the road's key light. */
export function shadePlacedStormCityFacades(root: THREE.Object3D): number {
  root.updateMatrixWorld(true);
  let shadedMeshes = 0;
  const normal = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshStandardMaterial) ||
      !object.material.userData.stormFacadePlane || object.geometry.userData.stormAmbientShaded) return;
    const normals = object.geometry.getAttribute('normal');
    if (!normals || object.geometry.getAttribute('color')) return;
    // Mounting already clones a placed lot. Only standalone synthetic clones
    // need isolation here; avoid orphaning the lot's previous GPU resources.
    if (!object.userData.stormPlacedOwned) {
      object.geometry = object.geometry.clone();
      object.material = object.material.clone();
    }
    // BufferGeometry.clone() keeps userData by reference in this Three version.
    object.geometry.userData = { ...object.geometry.userData };
    normalMatrix.getNormalMatrix(object.matrixWorld);
    const colors = new Uint8Array(normals.count * 3);
    for (let i = 0; i < normals.count; i++) {
      normal.fromBufferAttribute(normals, i).applyMatrix3(normalMatrix).normalize();
      const wall = THREE.MathUtils.smoothstep(1 - Math.abs(normal.y), .15, .7);
      const sun = THREE.MathUtils.clamp(normal.dot(facadeKeyDirection), 0, 1);
      const shade = wall * (.24 + .22 * (1 - sun));
      colors[i * 3] = Math.round(255 * (1 - shade * 1.12));
      colors[i * 3 + 1] = Math.round(255 * (1 - shade * .92));
      colors[i * 3 + 2] = Math.round(255 * (1 - shade * .72));
    }
    object.geometry.setAttribute('color', new THREE.Uint8BufferAttribute(colors, 3, true));
    object.geometry.userData.stormAmbientShaded = true;
    object.material.vertexColors = true;
    object.material.needsUpdate = true;
    shadedMeshes++;
  });
  return shadedMeshes;
}

/** Reusable art lighting study. Runtime owns shadow-map quality and updates the anchor from pathPose. */
export function createStormLighting(scene: THREE.Scene) {
  const previous = { background: scene.background, environment: scene.environment,
    fog: scene.fog, environmentIntensity: scene.environmentIntensity };
  const sky = document.createElement('canvas');
  sky.width = 512; sky.height = 256;
  const context = sky.getContext('2d')!;
  const gradient = context.createLinearGradient(0, 0, 0, sky.height);
  const horizonColor = '#6b9094';
  gradient.addColorStop(0, '#344a5b');
  gradient.addColorStop(.10, '#5f818d');
  gradient.addColorStop(.20, horizonColor);
  gradient.addColorStop(.42, horizonColor);
  gradient.addColorStop(.58, horizonColor);
  gradient.addColorStop(.75, '#83a4a5');
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
  const fog = new THREE.Fog(horizonColor, 48, 125);
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
  const facadeSun = new THREE.SpotLight('#e6ece6', 100, 43, Math.PI / 4.2, .9, 2);
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
