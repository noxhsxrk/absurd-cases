import * as THREE from 'three';
import {TOON} from '../../pov/cast/Toon';
import '../AbsurdEp1/cast';           // the recurring cast of the series: the man, the two officers, the judge
import {BOX, PM} from '../AbsurdEp1/boxcast';

/** EP2 adds only the eight bomb-disposal officers. Same box-people rig; the suit is extra boxes on the bones. */
export const BOMBS = Array.from({length: 8}, (_, i) => `bomb${i + 1}`);
BOMBS.forEach((id, i) => {
  TOON[id] = {skin: '#C99069', hair: '#141210', hairStyle: 'cap' as const, cap: '#476F66', top: '#476F66', under: '#39424E', pants: '#476F66', shoes: '#152028', outfit: 'vest' as const, female: false, build: 1.1};
  BOX[id] = {face: {skin: '#C99A6E', hair: '#141210', hairStyle: 'none', stubble: 0, mask: '#3A5C55'}, jacket: '#476F66', shirt: '#476F66', pants: '#476F66', shoes: '#152028', belt: '#152028', build: 1.3 + (i % 3) * 0.03};
});
export const IDS = ['nai', ...BOMBS, 'offA', 'offB', 'judge'];

const BODY_Q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0)));
const frame = (bone: THREE.Object3D) => { const g = new THREE.Group(); g.quaternion.copy(BODY_Q); bone.add(g); return g; };
const bx = (w: number, h: number, d: number, m: THREE.Material) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; return o; };
const fat = (bone: THREE.Object3D, child: THREE.Object3D, w: number, m: THREE.Material) => {
  const to = child.position.clone(); const len = to.length() + 3; const g = new THREE.Group(); g.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), to.clone().normalize()); bone.add(g);
  const o = bx(len, w, w, m); o.position.x = len / 2 - 1; g.add(o);
};
/** helmet with a wide visor, neck collar, chest plate, padded limbs. Call after applyBoxLook. */
export const applyBombSuit = (I: any, id: string) => {
  if (!BOMBS.includes(id) || I.__bomb) return; I.__bomb = true;
  const B = I.bones as Record<string, THREE.Object3D>;
  const suit = PM('#476F66', 'suit'), dark = PM('#2F4F49', 'suit2'), cream = PM('#E6E7CF', 'suit3'), visor = new THREE.MeshLambertMaterial({color: '#BFD4D2'});
  const head = frame(B.Bip01_Head);
  const dome = new THREE.Mesh(new THREE.CylinderGeometry(18, 20, 36, 8), suit); dome.castShadow = true; dome.frustumCulled = false; dome.position.set(0, 15, 2); head.add(dome);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(11, 18, 7, 8), suit); cap.frustumCulled = false; cap.position.set(0, 36, 2); head.add(cap);
  const v = bx(25, 15, 3, visor); v.position.set(0, 18, 20); head.add(v);
  const glint = bx(4, 13, 0.6, new THREE.MeshBasicMaterial({color: '#F4F6EE'})); glint.position.set(-7, 18, 21.8); glint.rotation.z = 0.2; head.add(glint);
  const chest = frame(B.Bip01_Spine2);
  const collar = bx(50, 14, 34, dark); collar.position.set(0, 25, 1); chest.add(collar);
  const plate = bx(46, 30, 8, suit); plate.position.set(0, 8, 13); chest.add(plate);
  const pt = bx(26, 7, 1, cream); pt.position.set(0, 13, 17.4); chest.add(pt);
  const belly = frame(B.Bip01_Spine1); const apron = bx(40, 34, 8, dark); apron.position.set(0, -4, 13); belly.add(apron);
  for (const s of ['L', 'R']) {
    fat(B[`Bip01_${s}_UpperArm`], B[`Bip01_${s}_Forearm`], 15, suit); fat(B[`Bip01_${s}_Forearm`], B[`Bip01_${s}_Hand`], 13, suit);
    fat(B[`Bip01_${s}_Thigh`], B[`Bip01_${s}_Calf`], 20, suit); fat(B[`Bip01_${s}_Calf`], B[`Bip01_${s}_Foot`], 17, dark);
    const mitt = bx(15, 8, 13, dark); mitt.position.set(6, 0, 0); B[`Bip01_${s}_Hand`].add(mitt);
  }
};
