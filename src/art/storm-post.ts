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
    uniforms: { tDiffuse: { value: null } },
    vertexShader: `varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `uniform sampler2D tDiffuse;
      varying vec2 vUv;
      void main() {
        vec4 source = texture2D(tDiffuse, vUv);
        vec3 color = source.rgb;
        float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
        float shadow = 1.0 - smoothstep(0.09, 0.52, luminance);
        float highlight = smoothstep(0.35, 1.15, luminance);
        // Slate blue storm shade; the sky texture and distance fog own the horizon.
        color *= mix(vec3(1.0), vec3(0.91, 0.99, 1.055), shadow * 0.76);
        color += shadow * vec3(0.002, 0.006, 0.010);
        color *= mix(vec3(1.0), vec3(1.025, 1.012, 0.992), highlight * 0.48);
        float gradedLuma = dot(color, vec3(0.2126, 0.7152, 0.0722));
        color = mix(vec3(gradedLuma), color, 0.98);
        color *= 1.015;
        gl_FragColor = vec4(color, source.a);
      }`,
  });
  const output = new OutputPass();
  composer.addPass(beauty);
  composer.addPass(grade);
  composer.addPass(output);
  return {
    render: () => {
      // Three resets renderer.info for each pass unless accumulated explicitly.
      const previous = renderer.info.autoReset;
      renderer.info.autoReset = false;
      renderer.info.reset();
      try { composer.render(); } finally { renderer.info.autoReset = previous; }
    },
    setSize: (width: number, height: number) => composer.setSize(width, height),
    dispose: () => { composer.dispose(); grade.dispose(); output.dispose(); },
  };
}
