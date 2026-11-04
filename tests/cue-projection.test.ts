import { expect, it } from 'vitest';
import { roadCuePose } from '../src/cue-scale';
import { initialRoute, junction } from '../src/route';
it('choosing a junction exit keeps Q/E anchors fixed while ordinary road anchors follow the chosen road',()=>{
 const route=initialRoute(),distance=junction(17,0).distance+2;
 const before=roadCuePose(distance,route,17,true);
 for(const choice of ['left','right'] as const){
  const selected={...route,choice};
  expect(roadCuePose(distance,selected,17,true)).toEqual(before);
  expect(roadCuePose(distance,selected,17)).not.toEqual(before);
  expect(selected.choice).toBe(choice);
 }
});
