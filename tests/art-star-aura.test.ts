import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createStarAura } from '../src/art/star-aura';

describe('star silhouette presentation', () => {
  it('follows visible vehicle and rider geometry, including transforms, and retires old shells', () => {
    const vehicle = new THREE.Group(), rider = new THREE.Mesh(new THREE.BoxGeometry());
    const body = new THREE.Mesh(new THREE.BoxGeometry());
    vehicle.position.set(4, 0, 8); rider.position.set(0, 2, 0);
    vehicle.add(body, rider);
    const hidden = new THREE.Mesh(new THREE.BoxGeometry()); hidden.visible = false; vehicle.add(hidden);
    const aura = createStarAura(); aura.update([vehicle], true, 1);
    expect(aura.root.children).toHaveLength(2);
    expect(new THREE.Vector3().setFromMatrixPosition(aura.root.children[1].matrix).toArray()).toEqual([4, 2, 8]);
    vehicle.position.x = 6; rider.visible = false; aura.update([vehicle], true, 2);
    expect(aura.root.children).toHaveLength(1);
    expect(aura.root.children[0].matrix.elements[12]).toBe(6);
    aura.update([vehicle], false, 3); expect(aura.root.visible).toBe(false);
    const dispose = vi.spyOn(body.geometry, 'dispose'); aura.dispose();
    expect(dispose).not.toHaveBeenCalled();
    body.geometry.dispose(); rider.geometry.dispose(); hidden.geometry.dispose();
  });
  it('replays the shader clock at pause and uses slower motion instead of a frozen reduced mode', () => {
    const body = new THREE.Mesh(new THREE.BoxGeometry()), aura = createStarAura();
    aura.update([body], true, 2, true);
    const material = (aura.root.children[0] as THREE.Mesh).material as THREE.ShaderMaterial;
    const first = material.uniforms.uTime.value;
    aura.update([body], true, 2, true); expect(material.uniforms.uTime.value).toBe(first);
    aura.update([body], true, 3, true); expect(material.uniforms.uTime.value).toBeGreaterThan(first);
    aura.dispose(); body.geometry.dispose();
  });
});
