import React, {useEffect, useMemo, useState} from 'react';
import * as THREE from 'three';
import {GLTFLoader, GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone as skClone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {staticFile, delayRender, continueRender, cancelRender} from 'remotion';
import type {PersonState} from '../life/world';
import {RB} from './rbManifest';
import {buildToon, isFemale, ToonRig} from './Toon';
import {blink} from './poses';
import {hash, hashStr, clamp, smooth} from '../lib/math';

/**
 * Microsoft Rocketbox avatars (MIT) + their own mocap clips, driven deterministically by the life sim.
 * Every clip is split into a lower-body and an upper-body half so legs can walk while the arms do something else.
 * Per frame: set each action's time + weight from the sim state, mixer.update(0), then small procedural overrides.
 */
type Manifest = {avatars: Record<string, {gender: string; height: number; mats: Record<string, string>; tex: string[]}>; clips: Record<'m' | 'f', Record<string, {dur: number; stride: number; hipY: number}>>};
const RBM = RB as unknown as Manifest;
export type AvatarId = string;
type G = 'm' | 'f';
const UPPER = /^Bip01_(Spine1|Spine2|Neck|Head|[LR]_(Clavicle|UpperArm|Forearm|Hand|Finger))/;

export const CASTING: Record<string, AvatarId> = {
  mali: 'Business_Female_01', ton: 'Delivery_Male_01', pim: 'Business_Female_02', beam: 'Male_Adult_08', nok: 'Business_Female_03', arm: 'Business_Male_01', jay: 'Business_Male_02',
  fon: 'Business_Female_04', gun: 'Female_Adult_15', mook: 'Business_Male_03', oat: 'Business_Male_04', lek: 'Gardener_Male_01', dao: 'Female_Adult_02',
};

export type Style = 'tex' | 'toon';
type Lib = {style: Style; skel: Record<G, GLTF>; gltf: Record<string, GLTF>; clips: Record<G, Record<string, {lo: THREE.AnimationClip; up: THREE.AnimationClip; dur: number; stride: number}>>; tex: Record<string, THREE.Texture>};
const cache = new Map<string, Promise<Lib>>();
const loadLib = (uniq: string[], style: Style): Promise<Lib> => {
  const k = style + ':' + uniq.join(','); if (cache.has(k)) return cache.get(k)!;
  const gl = new GLTFLoader(), tl = new THREE.TextureLoader();
  const p = (async () => {
    const [avs, am, af] = await Promise.all([Promise.all((style === 'toon' ? [] : uniq).map((a) => gl.loadAsync(staticFile(`rb/av/${a}.glb`)))), gl.loadAsync(staticFile('rb/anims_m.glb')), gl.loadAsync(staticFile('rb/anims_f.glb'))]);
    const texUrls = (style === 'toon' ? [] : uniq).flatMap((a) => (RBM.avatars[a].tex).map((f) => staticFile(`rb/av/${a}/${f}`)));
    const tx = await Promise.all(texUrls.map((u) => tl.loadAsync(u)));
    const gltf: Lib['gltf'] = {}; avs.forEach((g, i) => { gltf[uniq[i]] = g; });
    const tex: Lib['tex'] = {}; texUrls.forEach((u, i) => { const t = tx[i]; t.colorSpace = THREE.SRGBColorSpace; t.flipY = true; t.anisotropy = 4; t.needsUpdate = true; tex[u] = t; });
    const clips = {m: {}, f: {}} as Lib['clips'];
    ([['m', am], ['f', af]] as [G, GLTF][]).forEach(([g, src]) => {
      for (const c of src.animations) {
        const meta = RBM.clips[g][c.name]; if (!meta) continue;
        const bone = (t: THREE.KeyframeTrack) => t.name.slice(0, t.name.lastIndexOf('.'));
        clips[g][c.name] = {lo: new THREE.AnimationClip(c.name + '_lo', c.duration, c.tracks.filter((t) => !UPPER.test(bone(t)))), up: new THREE.AnimationClip(c.name + '_up', c.duration, c.tracks.filter((t) => UPPER.test(bone(t)))), dur: c.duration, stride: meta.stride};
      }
    });
    return {style, skel: {m: am, f: af}, gltf, clips, tex};
  })();
  cache.set(k, p); return p;
};

/** Loads the avatars + clips once (outside the 3D canvas) and holds the render until they are ready. */
export const useRb = (avatars: AvatarId[], style: Style = 'tex'): Lib | null => {
  const uniq = Array.from(new Set(avatars)).sort();
  const [lib, setLib] = useState<Lib | null>(null);
  const [h] = useState(() => delayRender('rocketbox ' + uniq.length, {timeoutInMilliseconds: 240000}));
  useEffect(() => { let ok = true; loadLib(uniq, style).then((l) => { if (ok) { setLib(l); continueRender(h); } }).catch((e) => cancelRender(e)); return () => { ok = false; }; }, [style + uniq.join(',')]);
  return lib;
};

const mat = (c: string, r = 0.55) => new THREE.MeshStandardMaterial({color: c, roughness: r});
const mkProp = (kind: string) => {
  const g = new THREE.Group();
  if (kind === 'phone') { g.add(new THREE.Mesh(new THREE.BoxGeometry(7.4, 15, 1), mat('#1C1F27', 0.3))); const s = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 13.6), new THREE.MeshBasicMaterial({color: '#A9CDF5'})); s.position.z = 0.55; g.add(s); }
  if (kind === 'mug') { g.add(new THREE.Mesh(new THREE.CylinderGeometry(4.2, 3.8, 10, 18), mat('#F3F0E8'))); const h = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.7, 6, 12), mat('#F3F0E8')); h.position.x = 4.6; g.add(h); }
  if (kind === 'papers') g.add(new THREE.Mesh(new THREE.BoxGeometry(22, 30, 0.8), mat('#F7F5EF', 0.9)));
  if (kind === 'box') g.add(new THREE.Mesh(new THREE.BoxGeometry(44, 30, 32), mat('#B98A55', 0.95)));
  g.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; }); g.visible = false; return g;
};

