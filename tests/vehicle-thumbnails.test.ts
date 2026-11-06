import { expect, it, vi } from 'vitest';
import type * as ThreeTypes from 'three';
import { vehicles } from '../src/vehicles';
const observed = vi.hoisted(() => ({ contexts:0, disposed:0, lost:0, rendered:[] as string[], clipping:[] as number[] }));
vi.mock('three', async importOriginal => {
  const three = await importOriginal<typeof import('three')>();
  return { ...three, WebGLRenderer: class {
    name=''; domElement={toDataURL:()=> 'data:image/png;base64,'+Buffer.from(this.name).toString('base64')};
    constructor(){observed.contexts++;}
    setSize(){} setPixelRatio(){} setClearColor(){}
    render(scene:ThreeTypes.Scene,camera:ThreeTypes.Camera){
      const model=scene.children.find(node=>node.name.startsWith('veh_'))!;
      this.name=model.name;observed.rendered.push(model.name);
      const bounds=new three.Box3().setFromObject(model);
      let clip=0;
      for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
        const point=new three.Vector3(x,y,z).project(camera);clip=Math.max(clip,Math.abs(point.x),Math.abs(point.y));
        expect(point.z).toBeGreaterThan(-1);expect(point.z).toBeLessThan(1);
      }
      observed.clipping.push(clip);
    }
    dispose(){observed.disposed++;} forceContextLoss(){observed.lost++;}
  } };
});
it('renders all eight actual player models completely inside frame, caches PNGs and releases the context', async()=>{
  const { vehicleThumbnailSources }=await import('../src/vehicle-thumbnails');
  const first=vehicleThumbnailSources();
  expect(observed.rendered).toEqual(Object.keys(vehicles).map(kind=>`veh_${kind}_player_near`));
  expect(new Set(Object.values(first)).size).toBe(8);
  expect(observed.clipping.every(value=>Number.isFinite(value)&&value<.9)).toBe(true);
  expect(vehicleThumbnailSources()).toBe(first);expect(observed.contexts).toBe(1);
  expect(observed.rendered).toHaveLength(8);expect(observed.disposed).toBe(1);expect(observed.lost).toBe(1);
});
