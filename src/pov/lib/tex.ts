import * as THREE from 'three';
import {hash} from './math';

/** Canvas textures for the MRT sets. Everything seeded (hash), so every render draws the same pixels. */
export const F = (w: number, px: number) => `${w} ${px}px Prompt, sans-serif`;
const cache = new Map<string, THREE.CanvasTexture>();
export const tex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
  const k = key + (repeat ? repeat.join('x') : '');
  if (cache.has(k)) return cache.get(k)!;
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  cache.set(k, t); return t;
};
/** speckle noise over a filled rect */
export const speckle = (g: CanvasRenderingContext2D, w: number, h: number, n: number, cols: string[], a0 = 0.15, a1 = 0.4, s0 = 1, s1 = 3, seed = 1) => {
  for (let k = 0; k < n; k++) { g.fillStyle = cols[k % cols.length]; g.globalAlpha = a0 + hash(k * 1.13 + seed) * (a1 - a0); const s = s0 + hash(k * 3.7 + seed) * (s1 - s0); g.fillRect(hash(k * 1.71 + seed * 3) * w, hash(k * 2.93 + seed * 5) * h, s, s); }
  g.globalAlpha = 1;
};
/** vertical grime gradient at the bottom + a few streaks */
export const grime = (g: CanvasRenderingContext2D, w: number, h: number, strength = 0.25, streaks = 6, seed = 2) => {
  const gr = g.createLinearGradient(0, h * 0.7, 0, h); gr.addColorStop(0, 'rgba(40,36,30,0)'); gr.addColorStop(1, `rgba(40,36,30,${strength})`); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let k = 0; k < streaks; k++) { const x = hash(k * 7.3 + seed) * w, len = h * (0.2 + hash(k * 2.1 + seed) * 0.6), y0 = hash(k * 5.5 + seed) * h * 0.3; const sg = g.createLinearGradient(0, y0, 0, y0 + len); sg.addColorStop(0, 'rgba(50,45,38,0.12)'); sg.addColorStop(1, 'rgba(50,45,38,0)'); g.fillStyle = sg; g.fillRect(x, y0, 2 + hash(k) * 4, len); }
};
export const wrapText = (g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) => {
  const words = text.split(' '); let line = '', yy = y;
  const flush = () => { g.fillText(line, x, yy); yy += lh; line = ''; };
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (g.measureText(test).width <= maxW) { line = test; continue; }
    if (line) flush();
    if (g.measureText(w).width <= maxW) { line = w; continue; }
    for (const ch of Array.from(w)) { if (g.measureText(line + ch).width > maxW) flush(); line += ch; }
  }
  if (line) flush(); return yy;
};
const mats = new Map<string, THREE.Material>();
/** cached standard material */
export const M = (c: string, rough = 0.8, metal = 0, extra: Partial<THREE.MeshStandardMaterialParameters> = {}, key = '') => {
  const k = c + rough + metal + key; if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({color: c, roughness: rough, metalness: metal, ...extra})); return mats.get(k) as THREE.MeshStandardMaterial;
};
export const MB = (c: string, key = '') => { const k = 'b' + c + key; if (!mats.has(k)) mats.set(k, new THREE.MeshBasicMaterial({color: c, toneMapped: false})); return mats.get(k) as THREE.MeshBasicMaterial; };
/** a soft round glow sprite texture (additive halos round lamps) */
export const glowTex = () => tex('glow', 128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });

/** uncached canvas texture (each call draws a new one) — for textures whose content changes with props */
export const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); } return t;
};
