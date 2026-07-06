const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const rootNodeModules = path.resolve(workspaceRoot, 'node_modules');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  rootNodeModules,
];
config.resolver.disableHierarchicalLookup = false;

// Packages hoistés à la racine du monorepo
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  nativewind: path.join(rootNodeModules, 'nativewind'),
  'react-native-css-interop': path.join(rootNodeModules, 'react-native-css-interop'),
  tailwindcss: path.join(rootNodeModules, 'tailwindcss'),
};

module.exports = withNativeWind(config, { input: './global.css' });
