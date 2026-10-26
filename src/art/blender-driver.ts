import * as THREE from 'three';

/** Reuse the editable driver delivery in the live vehicle seat, with no animation clock. */
export function createRidingBlenderDriver(template: THREE.Group): THREE.Group {
  const driver = template.clone(true);
  const nodes: THREE.Object3D[] = [];
  driver.traverse(node => nodes.push(node));
  const pair = (prefix: string) => nodes.filter(node => node.name.startsWith(prefix))
    .sort((a, b) => a.position.x - b.position.x);
  const legs = pair('hip_leg_'), arms = pair('shoulder_');
  const knees = legs.map(leg => leg.children.find(node => node.name.startsWith('knee_')));
  const elbows = arms.map(arm => arm.children.find(node => node.name.startsWith('elbow_')));
  const torso = nodes.find(node => node.name.startsWith('torso_pivot'));
  if (legs.length !== 2 || arms.length !== 2 || knees.some(node => !node) ||
    elbows.some(node => !node) || !torso) throw new Error('Driver GLB is missing pose pivots');
  const turn = (node: THREE.Object3D, radians: number) =>
    node.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), radians));
  legs.forEach(leg => turn(leg, -.77));
  knees.forEach(knee => turn(knee!, 1.0));
  turn(torso, .22);
  arms.forEach(arm => turn(arm, -.92));
  elbows.forEach(elbow => turn(elbow!, -.35));
  driver.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true; });
  driver.name = 'player_blender_driver';
  return driver;
}
