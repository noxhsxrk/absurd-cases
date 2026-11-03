// usage: node scripts/stills.mjs <CompId> <outDir> <scale> <frame,frame,...>   (bundles once, renders stills, builds a contact sheet)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const [comp, out, scale, fr] = process.argv.slice(2); const frames = fr.split(',').map(Number);
const bx = process.env.POV_BROWSER ?? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const browserExecutable = fs.existsSync(bx) ? bx : undefined;
const gl = process.env.POV_GL ?? (fs.existsSync('/opt/pw-browsers') ? 'swangle' : 'angle');
fs.mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: comp, browserExecutable, chromiumOptions: {gl}});
const files = [];
for (const f of frames) { const file = path.join(out, `${comp}_${String(f).padStart(4, '0')}.png`); await renderStill({serveUrl, composition, frame: f, output: file, scale: Number(scale), browserExecutable, chromiumOptions: {gl}, onBrowserLog: (l) => { if (l.type !== 'debug' && !String(l.text).includes('THREE.WebGLRenderer')) console.log('[browser]', l.type, String(l.text).slice(0, 300)); }}); files.push(file); console.log('still', file); }
if (files.length > 1) { const cols = Math.min(4, files.length); const rows = Math.ceil(files.length / cols);
  // concat list instead of -pattern_type glob (Windows ffmpeg has no glob); only this run's stills go in the sheet
  const list = path.join(os.tmpdir(), `stills_${process.pid}.txt`);
  fs.writeFileSync(list, files.map((f) => `file '${path.resolve(f).replace(/\\/g, '/')}'`).join('\n'));
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-vf', `scale=360:-1,tile=${cols}x${rows}`, '-frames:v', '1', path.join(out, `${comp}_sheet.png`)]); fs.rmSync(list, {force: true}); console.log('sheet'); }
