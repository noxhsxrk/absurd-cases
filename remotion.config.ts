import {Config} from '@remotion/cli/config';
import fs from 'node:fs';
// Optional: point at a local Chromium (sandboxes without Remotion's downloaded browser): POV_BROWSER=/path/to/chrome
const b = process.env.POV_BROWSER ?? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
if (fs.existsSync(b)) Config.setBrowserExecutable(b);
// 'angle' on a normal machine with a GPU; 'swangle' (software) in GPU-less sandboxes: POV_GL=swangle
Config.setChromiumOpenGlRenderer((process.env.POV_GL as 'angle' | 'swangle' | undefined) ?? (fs.existsSync('/opt/pw-browsers') ? 'swangle' : 'angle'));
