import assert from 'node:assert';
import test from 'node:test';
import {
  normalizeFireTvKey,
  bboxToCssPercentage,
  findNextBoundingBox,
  SpatialNavigator,
  type BoundingBox,
} from '../src/index';

test('1. Multi-Runtime Keycode Normalizer', () => {
  // Fire OS WebView Back
  assert.strictEqual(normalizeFireTvKey({ keyCode: 4 }), 'BACK');

  // Fire OS WebView MediaPlayPause
  assert.strictEqual(normalizeFireTvKey({ keyCode: 179 }), 'PLAY_PAUSE');

  // Android Native KeyCodes (19..23)
  assert.strictEqual(normalizeFireTvKey({ keyCode: 19 }), 'UP');
  assert.strictEqual(normalizeFireTvKey({ keyCode: 20 }), 'DOWN');
  assert.strictEqual(normalizeFireTvKey({ keyCode: 21 }), 'LEFT');
  assert.strictEqual(normalizeFireTvKey({ keyCode: 22 }), 'RIGHT');
  assert.strictEqual(normalizeFireTvKey({ keyCode: 23 }), 'SELECT');

  // Vega OS WebView Escape & F4 host simulator
  assert.strictEqual(normalizeFireTvKey({ keyCode: 27 }), 'BACK');
  assert.strictEqual(normalizeFireTvKey({ key: 'F4' }), 'PLAY_PAUSE');

  // Standard W3C Keys
  assert.strictEqual(normalizeFireTvKey({ key: 'ArrowLeft' }), 'LEFT');
  assert.strictEqual(normalizeFireTvKey({ key: 'ArrowRight' }), 'RIGHT');
  assert.strictEqual(normalizeFireTvKey({ key: 'ArrowUp' }), 'UP');
  assert.strictEqual(normalizeFireTvKey({ key: 'ArrowDown' }), 'DOWN');
  assert.strictEqual(normalizeFireTvKey({ key: 'Enter' }), 'SELECT');
  assert.strictEqual(normalizeFireTvKey({ key: 'Escape' }), 'BACK');
  assert.strictEqual(normalizeFireTvKey({ key: ' ' }), 'PLAY_PAUSE');
});

test('2. 0-1000 Coordinate CSS Percentage Conversion', () => {
  const watchBox: BoundingBox = {
    id: 'box-watch',
    x_min: 470,
    y_min: 540,
    x_max: 560,
    y_max: 650,
  };

  const css = bboxToCssPercentage(watchBox);
  assert.strictEqual(css.left, '47%');
  assert.strictEqual(css.top, '54%');
  assert.strictEqual(css.width, '9%');
  assert.strictEqual(css.height, '11%');
});

test('3. Directional Cone + Euclidean Center-to-Center Navigation', () => {
  const boxCenter: BoundingBox = {
    id: 'center',
    x_min: 450,
    y_min: 450,
    x_max: 550,
    y_max: 550, // Center: (500, 500)
  };

  const boxRight: BoundingBox = {
    id: 'right',
    x_min: 750,
    y_min: 460,
    x_max: 850,
    y_max: 540, // Center: (800, 500)
  };

  const boxDown: BoundingBox = {
    id: 'down',
    x_min: 460,
    y_min: 750,
    x_max: 540,
    y_max: 850, // Center: (500, 800)
  };

  const boxLeft: BoundingBox = {
    id: 'left',
    x_min: 150,
    y_min: 460,
    x_max: 250,
    y_max: 540, // Center: (200, 500)
  };

  const boxUp: BoundingBox = {
    id: 'up',
    x_min: 460,
    y_min: 150,
    x_max: 540,
    y_max: 250, // Center: (500, 200)
  };

  const boxes = [boxCenter, boxRight, boxDown, boxLeft, boxUp];

  // Moving RIGHT from center lands on boxRight
  const nextRight = findNextBoundingBox(boxes, 'center', 'RIGHT');
  assert.strictEqual(nextRight?.id, 'right');

  // Moving DOWN from center lands on boxDown
  const nextDown = findNextBoundingBox(boxes, 'center', 'DOWN');
  assert.strictEqual(nextDown?.id, 'down');

  // Moving LEFT from center lands on boxLeft
  const nextLeft = findNextBoundingBox(boxes, 'center', 'LEFT');
  assert.strictEqual(nextLeft?.id, 'left');

  // Moving UP from center lands on boxUp
  const nextUp = findNextBoundingBox(boxes, 'center', 'UP');
  assert.strictEqual(nextUp?.id, 'up');

  // Moving RIGHT from boxRight (no item to the right):
  const blocked = findNextBoundingBox(boxes, 'right', 'RIGHT', { wrap: false });
  assert.strictEqual(blocked, null);

  // Wrapping enabled: moving RIGHT from boxRight wraps to leftmost box
  const wrapped = findNextBoundingBox(boxes, 'right', 'RIGHT', { wrap: true });
  assert.strictEqual(wrapped?.id, 'left');
});

test('4. SpatialNavigator Class & Event Orchestration', () => {
  const items: BoundingBox[] = [
    { id: 'item1', x_min: 100, y_min: 100, x_max: 200, y_max: 200 },
    { id: 'item2', x_min: 600, y_min: 100, x_max: 700, y_max: 200 },
  ];

  const nav = new SpatialNavigator(items);
  assert.strictEqual(nav.getFocusedId(), 'item1');

  let notifiedFocusId: string | null = null;
  nav.onFocusChange((box) => {
    notifiedFocusId = box?.id ?? null;
  });

  // Handle D-Pad Right key
  const action = nav.handleKeyEvent({ keyCode: 22 }); // Android KEYCODE_DPAD_RIGHT
  assert.strictEqual(action, 'RIGHT');
  assert.strictEqual(nav.getFocusedId(), 'item2');
  assert.strictEqual(notifiedFocusId, 'item2');

  // Handle Select key
  let selectedAction: string | null = null;
  nav.onAction((act) => {
    selectedAction = act;
  });

  nav.handleKeyEvent({ keyCode: 23 }); // Android KEYCODE_DPAD_CENTER
  assert.strictEqual(selectedAction, 'SELECT');
});
