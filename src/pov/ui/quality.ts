import {getRemotionEnvironment} from 'remotion';
import {z} from 'zod';

/**
 * Studio playback quality for heavy 3D episodes. Renders always use full quality, whatever is set.
 * Register the composition with `schema={qualitySchema} defaultProps={{quality: 'fast'}}` so Studio's Props panel shows a dropdown,
 * then pass `canvasQuality(quality)` to <ThreeCanvas dpr={…} shadows={…} gl={{antialias: …}}>.
 *  - 'full'  : what the render does — full resolution, anti-aliased, soft shadows (slow to play)
 *  - 'fast'  : half resolution, no anti-aliasing, hard shadows (default — shadow beats still read)
 *  - 'draft' : a third of the resolution, no shadows — for timing, head turns and captions
 * Needs zod 3.22.3 (the version Remotion 4.0.355 pins).
 */
export type Quality = 'full' | 'fast' | 'draft';
export const qualitySchema = z.object({quality: z.enum(['fast', 'draft', 'full'])});
export const canvasQuality = (q: Quality = 'fast') => {
  const eff: Quality = getRemotionEnvironment().isRendering ? 'full' : q;
  return {dpr: eff === 'full' ? 1 : eff === 'fast' ? 0.5 : 0.34, shadows: eff === 'draft' ? false : eff === 'full' ? ('soft' as const) : ('basic' as const), antialias: eff === 'full'};
};
