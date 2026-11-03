// Convert Microsoft Rocketbox (MIT) FBX avatars + animations into small web assets.
// usage: node tools/rb_convert.mjs <rocketbox repo dir> <out dir>
//   out/av/<Name>.glb + out/av/<Name>/{body,head,opacity}.(jpg|png) + out/anims_m.glb, anims_f.glb + out/manifest.json
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import * as THREE from 'three';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';

globalThis.FileReader = class { readAsArrayBuffer(b) { b.arrayBuffer().then((r) => { this.result = r; this.onloadend?.(); this.onload?.({target: this}); }); } readAsDataURL(b) { b.arrayBuffer().then((r) => { this.result = 'data:application/octet-stream;base64,' + Buffer.from(r).toString('base64'); this.onloadend?.(); }); } };
THREE.TextureLoader.prototype.load = function () { return new THREE.Texture(); };
const warn = console.warn; console.warn = (...a) => { if (!/TGA loader|not supported|FBXLoader/.test(String(a[0]))) warn(...a); }; console.log = ((log) => (...a) => { if (typeof a[0] === 'string') log(...a); })(console.log);

const [repo, out] = process.argv.slice(2);
const A = path.join(repo, 'Assets');
const L = new FBXLoader();
const load = (p) => { const b = fs.readFileSync(p); return L.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), path.dirname(p) + '/'); };
const exportGlb = (obj, animations) => new Promise((res, rej) => new GLTFExporter().parse(obj, (r) => res(Buffer.from(r)), rej, {binary: true, animations, onlyVisible: false}));
fs.mkdirSync(path.join(out, 'av'), {recursive: true});

// ---------- animations ----------
const S = path.join(A, 'Animations/all_animations_max_motextr_static'), X = path.join(A, 'Animations/all_animations_max_motextr_xy');
const MAXLEN = 16;
const manifest = {avatars: {}, clips: {m: {}, f: {}}};
for (const g of ['m', 'f']) {
  const files = [...fs.readdirSync(S).filter((f) => f.startsWith(g + '_')).map((f) => path.join(S, f)), ...fs.readdirSync(X).filter((f) => f.startsWith(g + '_')).map((f) => path.join(X, f))];
  let skel = null; const clips = [];
  for (const f of files) {
    const o = load(f); const c = o.animations[0]; if (!c) continue;
    if (!skel) { skel = o; const rm = []; skel.traverse((n) => { if (n.isMesh) rm.push(n); }); rm.forEach((n) => n.parent.remove(n)); }
    const name = path.basename(f).replace(/^[mf]_/, '').replace('.max.fbx', '').replace(/ /g, '_').replace(/_01$/, (s) => (/hold_bag_idle/.test(f) ? '' : s));
    let stride = 0; const dur = Math.min(c.duration, MAXLEN);
    const tracks = c.tracks.filter((t) => !t.name.endsWith('.scale') && (!t.name.endsWith('.position') || t.name === 'Bip01.position')).map((t) => {
      t = t.clone(); if (dur < c.duration) t.trim(0, dur);
      if (t.name === 'Bip01.position') { const v = t.values, x0 = v[0], z0 = v[2]; stride = Math.hypot(v[v.length - 3] - x0, v[v.length - 1] - z0) / 100; for (let i = 0; i < v.length; i += 3) { v[i] = x0; v[i + 2] = z0; } }
      return t;
    });
    clips.push(new THREE.AnimationClip(name, dur, tracks));
    manifest.clips[g][name] = {dur: +dur.toFixed(3), stride: +stride.toFixed(3), hipY: +(c.tracks.find((t) => t.name === 'Bip01.position').values[1] / 100).toFixed(3)};
  }
  fs.writeFileSync(path.join(out, `anims_${g}.glb`), await exportGlb(skel, clips));
  console.log('anims', g, clips.length, (fs.statSync(path.join(out, `anims_${g}.glb`)).size / 1e6).toFixed(1) + 'MB');
}

// ---------- avatars ----------
for (const cat of ['Professions', 'Adults']) {
  const dir = path.join(A, 'Avatars', cat); if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    const fbx = path.join(dir, name, 'Export', name + '.fbx'); if (!fs.existsSync(fbx)) continue;
    const tex = path.join(dir, name, 'Textures'); if (!fs.existsSync(tex) || !fs.readdirSync(tex).some((f) => f.endsWith('_color.tga'))) continue;
    const o = load(fbx); const mats = {};
    o.traverse((n) => { if (!n.isMesh) return; [].concat(n.material).forEach((m) => { const kind = /opacity/.test(m.name) ? 'opacity' : /head/.test(m.name) ? 'head' : 'body'; mats[m.name] = kind; for (const k of ['map', 'normalMap', 'specularMap', 'alphaMap', 'bumpMap', 'emissiveMap']) m[k] = null; }); });
    const box = new THREE.Box3().setFromObject(o);
    fs.writeFileSync(path.join(out, 'av', name + '.glb'), await exportGlb(o, []));
    const td = path.join(out, 'av', name); fs.mkdirSync(td, {recursive: true});
    for (const f of fs.readdirSync(tex).filter((f) => f.endsWith('_color.tga'))) {
      const kind = /opacity/.test(f) ? 'opacity' : /head/.test(f) ? 'head' : 'body';
      execFileSync('python3', ['-c', `from PIL import Image; im=Image.open(${JSON.stringify(path.join(tex, f))}); im=im.resize((1024,1024), Image.LANCZOS)
if ${JSON.stringify(kind)}=='opacity': im.convert('RGBA').save(${JSON.stringify(path.join(td, 'opacity.png'))}, optimize=True)
else: im.convert('RGB').save(${JSON.stringify(path.join(td, kind + '.jpg'))}, quality=86)`]);
    }
    manifest.avatars[name] = {gender: /Female/.test(name) ? 'f' : 'm', height: +(box.max.y / 100).toFixed(3), mats};
    console.log('avatar', name, manifest.avatars[name].height, Object.keys(mats).join(','), (fs.statSync(path.join(out, 'av', name + '.glb')).size / 1e6).toFixed(1) + 'MB');
  }
}
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 1));
