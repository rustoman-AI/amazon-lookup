/**
 * tv-bbox-navigator
 *
 * Framework-agnostic Spatial D-Pad Navigation Engine for 10-foot Smart TVs
 * (Amazon Fire TV, Fire OS, Vega OS, and Android TV).
 *
 * Maps 0-1000 normalized computer-vision bounding boxes to directional D-Pad remote events.
 *
 * Copyright (c) 2026 Nuculo Incorporated / Artur Nurullin
 * Licensed under the MIT License.
 */

export type {
  BoundingBox,
  Direction,
  TvRemoteAction,
  TvRemoteExtendedAction,
  SpatialNavigationOptions,
  ScoredCandidate,
  CssPercentageBox,
  KeyboardEventLike,
} from './types';

export {
  FIRE_TV_KEYCODES,
  VEGA_OS_KEYCODES,
  STANDARD_KEYS,
  normalizeFireTvKey,
  classifyRemoteKey,
  isDpadAction,
} from './keycodes';

export {
  getBoxCenter,
  getEdgeDistance,
  bboxToCssPercentage,
  findNextBoundingBox,
} from './spatial';

export {
  SpatialNavigator,
} from './navigator';

export type {
  FocusChangeListener,
  RemoteActionListener,
  SpatialNavigatorConfig,
} from './navigator';
