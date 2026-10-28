import * as THREE from 'three';

/** Procedural moving sky/sun reflection; opaque basin below still hides lane paint. */
export function addWaterReflection(material: THREE.MeshPhysicalMaterial) {
  const time = { value: 0 };
  material.onBeforeCompile = shader => {
    shader.uniforms.uWaterTime = time;
    shader.vertexShader = `varying vec3 vWaterLocal;\n${shader.vertexShader}`
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWaterLocal = position;');
    shader.fragmentShader = `uniform float uWaterTime; varying vec3 vWaterLocal;\n${shader.fragmentShader}`
      .replace('#include <opaque_fragment>', `
        vec2 p = vWaterLocal.xz;
        float wave = sin(p.x * 1.1 + p.y * 3.1 + uWaterTime * 1.5)
          + .35 * sin(p.y * 4.3 - p.x * .7 - uWaterTime * 1.1);
        float glint = pow(max(0.0, .5 + wave * .34), 8.0);
        float skyBand = .5 + .5 * sin(p.y * .65 + wave * .35 - uWaterTime * .35);
        float fresnel = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.0);
        outgoingLight += vec3(.10, .22, .24) * skyBand * (.35 + fresnel * .65)
          + vec3(.62, .72, .69) * glint * .35;
        #include <opaque_fragment>`);
  };
  material.customProgramCacheKey = () => 'moving-water-reflection-v1';
  return (seconds: number) => { time.value = seconds; };
}
