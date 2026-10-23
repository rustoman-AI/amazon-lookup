/**
 * 0-1000 Normalized Computer-Vision Bounding Box interface.
 * Standardized across Amazon Bedrock, Nova, Claude Vision, and Rekognition.
 */
export interface BoundingBox {
  id: string;
  x_min: number; // 0 to 1000
  y_min: number; // 0 to 1000
  x_max: number; // 0 to 1000
  y_max: number; // 0 to 1000
  label?: string;
  confidence?: number;
}

/**
 * 4-Way D-Pad Directional Input.
 */
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

/**
 * Normalized TV Remote Action across Fire OS, Vega OS, and Android TV runtimes.
 */
export type TvRemoteAction =
  | 'UP'
  | 'DOWN'
  | 'LEFT'
  | 'RIGHT'
  | 'SELECT'
  | 'BACK'
  | 'PLAY_PAUSE'
  | 'NONE';

/**
 * Extended remote action that also recognizes Fire TV hardware media-transport
 * keys and channel inputs. Used by `classifyRemoteKey` for apps that need
 * context-aware handling (e.g. Rewind/Fast-Forward as channel or item cycling).
 *
 * - `REWIND` / `FAST_FORWARD`: physical transport keys (also [ / ] / PageUp / PageDown).
 * - `CHANNEL_PREV` / `CHANNEL_NEXT`: dedicated ChannelDown / ChannelUp keys.
 * - `CHANNEL_1..CHANNEL_4`: number keys 1-4 (Digit1..Digit4).
 */
export type TvRemoteExtendedAction =
  | TvRemoteAction
  | 'REWIND'
  | 'FAST_FORWARD'
  | 'CHANNEL_PREV'
  | 'CHANNEL_NEXT'
  | 'CHANNEL_1'
  | 'CHANNEL_2'
  | 'CHANNEL_3'
  | 'CHANNEL_4';

/**
 * Options for spatial navigation candidate scoring.
 */
export interface SpatialNavigationOptions {
  /**
   * Maximum half-angle of the directional search cone in degrees (default: 60).
   * Prevents jumping to boxes that are predominantly orthogonal to the intent.
   */
  coneAngleDeg?: number;

  /**
   * Penalty multiplier applied to orthogonal deviation (default: 2.2).
   * Higher values strictly favor items aligned along the primary axis.
   */
  orthogonalWeight?: number;

  /**
   * When true, pressing D-Pad beyond the outermost box wraps to the opposite side (default: false).
   */
  wrap?: boolean;

  /**
   * Distance calculation metric (default: 'center').
   * 'center' uses Euclidean center-to-center distance with orthogonal weighting.
   * 'edge' uses minimum edge-to-edge Euclidean separation.
   */
  metric?: 'center' | 'edge';
}

/**
 * Spatial calculation candidate score.
 */
export interface ScoredCandidate<T extends BoundingBox = BoundingBox> {
  box: T;
  score: number;
  primaryDistance: number;
  orthogonalDistance: number;
  angleDeg: number;
  inCone: boolean;
}

/**
 * CSS Percentage layout object for 10-foot UI overlay rendering.
 */
export interface CssPercentageBox {
  left: string;
  top: string;
  width: string;
  height: string;
}

/**
 * Lightweight KeyboardEvent interface compatible with Browser, Node, and WebView environments.
 */
export interface KeyboardEventLike {
  key?: string;
  keyCode?: number;
  which?: number;
  code?: string;
  preventDefault?: () => void;
  stopPropagation?: () => void;
}
