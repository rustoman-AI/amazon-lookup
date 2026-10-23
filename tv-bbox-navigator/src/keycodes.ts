import type {
  KeyboardEventLike,
  TvRemoteAction,
  TvRemoteExtendedAction,
  Direction,
} from './types';

/**
 * Android / Fire OS Native Keycodes (KeyEvent.java)
 */
export const FIRE_TV_KEYCODES = {
  // D-Pad
  KEYCODE_DPAD_UP: 19,
  KEYCODE_DPAD_DOWN: 20,
  KEYCODE_DPAD_LEFT: 21,
  KEYCODE_DPAD_RIGHT: 22,
  KEYCODE_DPAD_CENTER: 23,

  // Standard Navigation
  KEYCODE_ENTER: 66,
  KEYCODE_BACK: 4,

  // Media Controls
  KEYCODE_MEDIA_PLAY_PAUSE: 85,
  KEYCODE_MEDIA_PLAY: 126,
  KEYCODE_MEDIA_PAUSE: 127,
  KEYCODE_MEDIA_PLAY_PAUSE_WEBVIEW: 179,

  // Media Transport (physical Rewind / Fast-Forward on the Fire TV remote)
  KEYCODE_MEDIA_REWIND: 89,
  KEYCODE_MEDIA_FAST_FORWARD: 90,
  KEYCODE_MEDIA_REWIND_WEBVIEW: 227,
  KEYCODE_MEDIA_FAST_FORWARD_WEBVIEW: 228,

  // Channel keys
  KEYCODE_CHANNEL_UP: 166,
  KEYCODE_CHANNEL_DOWN: 167,

  // TV / Remote specific
  KEYCODE_SEARCH: 84,
  KEYCODE_MENU: 82,
} as const;

/**
 * Vega OS WebView & Virtual Device Host Keycodes
 */
export const VEGA_OS_KEYCODES = {
  KEYCODE_BACK_ESCAPE: 27,
  KEYCODE_HOST_PLAY_PAUSE: 179,
  KEYCODE_F4_MEDIA: 115, // F4 used on Vega Simulator host keyboards
} as const;

/**
 * Standard W3C KeyboardEvent key string constants
 */
export const STANDARD_KEYS = {
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  BACKSPACE: 'Backspace',
  SPACE: ' ',
  MEDIA_PLAY_PAUSE: 'MediaPlayPause',
  F4: 'F4',
  KEY_S: 's',
  KEY_S_UPPER: 'S',

  // Media transport (physical + keyboard proxies)
  MEDIA_REWIND: 'MediaRewind',
  MEDIA_TRACK_PREVIOUS: 'MediaTrackPrevious',
  MEDIA_FAST_FORWARD: 'MediaFastForward',
  MEDIA_TRACK_NEXT: 'MediaTrackNext',
  BRACKET_LEFT: '[',
  BRACKET_RIGHT: ']',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',

  // Channel keys
  CHANNEL_UP: 'ChannelUp',
  CHANNEL_DOWN: 'ChannelDown',
} as const;

/** True when the event is a physical/keyboard Rewind (prev) transport input. */
function isRewindKey(keyCode: number, key: string): boolean {
  return (
    keyCode === FIRE_TV_KEYCODES.KEYCODE_MEDIA_REWIND ||
    keyCode === FIRE_TV_KEYCODES.KEYCODE_MEDIA_REWIND_WEBVIEW ||
    key === STANDARD_KEYS.MEDIA_REWIND ||
    key === STANDARD_KEYS.MEDIA_TRACK_PREVIOUS ||
    key === STANDARD_KEYS.BRACKET_LEFT ||
    key === STANDARD_KEYS.PAGE_UP
  );
}

/** True when the event is a physical/keyboard Fast-Forward (next) transport input. */
function isFastForwardKey(keyCode: number, key: string): boolean {
  return (
    keyCode === FIRE_TV_KEYCODES.KEYCODE_MEDIA_FAST_FORWARD ||
    keyCode === FIRE_TV_KEYCODES.KEYCODE_MEDIA_FAST_FORWARD_WEBVIEW ||
    key === STANDARD_KEYS.MEDIA_FAST_FORWARD ||
    key === STANDARD_KEYS.MEDIA_TRACK_NEXT ||
    key === STANDARD_KEYS.BRACKET_RIGHT ||
    key === STANDARD_KEYS.PAGE_DOWN
  );
}

/** Returns 1-4 when the event is a Digit1..Digit4 / numeric '1'..'4' key, else 0. */
function channelDigit(keyCode: number, key: string, code: string): 0 | 1 | 2 | 3 | 4 {
  for (let n = 1; n <= 4; n++) {
    if (
      key === String(n) ||
      code === `Digit${n}` ||
      code === `Numpad${n}` ||
      keyCode === 48 + n || // top-row 1..4 => 49..52
      keyCode === 96 + n // numpad 1..4 => 97..100
    ) {
      return n as 1 | 2 | 3 | 4;
    }
  }
  return 0;
}

/**
 * Multi-runtime TV Remote Keycode Normalizer.
 * Unifies Fire OS WebView, Vega OS WebView, Android KeyEvents, and host simulators into
 * a predictable TvRemoteAction.
 *
 * @param event - KeyboardEvent or mock event object
 * @returns Normalized TvRemoteAction ('UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'SELECT' | 'BACK' | 'PLAY_PAUSE' | 'NONE')
 */