type Inst = {strides: Record<string, number>; footY0: number; rest: [THREE.Object3D, THREE.Vector3, THREE.Quaternion][]; toon?: ToonRig; root: THREE.Object3D; mixer: THREE.AnimationMixer; g: G; lo: Record<string, THREE.AnimationAction>; up: Record<string, THREE.AnimationAction>; dur: Record<string, number>; stride: number; bones: Record<string, THREE.Bone>; scale: number; props: Record<string, THREE.Object3D>};

export const useCast = (ids: string[], lib: Lib | null) => useMemo(() => {
  const out: Record<string, Inst> = {}; if (!lib) return out;
  ids.forEach((id) => {
    let root: THREE.Object3D, g: G, toon: ToonRig | undefined;
    if (lib.style === 'toon') { g = isFemale(id) ? 'f' : 'm'; root = lib.skel[g].scene.clone(true); toon = buildToon(root, id); }
    else {
      const av = CASTING[id], meta = RBM.avatars[av]; g = meta.gender as G;
      root = skClone(lib.gltf[av].scene);
      root.traverse((o) => {
        const m = o as THREE.SkinnedMesh; if (!m.isMesh) return; m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
        const mats = ([] as THREE.Material[]).concat(m.material).map((src) => {
          const kind = meta.mats[src.name] ?? 'body';
          const mm = new THREE.MeshStandardMaterial({name: src.name, roughness: 0.78, metalness: 0, map: lib.tex[staticFile(`rb/av/${av}/${kind === 'opacity' ? 'opacity.png' : kind + '.jpg'}`)]});
          if (kind === 'opacity') { mm.alphaTest = 0.45; mm.side = THREE.DoubleSide; mm.transparent = false; }
            return mm;
        });
        m.material = mats.length === 1 ? mats[0] : mats;
      });
    }
    const mixer = new THREE.AnimationMixer(root); const lo: Inst['lo'] = {}, up: Inst['up'] = {}, dur: Inst['dur'] = {};
    for (const [name, c] of Object.entries(lib.clips[g])) { lo[name] = mixer.clipAction(c.lo); up[name] = mixer.clipAction(c.up); [lo[name], up[name]].forEach((a) => { a.play(); a.setEffectiveWeight(0); }); dur[name] = c.dur; }
    const bones: Inst['bones'] = {}; root.traverse((o) => { if ((o as THREE.Bone).isBone || o.name.startsWith('Bip01')) bones[o.name] = o as THREE.Bone; });
    // the last pose the mixer wrote, per bone: restored before each frame so procedural rotations never pile up
    // (three's PropertyMixer skips writing a bone whose clip value did not change, so overrides would otherwise accumulate → spinning arms)
    const rest: Inst['rest'] = Object.values(bones).map((b) => [b, b.position.clone(), b.quaternion.clone()]);
    root.updateMatrixWorld(true); const footY0 = root.worldToLocal(bones.Bip01_L_Foot.getWorldPosition(new THREE.Vector3())).y;
    const props: Inst['props'] = {};
    const attach = (k: string, bone: string, p: [number, number, number], r: [number, number, number]) => { const o = mkProp(k); o.position.set(...p); o.rotation.set(...r); bones[bone].add(o); props[k] = o; };
    attach('phone', 'Bip01_R_Hand', [8.5, 2.2, 1.5], [0, -Math.PI / 2, -Math.PI / 2]);
    attach('mug', 'Bip01_R_Hand', [8, 3.5, 1], [Math.PI / 2, 0, 0]);
    attach('papers', 'Bip01_L_Hand', [10, 2, 6], [Math.PI / 2, 0, 0]);
    const box = mkProp('box'); box.position.set(0, 112, 30); root.add(box); props.box = box;
    out[id] = {strides: Object.fromEntries(Object.entries(lib.clips[g]).map(([n, c]) => [n, c.stride])), footY0, rest, toon, root, mixer, g, lo, up, dur, stride: lib.clips[g].walk_neutral_01.stride, bones, scale: 0.01 * (1 + (hash(hashStr(id)) - 0.5) * 0.05), props};
  });
  return out;
}, [ids.join(','), lib]);

