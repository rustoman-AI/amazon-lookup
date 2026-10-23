/**
 * 0-1000 integer coordinate-space helpers.
 *
 * All bounding-box values must be integers within [0, 1000], with (0,0) at the
 * top-left and (1000,1000) at the bottom-right.
 */
import type { RawDetection } from '../types';

const MIN = 0;
const MAX = 1000;

/** Clamp a number into [0, 1000] and round to the nearest integer. */
export function clampCoord(value: number): number {
  if (!Number.isFinite(value)) return MIN;
  const rounded = Math.round(value);
  return Math.min(MAX, Math.max(MIN, rounded));
}

/**
 * Normalize a detection's box: clamp/round all coords to 0-1000 integers and
 * guarantee a non-degenerate box (x_max > x_min, y_max > y_min).
 */
export function normalizeBox<T extends RawDetection>(d: T): T {
  let x_min = clampCoord(d.x_min);
  let y_min = clampCoord(d.y_min);
  let x_max = clampCoord(d.x_max);
  let y_max = clampCoord(d.y_max);

  // Repair swapped corners.
  if (x_max < x_min) [x_min, x_max] = [x_max, x_min];
  if (y_max < y_min) [y_min, y_max] = [y_max, y_min];

  // Guarantee at least 1 unit of width/height.
  if (x_max === x_min) x_max = Math.min(MAX, x_min + 1);
  if (y_max === y_min) y_max = Math.min(MAX, y_min + 1);

  return { ...d, x_min, y_min, x_max, y_max };
}
