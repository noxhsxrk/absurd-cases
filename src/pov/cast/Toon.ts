import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {CAST} from './cast';
import {hash, hashStr} from '../lib/math';

/**
 * Code-built stylised low-poly people, parented piece by piece to the Rocketbox Biped skeleton (cm units),
 * so the mocap clips drive them directly. Biped bones point along local +X; on spine/neck/head bones +Y is forward and +Z is the character's left.
 */
export type Outfit = 'shirt' | 'shortSleeve' | 'suit' | 'blouse' | 'vest';
/** extra men's cuts (see the `hair` section of buildToon) */
export type MaleHair = 'buzz' | 'crew' | 'undercut' | 'sidePart' | 'quiff' | 'curtain' | 'spiky' | 'messy' | 'slick' | 'curly' | 'manbun' | 'mullet';
export const MALE_HAIR: MaleHair[] = ['buzz', 'crew', 'undercut', 'sidePart', 'quiff', 'curtain', 'spiky', 'messy', 'slick', 'curly', 'manbun', 'mullet'];
export type ToonLook = {skin: string; hair: string; hairStyle: 'short' | 'long' | 'bun' | 'bald' | 'cap' | 'bob' | MaleHair; top: string; under?: string; tie?: string; pants: string; skirt?: boolean; shoes: string; outfit: Outfit; glasses?: boolean; headphones?: boolean; cap?: string; female: boolean; build: number; shorts?: boolean; socks?: string; bow?: string; pocket?: boolean; belt?: string; buckle?: boolean; sailor?: boolean; untucked?: boolean; pleats?: boolean; strap?: boolean; skirtHem?: number; skirtFlare?: number; noButton?: boolean};

const C = (id: string) => CAST[id];
export const TOON: Record<string, ToonLook> = {
  mali: {skin: '#C98E68', hair: '#1E1614', hairStyle: 'bun', top: '#B8403A', under: '#F4F1EA', pants: '#2A2E40', shoes: '#1B1B1F', outfit: 'suit', female: true, build: 0.95},
  ton: {skin: '#A86F4C', hair: '#16120F', hairStyle: 'cap', cap: '#2E3440', top: '#D9822B', pants: '#3A4150', shoes: '#2A221C', outfit: 'vest', under: '#E8C23A', female: false, build: 1.05},
  pim: {skin: '#D9A783', hair: '#141118', hairStyle: 'long', top: '#273554', under: '#F4F1EA', pants: '#1E2233', skirt: true, shoes: '#141418', outfit: 'suit', glasses: true, female: true, build: 1.0},
  beam: {skin: '#E0B08B', hair: '#2B211C', hairStyle: 'short', top: '#8DB3D6', pants: '#3F4656', shoes: '#2A2A2E', outfit: 'shortSleeve', female: false, build: 0.92},
  nok: {skin: '#CF9A74', hair: '#3A2A22', hairStyle: 'long', top: '#6FA982', pants: '#30354A', shoes: '#2A2A2E', outfit: 'blouse', female: true, build: 0.92},
  arm: {skin: '#D7A684', hair: '#1F1D24', hairStyle: 'short', top: '#7E68A8', pants: '#2B2E3B', shoes: '#1F1F24', outfit: 'shirt', glasses: true, female: false, build: 1.0},
  jay: {skin: '#C28B65', hair: '#1A1614', hairStyle: 'short', top: '#2B3245', under: '#F4F1EA', tie: '#A8323A', pants: '#2B3245', shoes: '#141418', outfit: 'suit', female: false, build: 1.08},
  fon: {skin: '#E2B08A', hair: '#2A211E', hairStyle: 'bun', top: '#D98FA6', pants: '#3B3F52', skirt: true, shoes: '#3A2A2E', outfit: 'blouse', glasses: true, female: true, build: 0.9},
  gun: {skin: '#D3A27C', hair: '#6B3B2A', hairStyle: 'bob', top: '#4FA3A5', pants: '#2A2D38', shoes: '#22252C', outfit: 'shirt', female: true, build: 0.95},
  mook: {skin: '#BC8760', hair: '#191517', hairStyle: 'short', top: '#E3C25A', pants: '#2F3342', shoes: '#22252C', outfit: 'shortSleeve', female: false, build: 0.97},
  oat: {skin: '#E2B48F', hair: '#1D1A1F', hairStyle: 'short', top: '#B8533C', pants: '#3A3C46', shoes: '#22252C', outfit: 'shirt', headphones: true, female: false, build: 1.06},
  lek: {skin: '#A8734F', hair: '#8E8E92', hairStyle: 'cap', cap: '#4B7F9E', top: '#4B7F9E', under: '#E8C23A', pants: '#3D4350', shoes: '#2A2A2E', outfit: 'vest', female: false, build: 1.04},
  dao: {skin: '#DDAA84', hair: '#2C1D19', hairStyle: 'long', top: '#F0EBDF', pants: '#3D2F45', skirt: true, shoes: '#2A1F24', outfit: 'blouse', female: true, build: 0.93},
};
export const isFemale = (id: string) => (TOON[id] ?? {female: C(id)?.hairStyle === 'long' || C(id)?.hairStyle === 'bun'}).female;