// ---- which clip plays for each sim pose ----
const STAND: Record<string, string> = {
  stand: 'idle_neutral_01', watch: 'idle_look_around_01', think: 'gestic_thoughtful_01', standPhone: 'cell_phone_textmessage', phoneCheck: 'cell_phone_textmessage',
  standDrink: 'drink_drinking', brew: 'drink_drinking', read: 'documents_check', sign: 'documents_note', handOver: 'gestic_presentation_right_01', point: 'gestic_presentation_right_01',
  wave: 'wave_01', laugh: 'gestic_laugh_loud', bin: 'idle_dust_01', push: 'trolley_idle', carry: 'idle_neutral_01',
  crouch: 'crouch_idle', crouchTalk: 'crouch_gestic', nervous: 'idle_nervous_01', lookAround: 'idle_look_around_02', listenDoor: 'listen_door', tryDoor: 'try_door_inwards',
  pushDesk: 'trolley_idle', press: 'gestic_presentation_right_01',
};
const SIT: Record<string, string> = {sitType: 'sit_table_idle_neutral_01', sitIdle: 'sit_chair_idle_neutral_01', sitTalk: 'sit_chair_gestic_thoughtful', sitStretch: 'sit_chair_idle_relaxed_01', sitGroove: 'sit_chair_idle_relaxed_01', sitPhone: 'sit_chair_idle_neutral_01', sitDrink: 'sit_chair_idle_neutral_01',
  sitLook: 'sit_table_idle_look_around', sitNervous: 'sit_table_idle_nervous_01', sitWrite: 'sit_table_idle_neutral_02', sitFace: 'sit_table_idle_touch_face'};
const HOLD: Record<string, string> = {standPhone: 'phone', phoneCheck: 'phone', sitPhone: 'phone', standDrink: 'mug', brew: 'mug', sitDrink: 'mug', read: 'papers', sign: 'papers'};

const q = new THREE.Quaternion(), pw = new THREE.Quaternion(), ax = new THREE.Vector3();
const rot = (b: THREE.Object3D | undefined, x: number, y: number, z: number, ang: number, root: THREE.Object3D) => {
  if (!b || Math.abs(ang) < 1e-5) return;
  ax.set(x, y, z).normalize().applyQuaternion(root.getWorldQuaternion(q)); b.parent!.getWorldQuaternion(pw);
  b.quaternion.premultiply(pw.clone().invert().multiply(new THREE.Quaternion().setFromAxisAngle(ax, ang)).multiply(pw)); b.updateMatrixWorld(true);
};


