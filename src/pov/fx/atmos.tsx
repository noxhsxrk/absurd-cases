import React, {useMemo} from 'react';
import * as THREE from 'three';
import {hash} from '../lib/math';

/** The air in the room is never empty: sun shafts through the window louvres with dust turning in them, and fine motes everywhere. */
const SUN = new THREE.Vector3(-12, -7.5, 3).normalize();      // direction the sunlight travels (from the directional light)
const WIN_X = 4.17, WIN_Y0 = 1.0, WIN_Y1 = 2.25, WIN_Z = [-4, -2, 0, 2, 4], WIN_W = 1.7;

/** one prism per window: the window rectangle swept along the sun direction down to the floor; alpha fades along it */
const shaftGeo = (zc: number) => {
  const len = WIN_Y1 / -SUN.y;                               // until the top edge reaches the floor
  const corners = [[WIN_Y0, zc - WIN_W / 2], [WIN_Y0, zc + WIN_W / 2], [WIN_Y1, zc + WIN_W / 2], [WIN_Y1, zc - WIN_W / 2]];
  const pos: number[] = [], col: number[] = [];
  const S = 8;
  const at = (c: number[], u: number) => { const k = Math.min(u * len, (c[0] - 0.02) / -SUN.y); return [WIN_X + SUN.x * k, c[0] + SUN.y * k, c[1] + SUN.z * k]; };
  for (let s = 0; s < S; s++) {
    const u0 = s / S, u1 = (s + 1) / S, a0 = 1 - u0, a1 = 1 - u1;
    for (let e = 0; e < 4; e++) {
      const c0 = corners[e], c1 = corners[(e + 1) % 4];
      const p = [at(c0, u0), at(c1, u0), at(c1, u1), at(c0, u1)], a = [a0, a0, a1, a1];
      [[0, 1, 2], [0, 2, 3]].forEach((tri) => tri.forEach((i) => { pos.push(...p[i]); col.push(a[i] * a[i], a[i] * a[i], a[i] * a[i]); }));
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g;
};

export const Shafts: React.FC<{dark: number; t: number}> = ({dark, t}) => {
  const geos = useMemo(() => WIN_Z.map(shaftGeo), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({color: '#FFE3B0', vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false}), []);
  mat.opacity = (0.035 + 0.075 * dark) * (0.92 + 0.08 * Math.sin(t * 0.7));   // clouds passing the sun
  return <>{geos.map((g, i) => <mesh key={i} geometry={g} material={mat} renderOrder={3} />)}</>;
};

/** ~1400 motes: drifting slowly in the whole room, brighter and denser in the sunny half */
export const Motes: React.FC<{t: number; dark: number}> = ({t, dark}) => {
  const N = 1400;
  const base = useMemo(() => Float32Array.from({length: N * 4}, (_, i) => hash(i * 1.37 + 0.11)), []);
  const geo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 3), 3)); return g; }, []);
  // round soft points; fade out within ~0.8 m of the lens (a mote on the lens would be a big square) and near the ceiling
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {uOp: {value: 0.5}, uCol: {value: new THREE.Color('#FFF4DC')}},
    vertexShader: `#include <common>
#include <logdepthbuf_pars_vertex>
uniform float uOp; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); float d = -mv.z;
      vA = uOp * smoothstep(0.5, 1.4, d) * (1.0 - smoothstep(2.0, 2.6, position.y)); gl_PointSize = clamp(14.0 / d, 1.0, 6.0) * (projectionMatrix[1][1] / 1.6); gl_Position = projectionMatrix * mv;
#include <logdepthbuf_vertex>
}`,
    fragmentShader: `#include <logdepthbuf_pars_fragment>
uniform vec3 uCol; varying float vA; void main(){
#include <logdepthbuf_fragment>
float r = length(gl_PointCoord - 0.5) * 2.0; float a = vA * (1.0 - smoothstep(0.2, 1.0, r)); if (a < 0.003) discard; gl_FragColor = vec4(uCol * a, a); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}), []);
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < N; i++) {
    const a = base[i * 4], b = base[i * 4 + 1], c = base[i * 4 + 2], d = base[i * 4 + 3];
    const sunny = i % 3 !== 0;                                      // two in three motes live in the window half
    const x = sunny ? 0.6 + a * 3.5 : -4 + a * 8, y = 0.25 + b * 2.6, z = -4.8 + c * 9.6;
    const sp = 0.02 + d * 0.05, ph = d * 40;
    p.setXYZ(i, x + Math.sin(t * sp * 4 + ph) * 0.12, ((y + t * sp * 0.6) % 2.85) + 0.1, z + Math.cos(t * sp * 3 + ph) * 0.1);
  }
  p.needsUpdate = true;
  mat.uniforms.uOp.value = 0.3 + 0.25 * dark;
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={4} />;
};
