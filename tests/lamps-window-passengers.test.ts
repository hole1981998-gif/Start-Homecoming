import { expect, it } from 'vitest';
import * as THREE from 'three';
import { createVehicleArt } from '../src/art/vehicle-catalog';
import { bindVehicleLampMaterials } from '../src/art/vehicle-light-materials';
import { createVehicleLightBeams } from '../src/art/vehicle-light-beams';
import { createCloudShadowArt } from '../src/art/cloud-shadows';
import { updateWindowPassenger } from '../src/art/window-passengers';
import { vehicles, type VehicleKind } from '../src/vehicles';
it('keeps all vehicle lenses unshadowed even when receivers are revisited and washes above cloud overlays',()=>{
 const clouds=createCloudShadowArt();
 for(const kind of Object.keys(vehicles) as VehicleKind[]){
  const art=createVehicleArt(kind);clouds.applyTo(art.root);bindVehicleLampMaterials(art);clouds.applyTo(art.root);
  let lenses=0;
  art.root.traverse(node=>{
   if(node instanceof THREE.Mesh && node.material instanceof THREE.MeshBasicMaterial){
    lenses++;expect(node.receiveShadow,kind+node.name).toBe(false);
   }
  });
  expect(lenses,kind).toBeGreaterThan(0);art.dispose();
 }
 const beams=createVehicleLightBeams();expect(beams.root.renderOrder).toBeGreaterThan(clouds.root.children[0].renderOrder);
 expect(beams.root.material.depthTest).toBe(true);beams.dispose();clouds.dispose();
});
it('mounts finished posed cast at window height, caches riders and replaces a departing rider',()=>{
 const wrapper=new THREE.Group();updateWindowPassenger(wrapper,'rider-17',0);
 const first=wrapper.children[0];
 expect(first.getObjectByName('head_pivot')).toBeDefined();
 expect(first.getObjectByName('torso_pivot')).toBeDefined();
 expect(first.getObjectByName('window_head')).toBeUndefined();
 wrapper.updateMatrixWorld(true);
 expect(first.getObjectByName('head_pivot')!.getWorldPosition(new THREE.Vector3()).y).toBeCloseTo(.13);
 first.traverse(node=>{if(node.name.startsWith('hip_leg_')) expect(node.visible).toBe(false);});
 updateWindowPassenger(wrapper,'rider-17',2);expect(wrapper.children[0]).toBe(first);
 updateWindowPassenger(wrapper,'rider-18',0);expect(wrapper.children).toHaveLength(1);
 expect(wrapper.children[0]).not.toBe(first);
});