/** Bend both legs (thigh forward by `th`, shin back to `sh` from vertical), lean the back by `lean`, then drop the hips so the lowest foot rests on the floor. Root-space axes: +x lateral, +z forward. */
const tmpV = new THREE.Vector3();
const crouchBody = (I: Inst, th: number, sh: number, lean: number, arms: boolean) => {
  const r = I.root, B = I.bones;
  // bend at the hips: tilt the pelvis (Bip01_Spine — the thighs hang off it) and the back, keep the head looking ahead
  const tilt = lean * 0.65; rot(B.Bip01_Spine, 1, 0, 0, tilt, r); rot(B.Bip01_Spine1, 1, 0, 0, lean * 0.25, r); rot(B.Bip01_Spine2, 1, 0, 0, lean * 0.1, r);
  rot(B.Bip01_Neck, 1, 0, 0, -lean * 0.5, r); rot(B.Bip01_Head, 1, 0, 0, -lean * 0.45, r);
  // thighs forward by `th` from vertical (undoing the pelvis tilt they inherit), shins back to `sh`, feet flat
  for (const sd of ['L', 'R']) { rot(B[`Bip01_${sd}_Thigh`], 1, 0, 0, -th - tilt, r); rot(B[`Bip01_${sd}_Calf`], 1, 0, 0, th + sh, r); rot(B[`Bip01_${sd}_Foot`], 1, 0, 0, -sh * 0.9, r); }
  if (arms) for (const sd of ['L', 'R']) { rot(B[`Bip01_${sd}_UpperArm`], 1, 0, 0, -0.35, r); rot(B[`Bip01_${sd}_Forearm`], 1, 0, 0, -0.75, r); }
  r.updateMatrixWorld(true);
  const footY = (sd: string) => r.worldToLocal(B[`Bip01_${sd}_Foot`].getWorldPosition(tmpV)).y;
  const drop = Math.min(footY('L'), footY('R')) - I.footY0;
  const pel = B.Bip01; const w = r.worldToLocal(pel.getWorldPosition(tmpV)); w.y -= drop;
  pel.position.copy(pel.parent!.worldToLocal(r.localToWorld(w))); r.updateMatrixWorld(true);
};

