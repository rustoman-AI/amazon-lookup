import type {
  BoundingBox,
  Direction,
  SpatialNavigationOptions,
  ScoredCandidate,
  CssPercentageBox,
} from './types';

const DEFAULT_OPTIONS: Required<SpatialNavigationOptions> = {
  coneAngleDeg: 60,
  orthogonalWeight: 2.2,
  wrap: false,
  metric: 'center',
};

/**
 * Get center coordinates of a 0-1000 bounding box.
 */
export function getBoxCenter(box: BoundingBox): { cx: number; cy: number } {
  return {
    cx: (box.x_min + box.x_max) / 2,
    cy: (box.y_min + box.y_max) / 2,
  };
}

/**
 * Calculate 1D overlap/separation distance between two intervals [minA, maxA] and [minB, maxB].
 * Returns 0 if intervals overlap; otherwise returns positive gap distance.
 */
function getIntervalSeparation(minA: number, maxA: number, minB: number, maxB: number): number {
  if (maxA < minB) return minB - maxA;
  if (maxB < minA) return minA - maxB;
  return 0; // Overlapping
}

/**
 * Calculate minimum edge-to-edge Euclidean separation distance between two bounding boxes.
 */
export function getEdgeDistance(boxA: BoundingBox, boxB: BoundingBox): number {
  const dx = getIntervalSeparation(boxA.x_min, boxA.x_max, boxB.x_min, boxB.x_max);
  const dy = getIntervalSeparation(boxA.y_min, boxA.y_max, boxB.y_min, boxB.y_max);
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Converts a 0-1000 normalized bounding box to CSS percentage properties for 10-foot TV rendering.
 *
 * @param box - 0-1000 normalized bounding box
 * @returns CSS layout percentages { left, top, width, height }
 */
export function bboxToCssPercentage(box: BoundingBox): CssPercentageBox {
  const left = (box.x_min / 1000) * 100;
  const top = (box.y_min / 1000) * 100;
  const width = ((box.x_max - box.x_min) / 1000) * 100;
  const height = ((box.y_max - box.y_min) / 1000) * 100;

  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
  };
}

/**
 * Calculates directional displacements (primary and orthogonal) and cone angle for a candidate box.
 */
function evaluateDirection(
  current: BoundingBox,
  candidate: BoundingBox,
  direction: Direction
): { primary: number; orthogonal: number; angleDeg: number; inHalfPlane: boolean } {
  const curCenter = getBoxCenter(current);
  const candCenter = getBoxCenter(candidate);

  const dx = candCenter.cx - curCenter.cx;
  const dy = candCenter.cy - curCenter.cy;

  let primary = 0;
  let orthogonal = 0;

  switch (direction) {
    case 'RIGHT':
      primary = dx;
      orthogonal = Math.abs(dy);
      break;
    case 'LEFT':
      primary = -dx;
      orthogonal = Math.abs(dy);
      break;
    case 'DOWN':
      primary = dy;
      orthogonal = Math.abs(dx);
      break;
    case 'UP':
      primary = -dy;
      orthogonal = Math.abs(dx);
      break;
  }

  const inHalfPlane = primary > 0;
  // Calculate angle in degrees relative to primary axis (0 to 180 degrees)
  const angleRad = Math.atan2(orthogonal, Math.max(0, primary));
  const angleDeg = (angleRad * 180) / Math.PI;

  return { primary, orthogonal, angleDeg, inHalfPlane };
}

/**
 * Finds the best next bounding box in the specified D-Pad direction using directional cone
 * and orthogonal-weighted Euclidean scoring.
 *
 * @param boxes - Collection of all candidate bounding boxes
 * @param currentId - ID of currently focused box (or null if none)
 * @param direction - Directional D-Pad input ('UP' | 'DOWN' | 'LEFT' | 'RIGHT')
 * @param options - Spatial navigation tuning options
 * @returns The best matching BoundingBox, or null if none reachable
 */
