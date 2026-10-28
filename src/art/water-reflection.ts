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
        float fresnel = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.0);
        float drift = .94 + .06 * sin(p.x * .17 + p.y * .11 + uWaterTime * .4);
        outgoingLight += vec3(.035, .075, .085) * fresnel * drift;
        #include <opaque_fragment>`);
  };
  material.customProgramCacheKey = () => 'soft-water-reflection-v2';
  return (seconds: number) => { time.value = seconds; };
}
