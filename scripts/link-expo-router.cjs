/**
 * expo-router reste dans apps/mobile/node_modules avec npm workspaces hoisted.
 * @expo/cli (racine) doit résoudre expo-router/_ctx-shared pour les typed routes.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'apps', 'mobile', 'node_modules', 'expo-router');
const link = path.join(root, 'node_modules', 'expo-router');

if (!fs.existsSync(source)) {
  process.exit(0);
}

if (fs.existsSync(link)) {
  process.exit(0);
}

fs.mkdirSync(path.dirname(link), { recursive: true });
fs.symlinkSync(source, link, 'junction');