export const drive = (I: Inst, s: PersonState, t: number) => {
  const sd = hash(hashStr(s.id) * 0.37), P = s.poseId;
  const wLo: Record<string, number> = {}, wUp: Record<string, number> = {};
  // a clip one gender lacks (e.g. female sit_*_nervous) falls back to the nearest neutral clip instead of the bind pose
  const add = (w: Record<string, number>, c: string, k: number) => { if (k <= 0) return; let cc = I.lo[c] ? c : c.startsWith('sit_table') ? 'sit_table_idle_neutral_01' : c.startsWith('sit') ? 'sit_chair_idle_neutral_01' : c.startsWith('crouch') ? 'crouch_idle' : 'idle_neutral_01'; if (!I.lo[cc]) cc = c.startsWith('sit') ? 'sit_chair_idle_neutral_01' : 'idle_neutral_01'; if (I.lo[cc]) w[cc] = (w[cc] ?? 0) + k; };
  for (const [b, p, qq] of I.rest) { b.position.copy(p); b.quaternion.copy(qq); }
  const seated = !s.moving && P.startsWith('sit');
  let base = seated ? SIT[P] ?? 'sit_chair_idle_neutral_01' : STAND[P] ?? 'idle_neutral_01';
  const crouched = !s.moving && P.startsWith('crouch');
  if (crouched) base = P === 'crouchTalk' || s.talkK > 0.15 ? 'crouch_gestic' : 'crouch_idle';
  else if (!seated && (P === 'chat' || s.talkK > 0)) base = 'gestic_listen_neutral_01';
  // opt-in (v2026-11-03): s.loco = 'run' runs on run_neutral_01 when installed; s.clip plays any installed clip as the base pose
  // opt-in (v2026-11-11, lifekit): s.locoClip = any installed walk_*/run_* clip, stepped by the odometer with that clip's own stride (no foot sliding)
  const locoOv = (s as any).locoClip as string | undefined;
  const loco = locoOv && I.lo[locoOv] ? locoOv : (s as any).loco === 'run' && I.lo.run_neutral_01 ? 'run_neutral_01' : 'walk_neutral_01';
  const clipOv = (s as any).clip as string | undefined;
  if (!s.moving && clipOv && I.lo[clipOv]) base = clipOv;
  if (s.moving) { add(wLo, loco, 1); add(wUp, loco, 1); }
  else {
    add(wLo, base, 1);
    if (crouched || clipOv) add(wUp, base, 1);
    else if (!seated && (P === 'chat' || P === 'stand') && s.talkK > 0) { add(wUp, 'gestic_talk_neutral_01', s.talkK); add(wUp, base, 1 - s.talkK); }
    else if (seated && s.talkK > 0) { add(wUp, 'sit_chair_gestic_thoughtful', s.talkK); add(wUp, base, 1 - s.talkK); }
    else add(wUp, base, 1);
  }
  // walking while doing something with the arms (phone, carrying, pushing the cart)
  // opt-in (v2026-11-11, lifekit): crossfade. s.clipB + s.mix (0…1) blends from clipB into the base clip — the caller derives mix from t
  // (smoothstep over 6–10 frames after the switch), so it is frame-order independent. clipB may be a walk/run clip (stop → idle).
  const clipB = (s as any).clipB as string | undefined, mixK = (s as any).mix as number | undefined;
  if (!s.moving && clipB && I.lo[clipB] && mixK !== undefined && mixK < 1) for (const w of [wLo, wUp]) { for (const k in w) w[k] *= Math.max(0, mixK); w[clipB] = (w[clipB] ?? 0) + 1 - Math.max(0, mixK); }
  const upPose = s.moving ? (s.upper ?? (s.front === 'box' ? 'carry' : s.held === 'phone' ? 'standPhone' : P === 'push' ? 'push' : '')) : '';
  if (upPose && STAND[upPose]) { for (const k in wUp) delete wUp[k]; add(wUp, STAND[upPose], 1); }
  for (const name in I.lo) {
    const d = I.dur[name];
    // opt-in (v2026-11-11, lifekit): s.clipT / s.clipBT = seconds into the clip (one-shot gestures start on the word; held on the last frame, not looped)
    const oneShot = name === clipOv ? (s as any).clipT : name === clipB ? (s as any).clipBT : undefined;
    const tt = name === 'walk_neutral_01' || name === 'run_neutral_01' || name === locoOv ? (s.odo / (name === 'walk_neutral_01' ? I.stride : I.strides[name] || I.stride)) * d : t + sd * d;
    const time = oneShot !== undefined ? Math.min(Math.max(0, oneShot), d - 1 / 30) : ((tt % d) + d) % d;
    I.lo[name].time = time; I.lo[name].setEffectiveWeight(wLo[name] ?? 0);
    I.up[name].time = time; I.up[name].setEffectiveWeight(wUp[name] ?? 0);
  }
  I.mixer.update(0);
  for (const [b, p, qq] of I.rest) { p.copy(b.position); qq.copy(b.quaternion); }
  const r = I.root; r.updateMatrixWorld(true); const B = I.bones;
  if (P === 'sitType' && seated) { // keyboard: small alternating finger/wrist taps over the table pose
    rot(B.Bip01_L_Hand, 1, 0, 0, Math.max(0, Math.sin(t * 19 + sd * 9)) * 0.18, r); rot(B.Bip01_R_Hand, 1, 0, 0, Math.max(0, Math.sin(t * 17 + sd * 4)) * 0.18, r);
    rot(B.Bip01_Head, 1, 0, 0, 0.1, r);
  }
  // crouch-walk: the walk clip's stride on deeply bent knees, hips dropped so the lower foot stays on the floor, back bent, head up
  if (s.moving && s.upper === 'hunch') crouchBody(I, 0.55, 0.42, 0.95, true);
  // no crouch clip installed (older rb_setup): squat procedurally instead of standing up
  if (crouched && !I.lo.crouch_idle) crouchBody(I, 1.35, 0.6, 0.45, false);
  if (s.front === 'box') { for (const sd2 of ['L', 'R']) { rot(B[`Bip01_${sd2}_UpperArm`], 1, 0, 0, -0.5, r); rot(B[`Bip01_${sd2}_Forearm`], 1, 0, 0, -0.9, r); } }
  // seated with a phone: forearm raised so the phone sits in front of the chest, head tipped down to read it
  if (seated && HOLD[P] === 'phone') { rot(B.Bip01_R_UpperArm, 1, 0, 0, -0.5, r); rot(B.Bip01_R_UpperArm, 0, 0, 1, 0.4, r); rot(B.Bip01_R_Forearm, 1, 0, 0, -0.75, r); rot(B.Bip01_R_Forearm, 0, 1, 0, 0.7, r); rot(B.Bip01_R_Hand, 1, 0, 0, 1.3, r); rot(B.Bip01_Head, 1, 0, 0, 0.32, r); }
  // glances from the sim, layered on the clip's own head motion
  const hy = clamp(s.pose.hy, -1.1, 1.1); rot(B.Bip01_Neck, 0, 1, 0, hy * 0.4, r); rot(B.Bip01_Head, 0, 1, 0, hy * 0.45, r);
  // look pitch: sit/idle clips often hang the head (the table clips look down at a desk). When the scene gives a look target
  // (root-local cm, pose.lookL), tilt neck + head so the face actually points at it — up at a sign, level at a person.
  const lookL = (s.pose as any).lookL as THREE.Vector3 | undefined;
  if (lookL && I.toon) {
    const hf = I.toon.eyes[0].parent!; r.updateMatrixWorld(true);
    const mR = new THREE.Matrix4().copy(r.matrixWorld).invert().multiply(hf.matrixWorld);
    const hp = new THREE.Vector3().setFromMatrixPosition(mR), fwd = new THREE.Vector3(0, 0, 1).transformDirection(mR);
    const dir = lookL.clone().sub(hp).normalize();
    const d = clamp(Math.asin(clamp(dir.y, -1, 1)) - Math.asin(clamp(fwd.y, -1, 1)), -0.75, 0.75) * ((s.pose as any).lookK ?? 1);
    const axis = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0));
    if (axis.lengthSq() > 1e-6 && Math.abs(d) > 0.01) { axis.normalize(); rot(B.Bip01_Neck, axis.x, axis.y, axis.z, d * 0.4, r); rot(B.Bip01_Head, axis.x, axis.y, axis.z, d * 0.6, r); }
  }
  const hold = s.moving ? (upPose ? HOLD[upPose] : s.held === 'mug' || s.held === 'cup' ? 'mug' : '') : HOLD[P] ?? (s.held === 'phone' ? 'phone' : s.held === 'mug' || s.held === 'cup' ? 'mug' : '');
  if (I.toon) { const bk = blink(t, sd * 50); I.toon.eyes.forEach((e) => { e.scale.y = 1 - bk * 0.9; }); const mo = s.talkK > 0.3 ? Math.max(0, Math.sin(t * 12 + sd * 7) * 0.6 + Math.sin(t * 7.1) * 0.4) * s.talkK : 0; I.toon.mouth.scale.set(1 - mo * 0.25, 1 + mo * 2.6, 1); const fr = s.fear ?? 0; I.toon.brows.forEach((b, i) => { b.position.y = (b.userData.y0 ??= b.position.y) + mo * 0.35 + fr * 0.55; b.rotation.z = (b.userData.rz0 ??= b.rotation.z) + (i === 0 ? -1 : 1) * fr * 0.38; }); I.toon.eyes.forEach((e) => { e.scale.x = 1 + fr * 0.12; e.scale.y *= 1 + fr * 0.18; }); }
  for (const k in I.props) I.props[k].visible = k === hold || (k === 'box' && s.front === 'box');
  if (!s.moving && seated) return 0;
  return 0;
};

export const RbPerson: React.FC<{I: Inst; s: PersonState; t: number}> = ({I, s, t}) => {
  drive(I, s, t);
  return <group position={[s.x, 0, s.z]} rotation={[0, s.yaw, 0]} scale={I.scale}><primitive object={I.root} /></group>;
};