const mats = new Map<string, THREE.MeshStandardMaterial>();
const M = (c: string, rough = 0.85) => { const k = c + rough; if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({color: c, roughness: rough, metalness: 0})); return mats.get(k)!; };
const mesh = (g: THREE.BufferGeometry, m: THREE.Material) => { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; return o; };
const UP = new THREE.Vector3(0, 1, 0);
/** frame on spine/neck/head bones: x = left, y = up (bone +X), z = forward (bone +Y) */
const BODY_Q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0)));
const bodyFrame = (bone: THREE.Object3D, pos: [number, number, number] = [0, 0, 0]) => { const g = new THREE.Group(); g.quaternion.copy(BODY_Q); g.position.set(pos[1], pos[2], pos[0]); bone.add(g); return g; };

/** tapered capsule from the bone origin to `to` (bone-local), radius r0 → r1 */
const limb = (bone: THREE.Object3D, to: THREE.Vector3, r0: number, r1: number, m: THREE.Material, extend = 0) => {
  const len = to.length() + extend, pts: THREE.Vector2[] = [];
  const seg = 5; for (let i = 0; i <= seg; i++) { const a = (i / seg) * Math.PI / 2; pts.push(new THREE.Vector2(Math.sin(a) * r0, -Math.cos(a) * r0)); }
  for (let i = 0; i <= seg; i++) { const a = (i / seg) * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r1, len + Math.sin(a) * r1 * 0.9)); }
  const o = mesh(new THREE.LatheGeometry(pts, 10), m); o.quaternion.setFromUnitVectors(UP, to.clone().normalize()); bone.add(o); return o;
};
const ell = (r: [number, number, number], m: THREE.Material, w = 14, h = 10) => { const o = mesh(new THREE.SphereGeometry(1, w, h), m); o.scale.set(...r); return o; };
const rbox = (s: [number, number, number], rad: number, m: THREE.Material) => mesh(new RoundedBoxGeometry(s[0], s[1], s[2], 2, rad), m);


/**
 * Skinned garments: one continuous mesh per garment, built around the rest pose in root space (cm) and skinned to the
 * Biped bones with smooth weights, so trousers/shorts/skirts bend at the hips and knees like cloth instead of rigid pieces.
 * Rest pose: hips at y ≈ 90, thigh joints at x = ±8.8, knees at y ≈ 50, character faces +z, its left is +x.
 */
