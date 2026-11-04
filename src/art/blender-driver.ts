import * as THREE from 'three';
import type { TimedPose } from './timing';

export type AnimatedBlenderDriver = THREE.Group & { setVisualTime: (activeSeconds: number) => void };
export type CrashBlenderDriver = THREE.Group & { setTimedPose: (pose: TimedPose) => void };

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
  const torsoRestY = torso.position.y;
  const armRests = arms.map(arm => arm.quaternion.clone());
  const headRest = head?.quaternion.clone();
  const twist = new THREE.Quaternion();
  const zAxis = new THREE.Vector3(0, 0, 1), xAxis = new THREE.Vector3(1, 0, 0), yAxis = new THREE.Vector3(0, 1, 0);
  animated.setVisualTime = activeSeconds => {
    const phase = activeSeconds * .4 * Math.PI * 2;
    const breath = Math.sin(phase);
    torso.position.y = torsoRestY + breath * .024;
    torso.quaternion.copy(torsoRest).premultiply(twist.setFromAxisAngle(zAxis, breath * .043));
    arms.forEach((arm, i) => arm.quaternion.copy(armRests[i])
      .premultiply(twist.setFromAxisAngle(xAxis, breath * (i === 0 ? .065 : -.065))));
    if (head && headRest) head.quaternion.copy(headRest)
      .premultiply(twist.setFromAxisAngle(yAxis, Math.sin(phase + .8) * .09));
  };
  animated.setVisualTime(0);
  driver.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true; });
  driver.name = 'player_blender_driver';
  return animated;
}

/** Use the same edited mesh after a crash; simulation owns travel and pose timing. */
export function createCrashBlenderDriver(template: THREE.Group): CrashBlenderDriver {
  const driver = template.clone(true) as CrashBlenderDriver;
  const nodes: THREE.Object3D[] = [];
  driver.traverse(node => nodes.push(node));
  const find = (prefix: string) => nodes.find(node => node.name.startsWith(prefix));
  const pair = (prefix: string) => nodes.filter(node => node.name.startsWith(prefix))
    .sort((a, b) => a.position.x - b.position.x);
  const hips = find('hip_pivot'), torso = find('torso_pivot');
  const legs = pair('hip_leg_'), arms = pair('shoulder_');
  const knees = legs.map(leg => leg.children.find(node => node.name.startsWith('knee_')));
  const elbows = arms.map(arm => arm.children.find(node => node.name.startsWith('elbow_')));
  if (!hips || !torso || legs.length !== 2 || arms.length !== 2 ||
    knees.some(node => !node) || elbows.some(node => !node))
    throw new Error('Driver GLB is missing crash pose pivots');
  const pivots = [torso, ...legs, ...knees, ...arms, ...elbows] as THREE.Object3D[];
  const rest = new Map(pivots.map(node => [node, node.quaternion.clone()]));
  const hipRestY = hips.position.y;
  const poseRotation = new THREE.Quaternion();
  const rotate = (node: THREE.Object3D, x = 0, z = 0) => {
    poseRotation.setFromEuler(new THREE.Euler(x, 0, z, 'XYZ'));
    node.quaternion.copy(rest.get(node)!).premultiply(poseRotation);
  };
  driver.setTimedPose = ({ pose, phase }) => {
    const t = THREE.MathUtils.clamp(phase, 0, 1);
    hips.position.y = hipRestY;
    pivots.forEach(node => node.quaternion.copy(rest.get(node)!));
    if (pose === 'ejected') {
      rotate(torso, -.25 - .36 * t, .10 + .20 * t);
      rotate(arms[0], 0, -.5 - .6 * t);
      rotate(arms[1], 0, .5 + .5 * t);
      rotate(legs[0], -.16 - .19 * t);
      rotate(legs[1], .19 + .23 * t);
    } else if (pose === 'grounded' || pose === 'recover') {
      const recovery = pose === 'recover' ? t : 0;
      hips.position.y = THREE.MathUtils.lerp(.33, hipRestY, recovery);
      rotate(torso, -1.25 * (1 - recovery));
      arms.forEach(arm => rotate(arm, -1.12 * (1 - recovery)));
      if (pose === 'grounded') {
        rotate(legs[0], 0, -.32);
        rotate(legs[1], 0, .30);
      } else knees.forEach(knee => rotate(knee!, .52 * (1 - recovery)));
    } else if (pose === 'run') {
      const stride = Math.sin(t * Math.PI * 2);
      hips.position.y = hipRestY + Math.abs(stride) * .055;
      rotate(torso, .12, stride * .045);
      rotate(legs[0], stride * .86);
      rotate(legs[1], -stride * .86);
      rotate(knees[0]!, Math.max(0, -stride) * .82);
      rotate(knees[1]!, Math.max(0, stride) * .82);
      rotate(arms[0], -stride * .62 - .13);
      rotate(arms[1], stride * .62 - .13);
      elbows.forEach(elbow => rotate(elbow!, -.25));
    }
  };
  driver.setTimedPose({ pose: 'stand', phase: 0 });
  driver.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true; });
  driver.name = 'fallen_blender_driver';
  return driver;
}
