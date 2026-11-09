import * as THREE from 'three';
import {F} from '../../pov/lib/tex';

/**
 * "Box people" in the reference style (@outofthisworld_9): every body part is a flat-shaded cuboid on its Biped bone,
 * the head is a tall thin box with a hand-drawn face (ink outline, heavy-lidded eyes, stubble hatching, scribbled hair)
 * painted onto a paper-textured canvas, clothes carry painterly brush strokes. Built on the kit's mocap skeleton, so the
 * Rocketbox clips, the run / clip overrides and the IK gestures all still drive it.
 *
 * applyBoxLook(I, id) hides the kit's round toon meshes (props stay) and adds the boxes; setFace(I, mode) swaps the face.
 * Bone frames: limb bones run along local +x to the child bone; spine/neck/head use the kit's body frame (x left, y up, z fwd).
 */
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ---------------------------------------------------------------- painted textures
const texCache = new Map<string, THREE.CanvasTexture>();
const ctex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  if (texCache.has(key)) return texCache.get(key)!;
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; texCache.set(key, t); return t;
};
const shade = (hex: string, k: number) => { const c = new THREE.Color(hex); const h = {h: 0, s: 0, l: 0}; c.getHSL(h); c.setHSL(h.h, h.s, Math.min(1, Math.max(0, h.l + k))); return '#' + c.getHexString(); };
/** paper grain + soft brush strokes over a flat colour */
export const paint = (g: CanvasRenderingContext2D, w: number, h: number, base: string, seed: number, strokes = 60, amt = 0.07) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < strokes; i++) {
    const x = hash(seed + i * 1.3) * w, y = hash(seed + i * 2.7) * h, len = (0.15 + hash(seed + i * 3.1) * 0.5) * w, a = -0.6 + hash(seed + i) * 0.35;
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = hash(seed + i * 5.3) > 0.5 ? shade(base, amt) : shade(base, -amt); g.globalAlpha = 0.35 + hash(i + seed) * 0.35;
    g.beginPath(); g.ellipse(0, 0, len / 2, 2 + hash(seed + i * 7) * 5, 0, 0, Math.PI * 2); g.fill(); g.restore();
  }
  g.globalAlpha = 1;
  for (let i = 0; i < w * h / 40; i++) { g.fillStyle = hash(i * 0.37 + seed) > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'; g.fillRect(hash(i * 1.71 + seed) * w, hash(i * 2.93 + seed) * h, 1.5, 1.5); }
};
const matCache = new Map<string, THREE.Material>();
/** flat painted material (Lambert: no shine, like the reference) */
export const PM = (base: string, key = '', amt?: number) => {
  const k = base + key; if (matCache.has(k)) return matCache.get(k)!;
  const seed = parseInt(base.slice(1), 16) % 997;
  const l = new THREE.Color(base).getHSL({h: 0, s: 0, l: 0}).l;
  const m = new THREE.MeshLambertMaterial({map: ctex('pm' + k, 128, 128, (g) => paint(g, 128, 128, base, seed, 26, amt ?? (l < 0.2 ? 0.035 : 0.06)))});
  matCache.set(k, m); return m;
};