type Wt = Record<string, number>;
const sm = (x: number) => { const k = Math.min(1, Math.max(0, x)); return k * k * (3 - 2 * k); };
const skinned = (root: THREE.Object3D, B: Record<string, THREE.Object3D>, rings: {p: THREE.Vector3; w: Wt}[][], m: THREE.Material, flip = false) => {
  const names: string[] = []; const bi = (n: string) => { let i = names.indexOf(n); if (i < 0) { names.push(n); i = names.length - 1; } return i; };
  const K = rings[0].length, pos: number[] = [], si: number[] = [], sw: number[] = [], ix: number[] = [];
  rings.forEach((ring) => ring.forEach(({p, w}) => {
    pos.push(p.x, p.y, p.z);
    const e = Object.entries(w).filter(([, v]) => v > 1e-3).sort((a, b) => b[1] - a[1]).slice(0, 4); const tot = e.reduce((a, [, v]) => a + v, 0);
    for (let k = 0; k < 4; k++) { si.push(e[k] ? bi(e[k][0]) : 0); sw.push(e[k] ? e[k][1] / tot : 0); }
  }));
  for (let j = 0; j + 1 < rings.length; j++) for (let k = 0; k < K; k++) {
    const a = j * K + k, b = j * K + ((k + 1) % K), c = a + K, d = b + K;
    if (flip) ix.push(a, c, b, b, c, d); else ix.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  g.setIndex(ix); g.computeVertexNormals();
  const o = new THREE.SkinnedMesh(g, m); o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; root.add(o);
  root.updateMatrixWorld(true); o.bind(new THREE.Skeleton(names.map((n) => B[n] as THREE.Bone)), new THREE.Matrix4());
  return o;
};
const wpos = (B: Record<string, THREE.Object3D>, n: string) => B[n].getWorldPosition(new THREE.Vector3());

/** trousers (hem below the knee) or shorts (hem above it): two half-garments, each morphing from half the waist (a D shape) to a tube round one leg */
const trousers = (root: THREE.Object3D, B: Record<string, THREE.Object3D>, w: number, m: THREE.Material, hemY: number, waistR: (y: number) => number) => {
  const H = 14, K = H * 2;
  const ys = [107, 104.5, 101, 97, 93.5, 90.5, 87.5, 84.5, 81, 76, 70, 64, 58, 53, 48, 42, 34, 26, 18, 12].filter((y) => y > hemY + 2.5).concat([hemY]);
  for (const s of [1, -1]) {
    const sd = s > 0 ? 'L' : 'R', hip = wpos(B, `Bip01_${sd}_Thigh`), knee = wpos(B, `Bip01_${sd}_Calf`), ank = wpos(B, `Bip01_${sd}_Foot`);
    const rings = ys.map((y) => {
      const b = sm((95 - y) / 10.5);                                   // 0 = waist (D shape) … 1 = round leg tube
      const axis = y > knee.y ? hip.clone().lerp(knee, (hip.y - y) / (hip.y - knee.y)) : knee.clone().lerp(ank, (knee.y - y) / (knee.y - ank.y));
      const rl = (y > knee.y ? 9.4 - 1.5 * (hip.y - y) / (hip.y - knee.y) : 7.9 - 0.9 * (knee.y - y) / (knee.y - ank.y)) * w;
      const rx = waistR(y) * w * 1.05, rz = rx * 0.68;
      const tw = sm((93 - y) / 13) * (1 - sm((knee.y + 4 - y) / 8)), cw = sm((knee.y + 4 - y) / 8);
      return Array.from({length: K}, (_, k) => {
        let dx: number, dz: number, cx: number, cz: number;
        if (k <= H) { const f = -Math.PI / 2 + (Math.PI * k) / H; dx = s * rx * Math.cos(f); dz = rz * Math.sin(f); cx = s * rl * Math.cos(f); cz = rl * Math.sin(f); }
        else { const u = (k - H) / H, f = Math.PI / 2 + Math.PI * u; dx = 0; dz = rz * (1 - 2 * u); cx = s * rl * Math.cos(f); cz = rl * Math.sin(f); }
        const p = new THREE.Vector3(dx * (1 - b) + (axis.x + cx) * b, y, dz * (1 - b) + (axis.z + cz) * b - 0.3 * (1 - b));
        const wt: Wt = {Bip01_Spine: Math.max(0, 1 - tw - cw)};   // thighs hang off Bip01_Spine (Biped), so the seat moves with it
        wt[`Bip01_${sd}_Thigh`] = tw; wt[`Bip01_${sd}_Calf`] = cw; return {p, w: wt};
      });
    });
    skinned(root, B, rings, m, s < 0);
  }
};

/** skirt: waist band → hips → flared hem; the lower half follows the thighs (front more than back) so it drapes over the lap when sitting */
const skirtMesh = (root: THREE.Object3D, B: Record<string, THREE.Object3D>, w: number, m: THREE.Material, hemY: number, flare: number, pleats: boolean) => {
  const K = pleats ? 96 : 40, ys = [107, 104, 100, 96, 92, 87, 81, 74, 67, 60, 54, 49, 44].filter((y) => y > hemY + 2.5).concat([hemY]);
  const rOf = (y: number) => y > 92 ? 14.6 + (107 - y) * 0.13 : 16.5 + (92 - y) / (92 - hemY) * (flare - 16.5);
  const rings = ys.map((y) => Array.from({length: K}, (_, k) => {
    const a = (k / K) * Math.PI * 2; let r = rOf(y) * w;
    if (pleats && y < 100) { const tri = Math.abs(((k % 4) / 2) - 1) * 2 - 1; r *= 1 + 0.05 * tri * sm((100 - y) / 25); }
    const x = Math.sin(a) * r, z = Math.cos(a) * r * 0.78;
    const f = sm((95 - y) / (95 - hemY)), front = 0.35 + 0.65 * sm((z / (r * 0.78) + 1) / 2), lr = sm(x / (r * 1.1) + 0.5);
    const th = f * 0.85 * front;
    const wt: Wt = {Bip01_Spine: 1 - th, Bip01_L_Thigh: th * lr, Bip01_R_Thigh: th * (1 - lr)};
    return {p: new THREE.Vector3(x, y, z - 0.3), w: wt};
  }));
  return skinned(root, B, rings, m, true);
};

export type ToonRig = {eyes: THREE.Object3D[]; mouth: THREE.Object3D; brows: THREE.Object3D[]};

export const buildToon = (root: THREE.Object3D, id: string): ToonRig => {
  const L = TOON[id]; const B: Record<string, THREE.Object3D> = {}; root.traverse((o) => { B[o.name] = o; });
  const skin = M(L.skin, 0.7), top = M(L.top), pants = M(L.pants), shoe = M(L.shoes, 0.5), hair = M(L.hair, 0.75), under = M(L.under ?? '#F4F1EA');
  const w = (L.female ? 0.88 : 1) * L.build, sd = hash(hashStr(id));
  const child = (b: string, c: string) => B[c].position.clone();
  // --- torso: three lathed sections (hips / abdomen / chest) with elliptical cross-section, overlapping so bending never opens a gap ---
  const F = L.female;
  const trunk = (frame: THREE.Object3D, prof: [number, number][], zs: number, m: THREE.Material, grow = 1) => {
    const o = mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r * w * grow, y)), 16), m); o.scale.z = zs * (grow > 1 ? 1.02 : 1); frame.add(o); return o;
  };
  const hips = bodyFrame(B.Bip01_Spine), belly = bodyFrame(B.Bip01_Spine1), chest = bodyFrame(B.Bip01_Spine2);
  const HIP: [number, number][] = [[0.01, -18], [9, -17.6], [14.2, -14], [15.6, -8], [15.2, -1], [14.4, 5]];
  const ABD: [number, number][] = F ? [[13.6, -9], [12.8, -2], [12.9, 5], [14.2, 12], [15, 17]] : [[14.4, -9], [14.2, -2], [14.6, 6], [15.6, 13], [16.2, 17]];
  const CH: [number, number][] = F ? [[14.6, -6], [15.4, 2], [15.8, 9], [15.2, 14], [12.5, 17.5], [7.5, 19.5], [5, 20]] : [[15.8, -6], [17.2, 2], [18.4, 10], [18, 15.5], [14.5, 19.5], [8.5, 21.5], [5.4, 22]];
  const zsH = 0.66, zsA = F ? 0.66 : 0.64, zsC = F ? 0.64 : 0.6;
  // hips: a body under the skinned garment (slightly smaller, so it never pokes through when the legs move)
  trunk(hips, HIP.map(([r, y]) => [r * 0.93, y] as [number, number]), zsH, pants); trunk(belly, ABD, zsA, top); trunk(chest, CH, zsC, top);
  const cloth = M(L.pants, 0.88); cloth.side = THREE.DoubleSide;
  const spineY = B.Bip01_Spine.getWorldPosition(new THREE.Vector3()).y, rAt = (y: number) => { const yr = y - spineY; if (yr >= HIP[HIP.length - 1][1]) return HIP[HIP.length - 1][0]; for (let i = HIP.length - 1; i > 0; i--) { const [r1, y1] = HIP[i], [r0, y0] = HIP[i - 1]; if (yr <= y1 && yr >= y0) return r0 + ((yr - y0) / (y1 - y0)) * (r1 - r0); } return 15; };
  if (L.skirt) skirtMesh(root, B, w, cloth, L.skirtHem ?? (L.pleats ? 52 : 50), L.skirtFlare ?? (L.pleats ? 26.5 : 19.5), !!L.pleats);
  else trousers(root, B, w, cloth, L.shorts ? 53 : 13, (y) => Math.max(rAt(Math.max(y, spineY - 9)), 14.4));
  const belt = mesh(new THREE.CylinderGeometry(15.75 * w, 15.75 * w, L.buckle ? 2.6 : 1.6, 18, 1, true), M(L.belt ?? '#1E1E22', 0.45)); belt.scale.z = 0.7; belt.position.y = 3.6; hips.add(belt);
  if (L.buckle) { const bk = rbox([4.2, 3.0, 0.8], 0.4, new THREE.MeshStandardMaterial({color: '#C9CDD3', metalness: 0.8, roughness: 0.25})); bk.position.set(0, 3.6, 15.75 * w * 0.7 + 0.25); hips.add(bk); }
  const frontZ = (prof: [number, number][], zs: number, y: number) => { for (let i = 1; i < prof.length; i++) { const [r0, y0] = prof[i - 1], [r1, y1] = prof[i]; if (y >= y0 && y <= y1) return (r0 + ((y - y0) / (y1 - y0)) * (r1 - r0)) * w * zs; } return 0; };
  if (L.outfit === 'suit') {
    const v = mesh(new THREE.CircleGeometry(6, 3), under); v.rotation.z = -Math.PI / 2; v.scale.set(1.35, 0.7, 1); v.position.set(0, 13.2, frontZ(CH, zsC, 13.2) + 0.15); v.rotation.x = -0.12; chest.add(v);
    if (L.tie) { const t = rbox([2.6, 15, 0.8], 0.4, M(L.tie, 0.6)); t.position.set(0, 7.5, frontZ(CH, zsC, 7.5) + 0.35); t.rotation.x = -0.05; chest.add(t); }
    if (!L.noButton) for (const sx of [-1, 1]) { const btn = ell([0.6, 0.6, 0.3], M('#15161A', 0.4), 6, 4); btn.position.set(0, -1 + sx * 2.5, frontZ(ABD, zsA, 8) + 0.1); if (sx < 0) belly.add(btn); }
  }
  if (L.outfit === 'vest') {
    const vm = M(L.under!, 0.7); trunk(chest, CH.slice(0, 5), zsC, vm, 1.05); trunk(belly, ABD, zsA, vm, 1.05);
    for (const [fr, prof, zs, y] of [[chest, CH, zsC, 3], [belly, ABD, zsA, 6]] as [THREE.Object3D, [number, number][], number, number][]) { const r = frontZ(prof, 1, y) / w; const st = mesh(new THREE.CylinderGeometry(r * w * 1.07, r * w * 1.07, 1.6, 16, 1, true), M('#E4E7EA', 0.35)); st.scale.z = zs * 1.03; st.position.y = y; fr.add(st); }
  }
  if (L.outfit === 'shirt' || L.outfit === 'shortSleeve') { const col = mesh(new THREE.TorusGeometry(5.8, 1.3, 6, 14), top); col.rotation.x = Math.PI / 2; col.position.set(0, F ? 19.6 : 21.3, 0.8); col.scale.set(1, 0.85, 1); chest.add(col); }
  if (L.sailor) { // wide flat collar: square flap on the back, lapels meeting in a V at the front
    const cm = M(L.top, 0.9);
    const flap = rbox([22 * w, 13, 1.2], 0.6, cm); flap.position.set(0, F ? 12.5 : 14, -(frontZ(CH, zsC, 13) + 0.4)); flap.rotation.x = 0.12; chest.add(flap);
    for (const sx of [-1, 1]) { const lp = rbox([7.5, 15, 1.0], 0.5, cm); lp.position.set(sx * 5.2, F ? 13.2 : 15, frontZ(CH, zsC, 13) + 0.45); lp.rotation.set(-0.12, sx * 0.18, sx * 0.62); chest.add(lp);
      const sh2 = rbox([9, 1.2, 13], 0.5, cm); sh2.position.set(sx * 9.5 * w, F ? 18.6 : 20.4, -0.5); sh2.rotation.z = sx * -0.25; chest.add(sh2); }
    const vneck = mesh(new THREE.CircleGeometry(3.6, 3), M(L.skin, 0.7)); vneck.rotation.z = -Math.PI / 2; vneck.scale.set(1.5, 0.8, 1); vneck.position.set(0, 16.8, frontZ(CH, zsC, 16.8) + 0.25); vneck.rotation.x = -0.3; chest.add(vneck);
  }
  if (L.bow) { const bm = M(L.bow, 0.6); const big = L.sailor ? 1.7 : 1; const y = L.sailor ? 12.2 : F ? 17.4 : 19.2, z = frontZ(CH, zsC, y) + 0.9; for (const sx of [-1, 1]) { const w2 = ell([2.2 * big, 1.3 * big, 0.8], bm, 8, 6); w2.position.set(sx * 1.9 * big, y, z); w2.rotation.z = sx * 0.35; chest.add(w2); if (L.sailor) { const tail = rbox([1.8, 6, 0.6], 0.3, bm); tail.position.set(sx * 1.2, y - 4, z - 0.1); tail.rotation.z = sx * 0.28; chest.add(tail); } } const kn = ell([0.9 * big, 0.9 * big, 0.7], bm, 6, 5); kn.position.set(0, y, z + 0.2); chest.add(kn); }
  if (L.untucked) { const hem = mesh(new THREE.LatheGeometry([[15.2, 6], [16.2, -1], [16.8, -6], [16.6, -7], [0.01, -7]].map(([r, y]) => new THREE.Vector2(r * w, y)), 18), top); hem.scale.z = zsH * 1.06; hips.add(hem); }
  if (L.pocket) { const pk = rbox([4.6, 4.8, 0.5], 0.4, M(L.top, 0.95)); pk.position.set(5.2, 8, frontZ(CH, zsC, 8) + 0.1); pk.rotation.x = -0.08; chest.add(pk); const em = rbox([2.4, 0.9, 0.3], 0.2, M('#2C3E78', 0.6)); em.position.set(5.2, 11.4, frontZ(CH, zsC, 11.4) + 0.2); chest.add(em); }
  // --- neck + head ---
  limb(B.Bip01_Neck, child('Bip01_Neck', 'Bip01_Head').multiplyScalar(1.4), 5.2, 4.8, skin);
  const head = bodyFrame(B.Bip01_Head); const HS = L.female ? 1.04 : 1.08;
  const hc = new THREE.Vector3(0, 11.5, 2.6); const hr: [number, number, number] = [9.6 * HS, 12.2 * HS, 11 * HS];
  const sk = ell(hr, skin, 18, 14); sk.position.copy(hc); head.add(sk);
  const surf = (x: number, y: number, out = 0) => { const dx = x / hr[0], dy = (y - hc.y) / hr[1]; const z = hc.z + hr[2] * Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy)); return new THREE.Vector3(x, y, z + out); };
  // ears, nose
  for (const s of [-1, 1]) { const e = ell([1.6, 3.2, 2.4], skin, 8, 6); e.position.set(s * hr[0] * 0.98, 10.5, 2); head.add(e); }
  const nose = ell([1.5, 1.9, 1.6], skin, 8, 6); nose.position.copy(surf(0, 8.6, -0.4)); head.add(nose);
  // eyes: white + dark iris, on the face surface at the Biped eye landmarks
  const eyes: THREE.Object3D[] = []; const white = M('#FBFAF7', 0.4), iris = M('#2A1F1A', 0.3);
  for (const s of [-1, 1]) {
    const g = new THREE.Group(); g.position.copy(surf(s * 3.4, 11.4, -0.6)); g.rotation.y = s * 0.18; head.add(g);
    const wh = ell([1.75, 2.1, 0.9], white, 12, 8); g.add(wh); const ir = ell([1.05, 1.3, 0.6], iris, 10, 8); ir.position.set(-s * 0.12, -0.1, 0.55); g.add(ir);
    const hl = ell([0.32, 0.32, 0.2], white, 6, 4); hl.position.set(0.35, 0.45, 1.0); g.add(hl); eyes.push(g);
  }
  const brows: THREE.Object3D[] = [];
  for (const s of [-1, 1]) { const b = rbox([3.8, 0.75, 0.9], 0.3, hair); b.position.copy(surf(s * 3.5, 14.0, 0.1)); b.rotation.set(-0.15, s * 0.2, s * -0.08); head.add(b); brows.push(b); }
  const mouth = rbox([3.8, 0.9, 0.8], 0.35, M('#6E2F2E', 0.5)); mouth.position.copy(surf(0, 5.2, 0.1)); mouth.rotation.x = -0.25; head.add(mouth);
  if (L.glasses) { const fr = M('#1E1E22', 0.4); for (const s of [-1, 1]) { const r = mesh(new THREE.TorusGeometry(2.1, 0.32, 5, 14), fr); r.position.copy(surf(s * 3.4, 11.4, 0.6)); r.rotation.y = s * 0.18; head.add(r); } const br = rbox([2.2, 0.4, 0.4], 0.15, fr); br.position.copy(surf(0, 11.8, 1.0)); head.add(br); }
  // hair
  const H = (r: [number, number, number], p: [number, number, number], m = hair, tilt = 0) => { const o = ell(r, m, 16, 12); o.position.set(...p); o.rotation.x = tilt; head.add(o); return o; };
  if (L.hairStyle === 'short') { H([hr[0] * 1.06, hr[1] * 0.72, hr[2] * 1.03], [0, hc.y + 4.2, hc.z - 1.6], hair, -0.25); H([hr[0] * 0.98, hr[1] * 0.75, hr[2] * 0.6], [0, hc.y + 1, hc.z - 5.5]); }
  if (L.hairStyle === 'long' || L.hairStyle === 'bob') { H([hr[0] * 1.08, hr[1] * 0.74, hr[2] * 1.04], [0, hc.y + 4, hc.z - 1.4], hair, -0.22); const back = rbox([hr[0] * 2.1, L.hairStyle === 'long' ? 30 : 18, 8], 4, hair); back.position.set(0, L.hairStyle === 'long' ? 2 : 6, hc.z - 8.5); head.add(back);
    for (const s of [-1, 1]) { const side = rbox([3.4, L.hairStyle === 'long' ? 24 : 15, 9], 1.6, hair); side.position.set(s * hr[0] * 0.98, L.hairStyle === 'long' ? 6 : 8.5, hc.z - 3.5); head.add(side); } }
  if (L.hairStyle === 'bun') { H([hr[0] * 1.06, hr[1] * 0.72, hr[2] * 1.03], [0, hc.y + 4.2, hc.z - 1.6], hair, -0.25); H([hr[0] * 0.98, hr[1] * 0.75, hr[2] * 0.6], [0, hc.y + 1, hc.z - 5.5]); H([5, 5, 5], [0, hc.y + 9, hc.z - 10]); }
  if (L.hairStyle === 'cap') { const cm = M(L.cap ?? '#333', 0.8); H([hr[0] * 1.08, hr[1] * 0.68, hr[2] * 1.05], [0, hc.y + 4.8, hc.z - 1.2], cm, -0.2); const brim = rbox([16, 1.2, 9], 0.6, cm); brim.position.set(0, hc.y + 5.2, hc.z + 11.5); brim.rotation.x = 0.12; head.add(brim);
    H([hr[0] * 0.98, hr[1] * 0.55, hr[2] * 0.6], [0, hc.y - 1, hc.z - 5.8]); }
  // --- men's cuts. Head frame: x = character's left, y up, z forward; head centre hc, radii hr (top of the skull ≈ hc.y + hr[1]) ---
  {
    const hs = L.hairStyle as string; const top = hc.y + hr[1];
    const base = (k = 1, back = true) => { H([hr[0] * (1.0 + 0.05 * k), hr[1] * (0.66 + 0.06 * k), hr[2] * (1.0 + 0.03 * k)], [0, hc.y + 4.4, hc.z - 1.8], hair, -0.25); if (back) H([hr[0] * (0.96 + 0.02 * k), hr[1] * 0.72, hr[2] * 0.58], [0, hc.y + 0.6, hc.z - 5.6]); };
    const tuft = (x: number, y: number, z: number, r: [number, number, number], rx = 0, rz = 0, m = hair) => { const o = ell(r, m, 10, 8); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); head.add(o); return o; };
    const cone = (x: number, y: number, z: number, h: number, r: number, rx: number, rz: number) => { const o = mesh(new THREE.ConeGeometry(r, h, 6), hair); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); head.add(o); };
    // faded sides: a thin shell barely off the scalp, the hair colour mixed toward the skin
    const fade = () => { const fm = M('#' + new THREE.Color(L.hair).lerp(new THREE.Color(L.skin), 0.14).getHexString(), 0.95); H([hr[0] * 1.025, hr[1] * 0.74, hr[2] * 1.02], [0, hc.y + 3.2, hc.z - 1.4], fm, -0.2); H([hr[0] * 1.0, hr[1] * 0.76, hr[2] * 0.62], [0, hc.y + 0.4, hc.z - 5.4], fm); };
    if (hs === 'buzz') { const bm = M('#' + new THREE.Color(L.hair).lerp(new THREE.Color(L.skin), 0.12).getHexString(), 0.95); H([hr[0] * 1.03, hr[1] * 0.72, hr[2] * 1.025], [0, hc.y + 3.8, hc.z - 1.4], bm, -0.22); H([hr[0] * 1.0, hr[1] * 0.76, hr[2] * 0.62], [0, hc.y + 0.4, hc.z - 5.4], bm); }
    if (hs === 'crew') { base(0.4); tuft(0, top - 3.2, hc.z + 6.5, [6.5, 2.4, 3.2], 0.3); }
    if (hs === 'undercut') { fade(); const tp = H([hr[0] * 0.9, hr[1] * 0.44, hr[2] * 1.04], [0, hc.y + hr[1] * 0.6, hc.z - 0.6], hair, -0.3); void tp; tuft(0, top - 1.8, hc.z + 6.8, [hr[0] * 0.66, 2.6, 3.8], 0.15); }
    if (hs === 'sidePart') { base(0.8); tuft(-1.6, top - 2.4, hc.z + 4.0, [hr[0] * 0.78, 2.8, 6.5], 0.15, 0.12); }
    if (hs === 'quiff') { fade(); H([hr[0] * 0.9, hr[1] * 0.44, hr[2] * 1.02], [0, hc.y + hr[1] * 0.6, hc.z - 1.2], hair, -0.3); tuft(0, top - 0.6, hc.z + 5.6, [hr[0] * 0.66, 3.8, 5.0], -0.6); tuft(0, top - 1.0, hc.z + 8.6, [hr[0] * 0.52, 2.6, 2.6], -0.9); }
    if (hs === 'curtain') { base(1); for (const sx of [-1, 1]) { const f = rbox([6.4, 5.0, 2.0], 1.0, hair); f.position.copy(surf(sx * 4.6, 18.2, 0.4)); f.rotation.set(-0.55, sx * 0.3, sx * 0.55); head.add(f); } }
    if (hs === 'spiky') { base(0.2); for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2, rr = i % 2 ? 4.5 : 7; const x = Math.cos(a) * rr, z = hc.z - 1 + Math.sin(a) * rr; cone(x, top - 0.8 + (i % 3) * 0.4, z, 5.5 + hash(sd * 9 + i) * 2, 1.9, Math.sin(a) * 0.55, -Math.cos(a) * 0.55); } }
    if (hs === 'messy') { base(0.9); for (let i = 0; i < 9; i++) { const a = hash(sd * 7 + i) * Math.PI * 2, rr = 2 + hash(sd * 3 + i) * 6; tuft(Math.cos(a) * rr, top - 1 + hash(i + sd) * 1.6, hc.z + Math.sin(a) * rr, [3.2, 2.2, 3.6], (hash(i * 5) - 0.5) * 0.9, (hash(i * 9) - 0.5) * 0.9); } tuft(1.5, top - 4.5, hc.z + 8.8, [5.5, 2.2, 2.4], 0.6, 0.25); }
    if (hs === 'slick') { const sm2 = M(L.hair, 0.25); H([hr[0] * 1.04, hr[1] * 0.7, hr[2] * 1.06], [0, hc.y + 4.0, hc.z - 2.4], sm2, -0.35); H([hr[0] * 0.98, hr[1] * 0.74, hr[2] * 0.62], [0, hc.y + 0.4, hc.z - 5.8], sm2); }
    if (hs === 'curly') { base(0.6); for (let i = 0; i < 26; i++) { const u = hash(sd * 2 + i * 1.7), v = hash(sd * 5 + i * 2.3); const a = u * Math.PI * 2, el = 0.2 + v * 1.1; const x = Math.cos(a) * Math.cos(el) * hr[0] * 0.98, y = hc.y + 3 + Math.sin(el) * hr[1] * 0.88, z = hc.z - 1 + Math.sin(a) * Math.cos(el) * hr[2] * 0.98; if (z > hc.z + 7 && y < top - 4) continue; tuft(x, y, z, [2.6, 2.6, 2.6]); } }
    if (hs === 'manbun') { const sm2 = M(L.hair, 0.5); H([hr[0] * 1.04, hr[1] * 0.7, hr[2] * 1.04], [0, hc.y + 4.0, hc.z - 2.2], sm2, -0.3); H([hr[0] * 0.98, hr[1] * 0.72, hr[2] * 0.6], [0, hc.y + 0.8, hc.z - 5.6], sm2); tuft(0, top + 1.8, hc.z - 6.5, [3.8, 3.4, 3.8]); const tie = mesh(new THREE.TorusGeometry(2.4, 0.6, 5, 12), M('#1A1A1C', 0.6)); tie.position.set(0, top - 0.4, hc.z - 6); tie.rotation.x = 0.6; head.add(tie); }
    if (hs === 'mullet') { base(0.9); const back2 = rbox([hr[0] * 1.7, 13, 5], 2.4, hair); back2.position.set(0, hc.y - 7.5, hc.z - 8.2); back2.rotation.x = 0.15; head.add(back2); tuft(0, top - 3.5, hc.z + 7.5, [6, 2.4, 3], 0.4); }
  }
  if (L.headphones) { const hm = M('#22252B', 0.45); const band = mesh(new THREE.TorusGeometry(hr[0] * 1.12, 0.9, 6, 18, Math.PI), hm); band.position.set(0, hc.y + 1, hc.z - 1); head.add(band); for (const s of [-1, 1]) { const c = ell([2.2, 3.6, 3.6], hm, 10, 8); c.position.set(s * hr[0] * 1.1, hc.y + 0.5, hc.z - 1); head.add(c); } }
  // --- arms ---
  const longSleeve = L.outfit !== 'shortSleeve';
  for (const s of ['L', 'R']) {
    const ua = B[`Bip01_${s}_UpperArm`], fa = B[`Bip01_${s}_Forearm`], hd = B[`Bip01_${s}_Hand`];
    limb(ua, child('', `Bip01_${s}_Forearm`), 5.6 * w, 4.4 * w, longSleeve ? top : skin);
    if (!longSleeve) { const sl = limb(ua, new THREE.Vector3(13, 0, 0), 6.0 * w, 5.6 * w, top); sl.position.x = -1.5; }
    limb(fa, child('', `Bip01_${s}_Hand`), 4.1 * w, 3.3 * w, longSleeve ? top : skin);
    if (longSleeve) { const cuff = limb(fa, new THREE.Vector3(2.2, 0, 0), 3.6 * w, 3.6 * w, L.outfit === 'suit' ? under : top); cuff.position.x = child('', `Bip01_${s}_Hand`).length() - 2.4; }
    // a real five-fingered hand on the Biped finger bones (Finger0 = thumb … Finger4 = little finger, 3 phalanges each, local +x along the finger),
    // so the mocap's own finger animation and the gesture hand shapes (acting.ts `fingers`) both show
    const fp = (n: number, j = '') => B[`Bip01_${s}_Finger${n}${j}`];
    if (fp(1) && fp(4)) {
      const k1 = fp(1).position, k4 = fp(4).position, zc = (k1.z + k4.z) / 2, span = Math.abs(k1.z - k4.z);
      const palm = rbox([Math.max(k1.x, k4.x) + 0.6, 2.9, span + 2.4], 1.3, skin); palm.position.set((Math.max(k1.x, k4.x) + 0.6) / 2 - 0.2, 0.15, zc); hd.add(palm);
      const R = [1.25, 1.02, 1.06, 0.98, 0.86]; // thumb … little finger
      for (let n = 0; n < 5; n++) {
        const segs: [THREE.Object3D, THREE.Object3D | undefined][] = [[fp(n), fp(n, '1')], [fp(n, '1'), fp(n, '2')], [fp(n, '2'), fp(n, 'Nub')]];
        segs.forEach(([a, b], i) => { if (!a) return; const to = b ? b.position.clone() : new THREE.Vector3(2, 0, 0); const r0 = R[n] * (1 - i * 0.09), r1 = R[n] * (1 - (i + 1) * 0.09);
          limb(a, to.lengthSq() < 0.01 ? new THREE.Vector3(2, 0, 0) : to, r0, r1, skin); });
        // knuckle filler where the finger leaves the palm
        if (n > 0) { const kn = ell([R[n] * 1.05, R[n] * 1.05, R[n] * 1.05], skin, 8, 6); fp(n).add(kn); }
      }
      // thenar pad (the thumb's fleshy base on the palm)
      const pad = ell([3.2, 1.6, 2.2], skin, 10, 8); pad.position.set(2.6, 0.4, fp(0).position.z * 0.55); hd.add(pad);
    } else {
      const palm = rbox([9.5, 3.4, 8], 1.6, skin); palm.position.set(5, 0, (s === 'L' ? 1 : -1) * 0.6); hd.add(palm);
      const th = limb(hd, new THREE.Vector3(5, 1, s === 'L' ? -4.6 : 4.6), 1.3, 1.1, skin); th.position.set(1.5, 0.5, (s === 'L' ? -1 : 1) * 2.4);
    }
  }
  // --- legs ---
  for (const s of ['L', 'R']) {
    const th = B[`Bip01_${s}_Thigh`], ca = B[`Bip01_${s}_Calf`], ft = B[`Bip01_${s}_Foot`];
    const knee = child('', `Bip01_${s}_Calf`);
    // legs inside the skinned garment: skin where a hem can show them, garment colour where they stay covered
    if (L.skirt) { limb(th, knee.clone().multiplyScalar(0.7), 6.6 * w, 5.6 * w, M(L.pants)); const lo = limb(th, knee.clone().multiplyScalar(0.35), 5.5 * w, 5.0 * w, skin); lo.position.copy(knee.clone().multiplyScalar(0.66)); }
    else limb(th, knee, 6.9 * w, 5.3 * w, L.shorts ? skin : pants);
    const foot = child('', `Bip01_${s}_Foot`);
    limb(ca, foot, (L.skirt || L.shorts ? 5.4 : 5.0) * w, 4.0 * w, L.skirt || L.shorts ? skin : pants);
    if (L.socks) { const sm = M(L.socks, 0.9); const so = limb(ca, foot.clone().multiplyScalar(0.2), 4.4 * w, 4.3 * w, sm); so.position.copy(foot.clone().multiplyScalar(0.8)); const fold = limb(ca, foot.clone().multiplyScalar(0.06), 4.8 * w, 4.8 * w, sm); fold.position.copy(foot.clone().multiplyScalar(0.78)); }
    const sh = rbox([9, 26, 10.5], 3.5, shoe); sh.position.set(6.5, 6.5, 0); ft.add(sh);
    if (L.strap) { const st2 = rbox([1.6, 2.0, 11.2], 0.6, shoe); st2.position.set(10.6, 7.5, 0); ft.add(st2); }
  }
  void sd;
  return {eyes, mouth, brows};
};
