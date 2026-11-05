import { expect, it } from 'vitest';
import * as THREE from 'three';
import { createCloudShadowArt } from '../src/art/cloud-shadows';
import { createShopArt } from '../src/art/special-hazards';
import { initialRoute } from '../src/route';

function compile(material: THREE.Material) {
 const shader = { uniforms:{}, vertexShader:THREE.ShaderLib.standard.vertexShader,
  fragmentShader:THREE.ShaderLib.standard.fragmentShader } as Parameters<THREE.Material['onBeforeCompile']>[0];
 material.onBeforeCompile(shader, {} as THREE.WebGLRenderer); return shader;
}
it('shares exact world cloud bounds with actor receivers, updates on travel and preserves base paint',()=>{
 const clouds=createCloudShadowArt(), paint=new THREE.MeshStandardMaterial({color:'#d53c42'});
 const original=paint.color.clone(), mesh=new THREE.Mesh(new THREE.BoxGeometry(),paint);
 clouds.applyTo(mesh);const key=paint.customProgramCacheKey();clouds.applyTo(mesh);
 expect(paint.customProgramCacheKey()).toBe(key);expect(mesh.receiveShadow).toBe(true);
 const shader=compile(paint);clouds.update(17,0,initialRoute());
 const bounds=shader.uniforms.cloudBounds.value as THREE.Vector4[];
 clouds.root.children.forEach((patch,i)=>{
  expect(bounds[i].x).toBe(patch.position.x);expect(bounds[i].y).toBe(patch.position.z);
  expect(bounds[i].z).toBe(patch.scale.x);expect(bounds[i].w).toBe(patch.scale.z);
 });
 const first=bounds[0].clone();clouds.update(17,200,initialRoute());
 expect(bounds[0].equals(first)).toBe(false);expect(paint.color.equals(original)).toBe(true);
 expect(shader.fragmentShader).toContain('cloudTransmission');expect(shader.vertexShader).toContain('vCloudWorld =');
 clouds.dispose();mesh.geometry.dispose();paint.dispose();
});
it('chains the shop emissive shader with cloud shade and updates its bounded reduced-motion pulse',()=>{
 const shop=createShopArt(),clouds=createCloudShadowArt();clouds.applyTo(shop.root);
 const sign=shop.root.getObjectByName('repair_sign') as THREE.Mesh<THREE.BoxGeometry,THREE.MeshStandardMaterial>;
 const shader=compile(sign.material);
 expect(shader.fragmentShader).toContain('totalEmissiveRadiance *=');
 expect(shader.fragmentShader).toContain('cloudTransmission');
 shop.update!(3,false);expect(shader.uniforms.shopBeaconTime.value).toBe(3);
 expect(shader.uniforms.shopBeaconDepth.value).toBe(1);
 shop.update!(4,true);expect(shader.uniforms.shopBeaconTime.value).toBe(4);
 expect(shader.uniforms.shopBeaconDepth.value).toBe(.18);
 expect(shop.root.children.some(child=>child instanceof THREE.Light)).toBe(false);
 shop.dispose();clouds.dispose();
});
