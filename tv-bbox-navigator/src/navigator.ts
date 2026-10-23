import type {
  BoundingBox,
  Direction,
  TvRemoteAction,
  SpatialNavigationOptions,
  KeyboardEventLike,
} from './types';
import { normalizeFireTvKey, isDpadAction } from './keycodes';
import { findNextBoundingBox } from './spatial';

export type FocusChangeListener<T extends BoundingBox = BoundingBox> = (
  box: T | null,
  direction?: Direction
) => void;

export type RemoteActionListener = (action: TvRemoteAction, event: KeyboardEventLike) => void;

export interface SpatialNavigatorConfig extends SpatialNavigationOptions {
  autoPreventDefault?: boolean;
}

/**
 * High-performance, framework-agnostic Spatial Navigator for 10-foot Smart TVs.
 * Maps 0-1000 computer vision bounding boxes to Fire TV & Vega OS D-Pad remote events.
 */
export class SpatialNavigator<T extends BoundingBox = BoundingBox> {
  private boxes: T[] = [];
  private currentFocusId: string | null = null;
  private options: SpatialNavigationOptions;
  private autoPreventDefault: boolean;

  private focusListeners: Set<FocusChangeListener<T>> = new Set();
  private actionListeners: Set<RemoteActionListener> = new Set();
  private boundKeyHandler: EventListener | null = null;

  constructor(boxes: T[] = [], config?: SpatialNavigatorConfig) {
    this.boxes = [...boxes];
    this.options = {
      coneAngleDeg: config?.coneAngleDeg ?? 60,
      orthogonalWeight: config?.orthogonalWeight ?? 2.2,
      wrap: config?.wrap ?? false,
      metric: config?.metric ?? 'center',
    };
    this.autoPreventDefault = config?.autoPreventDefault ?? true;

    if (this.boxes.length > 0) {
      this.currentFocusId = this.boxes[0].id;
    }
  }

  /**
   * Set or update candidate bounding boxes (e.g. upon fresh AI scene analysis).
   */
  public setBoxes(newBoxes: T[]): void {
    this.boxes = [...newBoxes];

    // Verify if currently focused ID still exists in the new list
    const stillExists = this.boxes.some((b) => b.id === this.currentFocusId);
    if (!stillExists) {
      const nextFocus = this.boxes.length > 0 ? this.boxes[0] : null;
      this.currentFocusId = nextFocus ? nextFocus.id : null;
      this.notifyFocusChange(nextFocus);
    }
  }

  /**
   * Get all active bounding boxes.
   */
  public getBoxes(): readonly T[] {
    return this.boxes;
  }

  /**
   * Get currently focused box.
   */
  public getFocusedBox(): T | null {
    if (!this.currentFocusId) return null;
    return this.boxes.find((b) => b.id === this.currentFocusId) ?? null;
  }

  /**
   * Get ID of currently focused box.
   */
  public getFocusedId(): string | null {
    return this.currentFocusId;
  }

  /**
   * Explicitly set focus to a specific bounding box by ID.
   */
  public focus(id: string | null): boolean {
    if (id === null) {
      this.currentFocusId = null;
      this.notifyFocusChange(null);
      return true;
    }

    const box = this.boxes.find((b) => b.id === id);
    if (!box) return false;

    this.currentFocusId = box.id;
    this.notifyFocusChange(box);
    return true;
  }

  /**
   * Move focus in the given D-Pad direction.
   *
   * @param direction - 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
   * @param overrideOptions - Optional overrides for cone or wrapping
   * @returns Next focused bounding box, or null if no movement occurred
   */
  public move(direction: Direction, overrideOptions?: SpatialNavigationOptions): T | null {
    const nextBox = findNextBoundingBox(
      this.boxes,
      this.currentFocusId,
      direction,
      { ...this.options, ...overrideOptions }
    );

    if (nextBox && nextBox.id !== this.currentFocusId) {
      this.currentFocusId = nextBox.id;
      this.notifyFocusChange(nextBox, direction);
      return nextBox;
    }

    return null;
  }

  /**
   * Process a keyboard event from Fire OS, Vega OS, or standard browser window.
   * Automatically normalizes the event and executes directional spatial jumps.
   */
  public handleKeyEvent(event: KeyboardEventLike): TvRemoteAction {
    const action = normalizeFireTvKey(event);

    if (this.autoPreventDefault && action !== 'NONE' && event.preventDefault) {
      event.preventDefault();
    }

    // Broadcast raw normalized action to listeners
    for (const listener of this.actionListeners) {
      listener(action, event);
    }

    if (isDpadAction(action)) {
      this.move(action);
    }

    return action;
  }

  /**
   * Subscribe to focus changes.
   */
  public onFocusChange(listener: FocusChangeListener<T>): () => void {
    this.focusListeners.add(listener);
    return () => this.focusListeners.delete(listener);
  }

  /**
   * Subscribe to all remote actions (D-Pad, SELECT, BACK, PLAY_PAUSE).
   */
  public onAction(listener: RemoteActionListener): () => void {
    this.actionListeners.add(listener);
    return () => this.actionListeners.delete(listener);
  }

  /**
   * Attach listener directly to global window (in browser / WebView).
   */
  public attach(target: EventTarget = window): () => void {
    this.detach();

    const handler = (e: Event) => {
      this.handleKeyEvent(e as KeyboardEventLike);
    };

    target.addEventListener('keydown', handler as EventListener);
    this.boundKeyHandler = handler;

    return () => this.detach(target);
  }

  /**
   * Detach active event listener from target.
   */
  public detach(target: EventTarget = window): void {
    if (this.boundKeyHandler) {
      target.removeEventListener('keydown', this.boundKeyHandler as EventListener);
      this.boundKeyHandler = null;
    }
  }

  private notifyFocusChange(box: T | null, direction?: Direction): void {
    for (const listener of this.focusListeners) {
      listener(box, direction);
    }
  }
}