export function normalizeFireTvKey(event: KeyboardEventLike): TvRemoteAction {
  if (!event) return 'NONE';

  const keyCode = event.keyCode ?? event.which ?? 0;
  const key = event.key ?? '';

  // 1. D-Pad Left (also physical Rewind transport -> LEFT)
  if (
    keyCode === 37 || // W3C ArrowLeft
    keyCode === FIRE_TV_KEYCODES.KEYCODE_DPAD_LEFT || // Android 21
    key === STANDARD_KEYS.ARROW_LEFT ||
    isRewindKey(keyCode, key)
  ) {
    return 'LEFT';
  }

  // 2. D-Pad Up
  if (
    keyCode === 38 || // W3C ArrowUp
    keyCode === FIRE_TV_KEYCODES.KEYCODE_DPAD_UP || // Android 19
    key === STANDARD_KEYS.ARROW_UP
  ) {
    return 'UP';
  }

  // 3. D-Pad Right (also physical Fast-Forward transport -> RIGHT)
  if (
    keyCode === 39 || // W3C ArrowRight
    keyCode === FIRE_TV_KEYCODES.KEYCODE_DPAD_RIGHT || // Android 22
    key === STANDARD_KEYS.ARROW_RIGHT ||
    isFastForwardKey(keyCode, key)
  ) {
    return 'RIGHT';
  }

  // 4. D-Pad Down
  if (
    keyCode === 40 || // W3C ArrowDown
    keyCode === FIRE_TV_KEYCODES.KEYCODE_DPAD_DOWN || // Android 20
    key === STANDARD_KEYS.ARROW_DOWN
  ) {
    return 'DOWN';
  }

  // 5. Select / Enter / D-Pad Center
  if (
    keyCode === 13 || // W3C Enter
    keyCode === FIRE_TV_KEYCODES.KEYCODE_DPAD_CENTER || // Android 23
    keyCode === FIRE_TV_KEYCODES.KEYCODE_ENTER || // Android 66
    key === STANDARD_KEYS.ENTER
  ) {
    return 'SELECT';
  }

  // 6. Play / Pause Media Control
  if (
    keyCode === FIRE_TV_KEYCODES.KEYCODE_MEDIA_PLAY_PAUSE || // Android 85
    keyCode === FIRE_TV_KEYCODES.KEYCODE_MEDIA_PLAY_PAUSE_WEBVIEW || // Fire OS 179
    keyCode === VEGA_OS_KEYCODES.KEYCODE_F4_MEDIA || // Vega simulator F4 (115)
    keyCode === 32 || // Space bar (32)
    key === STANDARD_KEYS.MEDIA_PLAY_PAUSE ||
    key === STANDARD_KEYS.F4 ||
    key === STANDARD_KEYS.SPACE ||
    key === STANDARD_KEYS.KEY_S || // Quick trigger 's' for Shop Scene
    key === STANDARD_KEYS.KEY_S_UPPER
  ) {
    return 'PLAY_PAUSE';
  }

  // 7. Back Button
  if (
    keyCode === FIRE_TV_KEYCODES.KEYCODE_BACK || // Android 4
    keyCode === VEGA_OS_KEYCODES.KEYCODE_BACK_ESCAPE || // Vega OS Escape (27)
    keyCode === 8 || // Backspace (8)
    key === STANDARD_KEYS.ESCAPE ||
    key === STANDARD_KEYS.BACKSPACE
  ) {
    return 'BACK';
  }

  return 'NONE';
}

/**
 * Type guard to check if an action is a D-Pad navigation direction.
 */
export function isDpadAction(action: TvRemoteAction): action is Direction {
  return action === 'UP' || action === 'DOWN' || action === 'LEFT' || action === 'RIGHT';
}

/**
 * Context-aware remote classifier for apps (e.g. Amazon LookUp) that need to
 * distinguish transport/channel keys from plain D-Pad directions.
 *
 * Priority:
 *   1. Dedicated ChannelUp/ChannelDown -> CHANNEL_NEXT / CHANNEL_PREV
 *   2. Number keys 1-4 -> CHANNEL_1..CHANNEL_4
 *   3. Physical Rewind / Fast-Forward (and [ ] / PageUp / PageDown) -> REWIND / FAST_FORWARD
 *   4. Otherwise fall back to the base `normalizeFireTvKey` action
 *      (UP/DOWN/LEFT/RIGHT/SELECT/BACK/PLAY_PAUSE/NONE).
 *
 * This lets the app decide per-context what REWIND/FAST_FORWARD mean (channel
 * switching while playing vs. item/tier cycling while the X-Ray overlay is open).
 */
export function classifyRemoteKey(event: KeyboardEventLike): TvRemoteExtendedAction {
  if (!event) return 'NONE';

  const keyCode = event.keyCode ?? event.which ?? 0;
  const key = event.key ?? '';
  const code = event.code ?? '';

  // 1. Dedicated channel keys.
  if (keyCode === FIRE_TV_KEYCODES.KEYCODE_CHANNEL_UP || key === STANDARD_KEYS.CHANNEL_UP) {
    return 'CHANNEL_NEXT';
  }
  if (keyCode === FIRE_TV_KEYCODES.KEYCODE_CHANNEL_DOWN || key === STANDARD_KEYS.CHANNEL_DOWN) {
    return 'CHANNEL_PREV';
  }

  // 2. Direct channel number keys 1-4.
  const digit = channelDigit(keyCode, key, code);
  if (digit) {
    return (`CHANNEL_${digit}`) as TvRemoteExtendedAction;
  }

  // 3. Transport keys preserved as their own intent.
  if (isRewindKey(keyCode, key)) return 'REWIND';
  if (isFastForwardKey(keyCode, key)) return 'FAST_FORWARD';

  // 4. Everything else: base D-Pad / select / back / play-pause.
  return normalizeFireTvKey(event);
}
