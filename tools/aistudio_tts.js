// Google AI Studio speech playground driver (paste into the page with the built-in browser's javascript tool).
// One take per line: setVoice → gen → takes kept in window.takes; export with dumpNext() (return it WHOLE, never sliced).
// Usage: paste this file, then `window.JOBS = [...epN_tts_jobs.json]; runJobs(JOBS)`; poll `window.LOG`; dump every few lines;
// rebuild WAVs with `python3 tools/collect_tts.py <out> --since <unix time>`.
window.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
window.btnBy = (f) => [...document.querySelectorAll('button')].find((b) => f((b.innerText || '').trim()));
window.setVal = (el, v) => { const d = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value'); d.set.call(el, v); el.dispatchEvent(new Event('input', {bubbles: true})); el.dispatchEvent(new Event('change', {bubbles: true})); };
window.takes = window.takes || {}; window.dumped = window.dumped || new Set(); window.LOG = window.LOG || [];
window.closeOv = async () => { const c = [...document.querySelectorAll('.cdk-overlay-container button')].find((b) => b.innerText.trim() === 'close'); if (c) { c.click(); await sleep(400); } if (document.querySelector('.cdk-overlay-backdrop')) { document.querySelector('.cdk-overlay-backdrop').click(); await sleep(300); } };
/** pick the Speaker 1 voice by name through the Speaker-settings search; returns the speaker button text or an error string */
window.setVoice = async (name) => {
  const cur = btnBy((t) => t.startsWith('Speaker 1')).innerText.split('\n')[0].trim(); if (cur === 'Speaker 1 - ' + name) return 'same';
  let inp = document.querySelector('.cdk-overlay-container input.has-icon');
  if (!inp) { btnBy((t) => t.startsWith('Speaker 1')).click(); for (let i = 0; i < 10; i++) { await sleep(300); inp = document.querySelector('.cdk-overlay-container input.has-icon'); if (inp) break; } }
  if (!inp) return 'no panel (reload the page and open a new dialog)';
  const ov = document.querySelector('.cdk-overlay-container'); inp.focus(); setVal(inp, name);
  let card; for (let i = 0; i < 20; i++) { await sleep(300); card = [...ov.querySelectorAll('button.voice-card-content')].find((b) => b.querySelector('.voice-name')?.innerText.trim() === name); if (card) break; }
  if (!card) { await closeOv(); return 'notfound ' + name; }
  card.click(); await sleep(800); await closeOv();
  return btnBy((t) => t.startsWith('Speaker 1')).innerText.split('\n')[0];
};
/** one take: style box (via the button after the speaker button) + text box, both read back, Run, wait for a fresh stable data:audio/wav */
window.gen = async (id, style, text) => {
  if (document.querySelector('.cdk-overlay-container input.has-icon')) await closeOv();
  const sp = btnBy((t) => t.startsWith('Speaker 1')); if (!sp) return 'no speaker';
  const all = [...document.querySelectorAll('button')]; all[all.indexOf(sp) + 1].click(); await sleep(600);
  const st = document.querySelector('textarea.daikon-custom-style-textarea'); if (!st) return 'no style ta';
  st.focus(); setVal(st, style); await sleep(200); const stv = st.value;
  document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true})); document.body.click(); await sleep(400);
  if (document.querySelector('textarea.daikon-custom-style-textarea')) { document.querySelector('.cdk-overlay-backdrop')?.click(); await sleep(300); }
  const ta = [...document.querySelectorAll('textarea')].find((t) => !t.classList.contains('daikon-custom-style-textarea'));
  ta.focus(); setVal(ta, text); await sleep(250);
  if (ta.value !== text || stv !== style) return 'FORM MISMATCH';
  const voice = btnBy((t) => t.startsWith('Speaker 1')).innerText.split('\n')[0];
  const old = document.querySelector('audio')?.src || '';
  btnBy((t) => t.startsWith('Run')).click();
  let last = '', stable = 0;
  for (let i = 0; i < 80; i++) {
    await sleep(500); if (/Quota limit reached|limit of requests/i.test(document.body.innerText)) return 'QUOTA';
    const s = document.querySelector('audio')?.src || '';
    if (s && s !== old && s.startsWith('data:audio/wav') && s.length > 40000) { if (s === last) { if (++stable >= 3) { window.takes[id] = s; return `${id} ${Math.round((s.length * 0.75 - 44) / 48) / 1000}s ${voice.slice(12)} ok`; } } else { stable = 0; last = s; } }
  }
  return 'timeout';
};
/** run jobs [{id, voice, style, text}] in the background; stops at the first failure or quota */
window.runJobs = async (jobs) => { window.LOG = []; for (const j of jobs) { const v = await setVoice(j.voice); if (!/same|Speaker 1 - /.test(v)) { LOG.push(j.id + ':VOICE ' + v); break; } let r = await gen(j.id, j.style, j.text); if (r === 'timeout' || r === 'no style ta') { await sleep(1500); r = await gen(j.id, j.style, j.text); } LOG.push(j.id + ':' + r); if (!/ ok$/.test(r)) break; } LOG.push('DONE'); };
/** export undumped takes as '#id#0#1#<data url>|', ≤ 800 KB per call, padded ≥ 200 KB so the result lands in a file. Return it whole. */
window.dumpNext = () => { let out = [], tot = 0; for (const id of Object.keys(window.takes)) { if (window.dumped.has(id)) continue; const s = window.takes[id]; if (tot && tot + s.length > 800000) break; out.push(`#${id}#0#1#` + s + '|'); tot += s.length; window.dumped.add(id); } return out.length ? out.join('\n').padEnd(200050, '.') : 'none left'; };
'aistudio_tts ready';