// ---------------------------------------------------------------- faces
export type FaceMode = 'open' | 'blink' | 'talk' | 'wide' | 'closed' | 'half' | 'angry' | 'shout';   // angry/shout: ink style only (EP9 judge)
/** 'bean' = EP1–3 glossy bean eyes; 'ink' = ref8 hand-drawn ink face (edge lines, hatched hair, stubble dots, hatched blush). Set per episode before the cast is built. */
export let FACE_STYLE: 'bean' | 'ink' = 'bean';
export const setFaceStyle = (s: 'bean' | 'ink') => { FACE_STYLE = s; };
export type FaceSpec = {skin: string; hair: string; hairStyle: 'messy' | 'short' | 'slick' | 'none'; stubble: number; mustache?: boolean; glasses?: boolean; mask?: string; brows?: number};
const ink = '#14110F';
const inkFace = (g: CanvasRenderingContext2D, id: string, f: FaceSpec, mode: FaceMode) => {
  const W = 512, H = 256, cx = W / 2, sd = id.length * 13.7; const r = (i: number) => hash(sd + i);
  paint(g, W, H, f.skin, sd, 24, 0.03);
  if (f.mask) { paint(g, W, H, f.mask, sd + 3, 30, 0.03); g.fillStyle = f.skin; g.beginPath(); g.roundRect(cx - 62, 92, 124, 46, 20); g.fill(); }
  g.strokeStyle = ink; g.fillStyle = ink; g.lineCap = 'round'; g.lineJoin = 'round';
  // no lines on the head's edges or rims: on an 8-sided head they cut straight across the face (EP4 feedback)
  const wob = (x0: number, y0: number, x1: number, y1: number, w: number, k: number) => { g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); const n = 6; for (let i = 1; i <= n; i++) { const u = i / n; g.lineTo(x0 + (x1 - x0) * u + (r(k + i) - 0.5) * 2.4, y0 + (y1 - y0) * u + (r(k + i * 2) - 0.5) * 2.4); } g.stroke(); };
  // stubble dots on the jaw + hatched blush
  if ((f.stubble ?? 0) > 0 && !f.mask) for (let i = 0; i < 160 * f.stubble; i++) { const a = r(i * 3) * Math.PI, rr = 70 + r(i * 5) * 26; g.globalAlpha = 0.55; g.fillRect(cx + Math.cos(a) * rr * 1.1 - 1, 150 + Math.sin(a) * rr * 0.75 - 1, 2.2, 2.2); }
  g.globalAlpha = 0.5; if (!f.mask) for (const dx of [-60, 60]) for (let i = 0; i < 5; i++) wob(cx + dx - 14 + i * 6, 158, cx + dx - 6 + i * 6, 146, 2, 200 + i + dx);
  g.globalAlpha = 1;
  // eyes: ink dots under heavy lids (deadpan); blink/closed = a line; wide = rings
  const ey = 114, ex = [cx - 34, cx + 34];
  ex.forEach((x, i) => {
    if (mode === 'blink' || mode === 'closed') { wob(x - 12, ey + 2, x + 12, ey + 2, 4, 300 + i); return; }
    if (mode === 'wide') { g.lineWidth = 3.5; g.beginPath(); g.arc(x, ey, 13, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(x, ey, 4.5, 0, Math.PI * 2); g.fill(); return; }
    if (mode === 'angry' || mode === 'shout') { const s2 = i ? -1 : 1; g.beginPath(); g.ellipse(x, ey + 3, 5.5, 5, 0, 0, Math.PI * 2); g.fill(); wob(x - 13 * s2, ey - 7, x + 13 * s2, ey, 4.5, 310 + i); return; }   // glare: lid slants down to the nose
    g.beginPath(); g.ellipse(x, ey + 2, 5.5, 6.5, 0, 0, Math.PI * 2); g.fill();
    wob(x - 13, ey - (mode === 'half' ? 1 : 5), x + 13, ey - (mode === 'half' ? 1 : 5), 4, 310 + i);   // the lid line
  });
  // brows: hatched strokes
  const mad = mode === 'angry' || mode === 'shout'; const by = mode === 'wide' ? 82 : mad ? 92 : 90, tilt = f.brows ?? 0;
  ex.forEach((x, i) => { const s2 = i ? -1 : 1; g.save(); g.translate(x, by); g.rotate(mad ? 0.5 * s2 : tilt * 0.35 * s2); for (let k = 0; k < 4; k++) wob(-14 + k * 3, 2 + k * 0.5, 12 + k * 1.5, -2 + k * 0.5, 2.6, 400 + k + i * 9); g.restore(); });
  // nose: an ink hook
  if (!f.mask) { g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 2, 124); g.quadraticCurveTo(cx + 9, 142, cx - 5, 146); g.stroke(); }
  // mouth
  if (mode === 'talk') { g.fillStyle = '#3A1A1A'; g.beginPath(); g.ellipse(cx, 178, 12, 8, 0, 0, Math.PI * 2); g.fill(); g.lineWidth = 3; g.stroke(); }
  else if (mode === 'wide') { g.lineWidth = 3; g.beginPath(); g.ellipse(cx, 180, 8, 11, 0, 0, Math.PI * 2); g.stroke(); }
  else if (mode === 'shout') { g.fillStyle = '#3A1A1A'; g.beginPath(); g.ellipse(cx, 182, 17, 12, 0, 0, Math.PI * 2); g.fill(); g.lineWidth = 3; g.stroke(); g.fillStyle = '#F4F1EA'; g.fillRect(cx - 11, 172, 22, 5); }
  else if (mode === 'angry') { g.lineWidth = 3.5; g.beginPath(); g.arc(cx, 186, 16, 1.2 * Math.PI, 1.8 * Math.PI); g.stroke(); }
  else wob(cx - 15, 172, cx + 15, 172, 3.5, 500);
  if (f.mustache) { g.fillStyle = f.hair; g.beginPath(); g.roundRect(cx - 26, 156, 52, 10, 5); g.fill(); }
  if (f.glasses) { g.strokeStyle = '#2B2B33'; g.lineWidth = 4; ex.forEach((x) => { g.beginPath(); g.arc(x, ey, 22, 0, Math.PI * 2); g.stroke(); }); g.beginPath(); g.moveTo(cx - 12, ey); g.lineTo(cx + 12, ey); g.stroke(); }
};
const faceTex = (id: string, f: FaceSpec, mode: FaceMode) => FACE_STYLE === 'ink' ? ctex(`inkface:${id}:${mode}`, 512, 256, (g) => inkFace(g, id, f, mode)) : ctex(`face:${id}:${mode}`, 512, 256, (g) => {
  // wrap-around skin for an 8-sided head; the face sits in the middle of the canvas (u = 0.5 = front)
  const W = 512, H = 256, cx = W / 2, sd = id.length * 13.7;
  paint(g, W, H, f.skin, sd, 24, 0.025);
  if (f.mask) { paint(g, W, H, f.mask, sd + 3, 30, 0.03); g.fillStyle = f.skin; g.beginPath(); g.roundRect(cx - 62, 92, 124, 46, 20); g.fill(); }
  // rosy cheeks
  if (!f.mask) { g.fillStyle = 'rgba(232,120,110,0.35)'; for (const dx of [-58, 58]) { g.beginPath(); g.ellipse(cx + dx, 150, 17, 11, 0, 0, Math.PI * 2); g.fill(); } }
  // eyes: big glossy beans with a white highlight (no lids, no outline)
  const ey = 112, ex = [cx - 34, cx + 34];
  ex.forEach((x) => {
    g.fillStyle = '#1B1A22';
    if (mode === 'blink' || mode === 'closed') { g.lineWidth = 5; g.strokeStyle = '#1B1A22'; g.lineCap = 'round'; g.beginPath(); g.arc(x, ey - 2, 11, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); return; }
    const rx = mode === 'wide' ? 13 : 10, ry = mode === 'wide' ? 17 : 13;
    g.beginPath(); g.ellipse(x, ey, rx, ry, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(x + 4, ey - 5, mode === 'wide' ? 4.5 : 3.5, 0, Math.PI * 2); g.fill();
  });
  // brows: short rounded bars
  g.fillStyle = f.mask ? '#1B1A22' : f.hair; const by = mode === 'wide' ? 78 : 86, tilt = f.brows ?? 0;
  ex.forEach((x, i) => { const s2 = i ? -1 : 1; g.save(); g.translate(x, by); g.rotate(tilt * 0.35 * s2); g.beginPath(); g.roundRect(-14, -4, 28, 8, 4); g.fill(); g.restore(); });
  // nose: a soft round bump of darker skin
  if (!f.mask) { g.fillStyle = 'rgba(150,80,50,0.35)'; g.beginPath(); g.ellipse(cx, 140, 9, 7, 0, 0, Math.PI * 2); g.fill(); }
  // mouth
  g.fillStyle = '#5A2526'; g.strokeStyle = '#5A2526'; g.lineCap = 'round';
  if (mode === 'talk' || mode === 'wide') { g.beginPath(); g.ellipse(cx, 178, mode === 'wide' ? 9 : 13, mode === 'wide' ? 12 : 7, 0, 0, Math.PI * 2); g.fill(); }
  else if (!f.mask || true) { g.lineWidth = 5; g.beginPath(); g.arc(cx, 166, 14, 0.3 * Math.PI, 0.7 * Math.PI); g.stroke(); }
  if (f.mustache) { g.fillStyle = f.hair; g.beginPath(); g.roundRect(cx - 26, 156, 52, 10, 5); g.fill(); }
  if (f.glasses) { g.strokeStyle = '#2B2B33'; g.lineWidth = 4; ex.forEach((x) => { g.beginPath(); g.arc(x, ey, 22, 0, Math.PI * 2); g.stroke(); }); g.beginPath(); g.moveTo(cx - 12, ey); g.lineTo(cx + 12, ey); g.stroke(); }
});
const hairTop = (id: string, f: FaceSpec) => ctex(`hairtop:${id}:${FACE_STYLE}`, 128, 128, (g) => {
  if (f.mask) { paint(g, 128, 128, f.mask, 7, 30, 0.04); return; }
  paint(g, 128, 128, f.hairStyle === 'none' ? f.skin : f.hair, 9, 30, 0.08);
  if (FACE_STYLE === 'ink' && f.hairStyle !== 'none') { g.strokeStyle = 'rgba(0,0,0,0.75)'; g.lineWidth = 2; for (let i = 0; i < 70; i++) { const x = hash(i) * 128, y = hash(i * 3) * 128; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10, y + 6); g.stroke(); } }
  if (f.hairStyle === 'messy') { g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 3; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(hash(i) * 128, hash(i * 3) * 128, 4 + hash(i * 5) * 6, 0, Math.PI * 1.5); g.stroke(); } }
});

