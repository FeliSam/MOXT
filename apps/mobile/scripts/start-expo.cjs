/**
 * Lance Expo depuis apps/mobile avec la racine projet correcte.
 *
 * EXPO_NO_METRO_WORKSPACE_ROOT n'est plus utilisé : avec ce flag, l'URL du
 * bundle générée par @expo/cli pointe vers `../../node_modules/expo-router/entry`
 * (expo-router est hoisté à la racine du monorepo). Le serveur HTTP de Metro
 * normalise les segments ".." dans l'URL de requête, ce qui casse la résolution
 * (404 "Unable to resolve module") pour Expo Go comme pour le web. Laisser
 * @expo/cli détecter la racine du monorepo évite cette normalisation cassée :
 * le bundle est alors servi via `/node_modules/expo-router/entry.bundle`.
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(projectRoot, '../..');
const mobileNodeModules = path.join(projectRoot, 'node_modules');
const rootNodeModules = path.join(monorepoRoot, 'node_modules');
const mobileExpoCli = path.join(mobileNodeModules, 'expo', 'bin', 'cli');
const rootExpoCli = path.join(rootNodeModules, 'expo', 'bin', 'cli');
const expoCli = require('fs').existsSync(mobileExpoCli) ? mobileExpoCli : rootExpoCli;

process.env.EXPO_DOCTOR_SKIP_DEPENDENCY_VERSION_CHECK = '1';

const existingNodeOptions = process.env.NODE_OPTIONS || '';
if (!existingNodeOptions.includes('--max-old-space-size')) {
  process.env.NODE_OPTIONS = `${existingNodeOptions} --max-old-space-size=8192`.trim();
}

const args = ['start', ...process.argv.slice(2)];
const result = spawnSync(process.execPath, ['--max-old-space-size=8192', expoCli, ...args], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
