# Amazon LookUp: Friction Log

## Entry 1: Remote keycodes differ across Fire OS, Vega OS and the simulator
- Task: Handle D-pad, Back and Play/Pause from a standard Fire TV remote in a web-based 10-foot UI.
- Steps: Listened for keydown events and mapped them to navigation actions, then tested on Fire OS, Vega OS WebView and the simulator.
- Expected: The same button sends the same keycode on every platform, as documented.
- Actual: Keycodes differed (e.g. Back arrived as 4 on one target and 27 on another; Play/Pause as 179, 85 or a keyboard key), and we couldn't find one reference table covering them.
- Severity: High (the remote is the main input; wrong mapping breaks the whole experience).
- Workaround: Built a keycode normalization layer inside our open-source tv-bbox-navigator library.
- Suggestion: Publish an official cross-platform keycode reference for Fire OS, Vega OS WebView and the simulator, with a small sample input handler.

## Entry 2: Spatial navigation between dynamic AI bounding boxes
- Task: Let the user move between product bounding boxes returned by the vision model using only the D-pad.
- Steps: Tried simple nearest-neighbor focus between the boxes.
- Expected: Pressing RIGHT moves to the item visually to the right.
- Actual: Nearest-neighbor jumped diagonally (e.g. from a wristwatch to boots), because existing guidance assumes static focusable DOM elements, not dynamic overlays.
- Severity: Medium.
- Workaround: Directional cone filtering (60 degrees) plus orthogonal-weighted distance scoring in tv-bbox-navigator.
- Suggestion: Document a recommended spatial-navigation approach for dynamic, non-DOM overlays (e.g. CV results) on Fire TV / Vega OS.

## Entry 3: Bedrock Converse image payload format
- Task: Send a captured video frame to Amazon Nova Pro via the Bedrock Converse API.
- Steps: Captured the frame as a base64 JPEG data URL in the browser and passed it to the Converse image block.
- Expected: The image block accepts the base64 string the way many vision APIs do.
- Actual: The Converse image block expects raw bytes, so the request failed until we decoded the data URL server-side.
- Severity: Medium (blocking until found; easy fix once known).
- Workaround: Decode the base64 data URL to bytes on the Express server before calling ConverseCommand.
- Suggestion: Add a short end-to-end JavaScript/TypeScript example in the Bedrock docs showing a browser-captured image sent through Converse, calling out the bytes requirement.
