import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/** Scene-only color grade; HTML HUD and warnings retain their authored colors. */
export function createStormPostProcessing(renderer: THREE.WebGLRenderer,
  scene: THREE.Scene, camera: THREE.Camera) {
  const composer = new EffectComposer(renderer);
  const beauty = new RenderPass(scene, camera);
  const grade = new ShaderPass({
    name: 'StormSplitTone',
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 },
      uBloom: { value: 1 }, uLightSide: { value: -1 },
      uTexel: { value: new THREE.Vector2(1 / 540, 1 / 960) } },
    vertexShader: `varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `uniform sampler2D tDiffuse;
      uniform float uTime; uniform float uBloom; uniform float uLightSide; uniform vec2 uTexel;
      varying vec2 vUv;
      vec3 bright(vec2 uv) {
        vec3 c = texture2D(tDiffuse, clamp(uv, vec2(0.0), vec2(1.0))).rgb;
        return c * smoothstep(.32, .95, dot(c, vec3(.2126, .7152, .0722)));
      }
      void main() {
        vec4 source = texture2D(tDiffuse, vUv);
        vec3 color = source.rgb;
        float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
        float shadow = 1.0 - smoothstep(0.09, 0.52, luminance);
        float highlight = smoothstep(0.35, 1.15, luminance);
        // Slate blue storm shade; the sky texture and distance fog own the horizon.
        color *= mix(vec3(1.0), vec3(0.91, 0.99, 1.055), shadow * 0.76);
        color += shadow * vec3(0.002, 0.006, 0.010);
        color *= mix(vec3(1.0), vec3(1.012, 1.014, 1.010), highlight * 0.48);
        float gradedLuma = dot(color, vec3(0.2126, 0.7152, 0.0722));
        color = mix(vec3(gradedLuma), color, 0.98);
        color *= 1.015;
        // A gentle irregular glimmer follows the sun, never a full-screen flash.
        float glimmer = .5 + .5 * sin(uTime * 1.8 + sin(uTime * .73) * .8);
        float pulse = .12 + .88 * smoothstep(.15, .95, glimmer);
        float sideX = uLightSide < 0.0 ? vUv.x : 1.0 - vUv.x;
        float side = (1.0 - smoothstep(.12, .56, sideX)) * smoothstep(.22, .72, vUv.y);
        vec2 radius = uTexel * 7.0;
        vec3 halo = (bright(vUv + radius) + bright(vUv - radius)
          + bright(vUv + vec2(radius.x, -radius.y))
          + bright(vUv + vec2(-radius.x, radius.y))) * .25;
        float softEdge = exp(-pow(sideX / .28, 2.0) - pow((vUv.y - .68) / .3, 2.0));
        color += (halo * side * .20 + vec3(1.0, .94, .79) * softEdge * .055) * pulse * uBloom;
        gl_FragColor = vec4(color, source.a);
      }`,
  });
  const output = new OutputPass();
  composer.addPass(beauty);
  composer.addPass(grade);
  composer.addPass(output);
  return {
    setVisualTime: (seconds: number, reduced: boolean, lightSide = -1) => {
      // Requested light shimmer stays animated; reduced mode softens and slows it.
      grade.uniforms.uTime.value = seconds * (reduced ? .65 : 1);
      grade.uniforms.uBloom.value = reduced ? .55 : 1;
      grade.uniforms.uLightSide.value = lightSide;
    },
    render: () => {
      // Three resets renderer.info for each pass unless accumulated explicitly.
      const previous = renderer.info.autoReset;
      renderer.info.autoReset = false;
      renderer.info.reset();
      try { composer.render(); } finally { renderer.info.autoReset = previous; }
    },
    setSize: (width: number, height: number) => {
      composer.setSize(width, height);
      const size = renderer.getDrawingBufferSize(new THREE.Vector2());
      grade.uniforms.uTexel.value.set(1 / Math.max(1, size.x), 1 / Math.max(1, size.y));
    },
    dispose: () => { composer.dispose(); grade.dispose(); output.dispose(); },
  };
}
