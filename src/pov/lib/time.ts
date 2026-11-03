import {interpolate, Easing} from 'remotion';
export const keys = (f: number, frames: number[], values: number[], e = Easing.bezier(0.45, 0, 0.25, 1)) => interpolate(f, frames, values, {easing: e, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
