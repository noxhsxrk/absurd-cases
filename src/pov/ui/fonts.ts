import {staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
export const FONT = 'Prompt';
for (const w of ['400', '600', '700'])
  for (const [sub, range] of [['thai', 'U+0E01-0E5B, U+200C-200D, U+25CC'], ['latin', 'U+0000-00FF, U+2013-2014, U+2018-201E, U+2022, U+2026, U+2190-2193']] as const)
    loadFont({family: FONT, url: staticFile(`fonts/Prompt-${sub}-${w}.woff2`), weight: w, unicodeRange: range}).catch(() => undefined);