// ---------------------------------------------------------------- outfits
export type BoxLook = {face: FaceSpec; jacket: string; lapel?: string; shirt: string; tie?: string; pants: string; shoes: string; sleeves?: 'jacket' | 'shirt' | 'short';
  cap?: string; helmet?: string; vest?: string; robe?: boolean; pocket?: boolean; badge?: boolean; belt?: string; build?: number};
export const BOX: Record<string, BoxLook> = {};

type Inst = any;
const box = (w: number, h: number, d: number, m: THREE.Material | THREE.Material[]) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; return o; };
const BODY_Q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0)));
const frame = (bone: THREE.Object3D) => { const g = new THREE.Group(); g.quaternion.copy(BODY_Q); bone.add(g); return g; };
/** a limb box from the bone origin toward its child, w × d cross-section, slightly overlong so joints never open */
const limb = (bone: THREE.Object3D, child: THREE.Object3D, w: number, d: number, m: THREE.Material, ext0 = 2, ext1 = 2) => {
  const to = child.position.clone(); const len = to.length() + ext0 + ext1;
  const g = new THREE.Group(); g.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), to.clone().normalize()); bone.add(g);
  const o = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, d / 2, len, 6), m); o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; o.rotation.z = -Math.PI / 2; o.position.x = len / 2 - ext0; g.add(o); return g;
};