export function findNextBoundingBox<T extends BoundingBox = BoundingBox>(
  boxes: readonly T[],
  currentId: string | null | undefined,
  direction: Direction,
  options?: SpatialNavigationOptions
): T | null {
  if (!boxes || boxes.length === 0) return null;
  if (boxes.length === 1) return boxes[0];

  const opts: Required<SpatialNavigationOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  // Find currently active box
  const currentIndex = currentId ? boxes.findIndex((b) => b.id === currentId) : -1;
  if (currentIndex === -1) {
    // If no active box, return the most prominent box in that direction or first box
    return getDefaultBoxForDirection(boxes, direction);
  }

  const currentBox = boxes[currentIndex];
  const candidates = boxes.filter((b) => b.id !== currentBox.id);

  if (candidates.length === 0) return currentBox;

  const scored: ScoredCandidate<T>[] = [];

  for (const candidate of candidates) {
    const { primary, orthogonal, angleDeg, inHalfPlane } = evaluateDirection(
      currentBox,
      candidate,
      direction
    );

    // If candidate is behind the current box and not even in forward half-plane, skip unless wrapping
    if (!inHalfPlane) continue;

    const inCone = angleDeg <= opts.coneAngleDeg;

    let baseDist: number;
    if (opts.metric === 'edge') {
      baseDist = getEdgeDistance(currentBox, candidate);
    } else {
      baseDist = primary;
    }

    // Weighted Euclidean spatial score: primary displacement + penalized orthogonal drift
    const weightedScore = Math.sqrt(
      baseDist * baseDist + Math.pow(orthogonal * opts.orthogonalWeight, 2)
    );

    // Apply soft penalty multiplier if outside cone but still in forward half-plane
    const finalScore = inCone ? weightedScore : weightedScore * 2.8;

    scored.push({
      box: candidate,
      score: finalScore,
      primaryDistance: primary,
      orthogonalDistance: orthogonal,
      angleDeg,
      inCone,
    });
  }

  // Filter candidates inside the directional cone first
  const inConeCandidates = scored.filter((s) => s.inCone);
  if (inConeCandidates.length > 0) {
    inConeCandidates.sort((a, b) => a.score - b.score);
    return inConeCandidates[0].box;
  }

  // Fallback to closest candidate in forward half-plane if any exist
  if (scored.length > 0) {
    scored.sort((a, b) => a.score - b.score);
    return scored[0].box;
  }

  // If wrapping is enabled and no forward candidate exists, wrap around to opposite screen edge
  if (opts.wrap) {
    return getWrappedBox(candidates, direction);
  }

  return null;
}

/**
 * Returns the default starting box when no item is initially focused.
 */
function getDefaultBoxForDirection<T extends BoundingBox>(
  boxes: readonly T[],
  direction: Direction
): T {
  const sorted = [...boxes];
  switch (direction) {
    case 'RIGHT':
      // Start with leftmost box
      sorted.sort((a, b) => a.x_min - b.x_min);
      break;
    case 'LEFT':
      // Start with rightmost box
      sorted.sort((a, b) => b.x_max - a.x_max);
      break;
    case 'DOWN':
      // Start with topmost box
      sorted.sort((a, b) => a.y_min - b.y_min);
      break;
    case 'UP':
      // Start with bottommost box
      sorted.sort((a, b) => b.y_max - a.y_max);
      break;
  }
  return sorted[0];
}

/**
 * Resolves the opposite-edge wrap candidate when traversing beyond screen boundaries.
 */
function getWrappedBox<T extends BoundingBox>(candidates: readonly T[], direction: Direction): T {
  const sorted = [...candidates];
  switch (direction) {
    case 'RIGHT':
      // When moving right with no more rightward boxes, wrap to the leftmost
      sorted.sort((a, b) => a.x_min - b.x_min);
      break;
    case 'LEFT':
      // Wrap to rightmost
      sorted.sort((a, b) => b.x_max - a.x_max);
      break;
    case 'DOWN':
      // Wrap to topmost
      sorted.sort((a, b) => a.y_min - b.y_min);
      break;
    case 'UP':
      // Wrap to bottommost
      sorted.sort((a, b) => b.y_max - a.y_max);
      break;
  }
  return sorted[0];
}
