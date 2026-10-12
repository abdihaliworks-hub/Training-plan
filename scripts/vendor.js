// Copies third-party runtime files from node_modules into www/vendor so the
// app (web and Android) works fully offline: OCR engine, OCR language data, fonts.
// Run after `npm install`:  npm run vendor
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const nm = p => path.join(root, 'node_modules', p);
const out = p => path.join(root, 'www', 'vendor', p);

const files = {
  // OCR engine (tesseract.js) — core is picked at runtime (SIMD if supported)
  'tesseract/tesseract.min.js': 'tesseract.js/dist/tesseract.min.js',
  'tesseract/worker.min.js': 'tesseract.js/dist/worker.min.js',
  'tesseract/core/tesseract-core-lstm.wasm.js': 'tesseract.js-core/tesseract-core-lstm.wasm.js',
  'tesseract/core/tesseract-core-simd-lstm.wasm.js': 'tesseract.js-core/tesseract-core-simd-lstm.wasm.js',
  // OCR language data: English + Norwegian nutrition labels
  'tesseract/lang/eng.traineddata.gz': '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz',
  'tesseract/lang/nor.traineddata.gz': '@tesseract.js-data/nor/4.0.0_best_int/nor.traineddata.gz',
  // Capacitor runtime — only used when running inside the Android app
  'capacitor.js': '@capacitor/core/dist/capacitor.js',
  // Fonts
  'fonts/archivo-600.woff2': '@fontsource/archivo/files/archivo-latin-600-normal.woff2',
  'fonts/archivo-800.woff2': '@fontsource/archivo/files/archivo-latin-800-normal.woff2',
  'fonts/plex-mono-400.woff2': '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
  'fonts/plex-mono-600.woff2': '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2',
  'fonts/plex-sans-400.woff2': '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2',
  'fonts/plex-sans-500.woff2': '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2',
  'fonts/plex-sans-600.woff2': '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2'
};

for (const [dest, src] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(out(dest)), { recursive: true });
  fs.copyFileSync(nm(src), out(dest));
}
console.log('Vendored ' + Object.keys(files).length + ' files into www/vendor');