const faceMats = new WeakMap<Inst, {mat: THREE.MeshLambertMaterial; id: string; spec: FaceSpec; mode: FaceMode}>();
export const applyBoxLook = (I: Inst, id: string) => {
  if ((I as any).__box) return; (I as any).__box = true;
  const L = BOX[id]; if (!L) return;
  const keep = new Set<THREE.Object3D>(); Object.values(I.props as Record<string, THREE.Object3D>).forEach((p) => p.traverse((o) => keep.add(o)));
  I.root.traverse((o: any) => { if (o.isMesh && !keep.has(o)) o.visible = false; });
  const B = I.bones as Record<string, THREE.Object3D>, b = L.build ?? 1;
  const jacket = PM(L.jacket), pants = PM(L.pants), shoes = PM(L.shoes), skin = PM(L.face.skin, 'skin', 0.025), shirt = PM(L.shirt);
  // torso: pelvis block + abdomen + chest (jacket), shoulders square like the reference
  const hips = frame(B.Bip01_Spine); const hp = box(30 * b, 20, 19, pants); hp.position.set(0, 2, 0); hips.add(hp);
  const belly = frame(B.Bip01_Spine1); const bl = box(31 * b, 18, 19, jacket); bl.position.set(0, 7, 0); belly.add(bl);
  const chest = frame(B.Bip01_Spine2); const ch = box(38 * b, 24, 21, jacket); ch.position.set(0, 10, 0); chest.add(ch);
  // shirt V + tie + lapels on the chest front (flat decals just proud of the box)
  const front = 10.6;
  const shirtV = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-6, 22), new THREE.Vector2(6, 22), new THREE.Vector2(0, L.tie ? -12 : 4)])), PM(L.shirt, 'v'));
  shirtV.position.set(0, 0, front + 0.05); chest.add(shirtV);
  if (L.tie) { const tie = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-1.6, 21), new THREE.Vector2(1.6, 21), new THREE.Vector2(2.6, -6), new THREE.Vector2(0, -10), new THREE.Vector2(-2.6, -6)])), PM(L.tie)); tie.position.set(0, 0, front + 0.1); chest.add(tie);
    const tie2 = box(5, 14, 0.4, PM(L.tie)); tie2.position.set(0, 3, 9.8); belly.add(tie2); }
  if (L.lapel) for (const s of [-1, 1]) { const lp = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(s * 6, 22), new THREE.Vector2(s * 12, 22), new THREE.Vector2(s * 10, 8), new THREE.Vector2(s * 3, -6), new THREE.Vector2(s * 1.5, -6)])), PM(L.lapel)); lp.position.set(0, 0, front + 0.15); lp.material = PM(L.lapel); (lp.material as THREE.Material).side = THREE.DoubleSide; chest.add(lp); }
  if (L.pocket) { const pk = box(7, 7, 0.4, PM(L.shirt === L.jacket ? shadeHex(L.jacket, -0.06) : L.jacket, 'pk')); pk.position.set(8, 12, front + 0.2); chest.add(pk); }
  if (L.badge) { const bd = box(4, 5, 0.6, PM('#D8B24A', 'badge')); bd.position.set(9, 13, front + 0.3); chest.add(bd); }
  if (L.belt) { const bt = box(31.5 * b, 3, 20, PM(L.belt)); bt.position.set(0, 9, 0); hips.add(bt); }
  if (L.vest) { const v = box(40 * b, 30, 24, PM(L.vest)); v.position.set(0, 4, 0); chest.add(v); const v2 = box(33 * b, 14, 22, PM(L.vest)); v2.position.set(0, 9, 0); belly.add(v2); }
  if (L.robe) { const r = box(42 * b, 70, 26, jacket); r.position.set(0, -38, 0); belly.add(r); }
  // neck + head (tall thin box; face on the front)
  limb(B.Bip01_Neck, B.Bip01_Head, 8, 8, skin, 1, 8);
  const head = frame(B.Bip01_Head);
  const fm = new THREE.MeshLambertMaterial({map: faceTex(id, L.face, 'open')});
  const capTop = PM(L.face.mask ?? (L.face.hairStyle === 'none' ? L.face.skin : L.face.hair), 'crown');
  const hg = new THREE.CylinderGeometry(11.5, 12.5, 25, 8, 1, false, Math.PI, Math.PI * 2);
  const hd = new THREE.Mesh(hg, [fm, capTop, PM(L.face.skin, 'chin')]); hd.castShadow = true; hd.receiveShadow = true; hd.frustumCulled = false; hd.position.set(0, 13.5, 1.5); head.add(hd);
  if (!L.face.mask && L.face.hairStyle !== 'none') { // chunky 3D hair: a cap over the crown + a fringe block
    const hm = PM(L.face.hair, 'hair'); const crown = new THREE.Mesh(new THREE.CylinderGeometry(12.6, 12.8, 7, 8, 1, false, Math.PI, Math.PI * 2), hm); crown.position.set(0, 25, 1.2); crown.castShadow = true; head.add(crown);
    if (L.face.hairStyle !== 'slick') { const fr = box(18, 4, 5, hm); fr.position.set(L.face.hairStyle === 'messy' ? 2 : 0, 22.5, 10.5); fr.rotation.z = L.face.hairStyle === 'messy' ? -0.18 : 0; head.add(fr); }
    const back2 = box(22, 12, 6, hm); back2.position.set(0, 19, -8.5); head.add(back2);
  }
  for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(3, 6, 4), PM(L.face.skin, 'ear')); ear.scale.set(0.6, 1, 0.8); ear.position.set(s * 12.4, 13, 0); head.add(ear); }
  if (L.cap) { const c = box(25, 6, 25, PM(L.cap)); c.position.set(0, 28, 1.2); head.add(c); const brim = box(20, 1.2, 7, PM(L.cap)); brim.position.set(0, 25.6, 12.5); head.add(brim); const bdg = box(3, 3, 0.4, PM('#D8B24A', 'b2')); bdg.position.set(0, 28.5, 9.6); head.add(bdg); }
  if (L.helmet) { const hm = box(27, 11, 27, PM(L.helmet)); hm.position.set(0, 27, 1); head.add(hm); const gg = box(20, 5, 2, PM('#2C3A44', 'gog')); gg.position.set(0, 18.5, 12.2); head.add(gg); }
  faceMats.set(I, {mat: fm, id, spec: L.face, mode: 'open'});
  // arms (upper in jacket, forearm in jacket or shirt, hands skin)
  for (const s of ['L', 'R']) {
    const sl = L.sleeves === 'short' ? shirt : jacket;
    limb(B[`Bip01_${s}_Clavicle`], B[`Bip01_${s}_UpperArm`], 9, 9, jacket, 0, 3);
    limb(B[`Bip01_${s}_UpperArm`], B[`Bip01_${s}_Forearm`], 9 * b, 9 * b, sl, 3, 2);
    limb(B[`Bip01_${s}_Forearm`], B[`Bip01_${s}_Hand`], 7.5, 7.5, L.sleeves === 'short' ? skin : sl, 1, 0);
    const hg = new THREE.Group(); B[`Bip01_${s}_Hand`].add(hg); const hnd = box(13, 3.6, 8.5, skin); hnd.position.set(6.5, 0, 0); hg.add(hnd);
    const th = box(6, 3, 3, skin); th.position.set(3, 0, s === 'L' ? 5 : -5); hg.add(th);
    // legs
    limb(B[`Bip01_${s}_Thigh`], B[`Bip01_${s}_Calf`], 13 * b, 13 * b, pants, 4, 2);
    limb(B[`Bip01_${s}_Calf`], B[`Bip01_${s}_Foot`], 11, 11, pants, 2, 2);
    const toe = B[`Bip01_${s}_Toe0`];
    if (toe) { const sg = limb(B[`Bip01_${s}_Foot`], toe, 8, 10, shoes, 9, 10); sg.children[0].position.y -= 1.5; }
  }
};
const shadeHex = (hex: string, k: number) => shade(hex, k);

/** pick the face for this frame: closed (asleep) > wide (shock) > blink > talk > open */
export const setFace = (I: Inst, mode: FaceMode) => {
  const f = faceMats.get(I); if (!f || f.mode === mode) return;
  f.mat.map = faceTex(f.id, f.spec, mode); f.mat.needsUpdate = true; f.mode = mode;
};
export const blinkAt = (t: number, seed: number) => { const per = 2.6 + hash(seed) * 2.2; const k = (t + hash(seed + 3) * per) % per; return k < 0.1; };
export const autoFace = (I: Inst, t: number, o: {talk?: number; fear?: number; closed?: boolean; seed?: number}) => {
  if (o.closed) return setFace(I, 'closed');
  if ((o.fear ?? 0) > 0.5) return setFace(I, blinkAt(t, (o.seed ?? 1) + 9) ? 'blink' : 'wide');
  if ((o.talk ?? 0) > 0.3 && Math.sin(t * 13 + (o.seed ?? 0)) > -0.2) return setFace(I, 'talk');
  setFace(I, blinkAt(t, o.seed ?? 1) ? 'blink' : 'open');
};
export {F};
