import * as THREE from 'three';

export type AnimatedBlenderDriver = THREE.Group & { setVisualTime: (activeSeconds: number) => void };

/** Reuse the editable driver delivery in the live vehicle seat, with no animation clock. */
export function createRidingBlenderDriver(template: THREE.Group): AnimatedBlenderDriver {
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
  const head = nodes.find(node => node.name.startsWith('head_pivot'));
  const animated = driver as AnimatedBlenderDriver;
  const torsoRest = torso.quaternion.clone();
  const armRests = arms.map(arm => arm.quaternion.clone());
  const headRest = head?.quaternion.clone();
  const twist = new THREE.Quaternion();
  const zAxis = new THREE.Vector3(0, 0, 1), xAxis = new THREE.Vector3(1, 0, 0), yAxis = new THREE.Vector3(0, 1, 0);
  animated.setVisualTime = activeSeconds => {
    const phase = activeSeconds * .4 * Math.PI * 2;
    const breath = Math.sin(phase);
    torso.quaternion.copy(torsoRest).premultiply(twist.setFromAxisAngle(zAxis, breath * .025));
    arms.forEach((arm, i) => arm.quaternion.copy(armRests[i])
      .premultiply(twist.setFromAxisAngle(xAxis, breath * (i === 0 ? .035 : -.035))));
    if (head && headRest) head.quaternion.copy(headRest)
      .premultiply(twist.setFromAxisAngle(yAxis, Math.sin(phase + .8) * .055));
  };
  animated.setVisualTime(0);
  driver.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true; });
  driver.name = 'player_blender_driver';
  return animated;
}
