/**
 * Post-build step for the backend: mark the compiled dist/ output as CommonJS
 * so `node dist/index.js` runs correctly even though the root package.json is
 * an ES module ("type": "module") for the Vite frontend.
 */
const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');
fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(
  path.join(distDir, 'package.json'),
  JSON.stringify({ type: 'commonjs' }, null, 2) + '\n',
);
console.log('postbuild: wrote dist/package.json ({ type: "commonjs" })');
