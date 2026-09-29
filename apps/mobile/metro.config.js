const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const fs = require('fs');
const os = require('os');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const rootNodeModules = path.resolve(workspaceRoot, 'node_modules');

const config = getDefaultConfig(projectRoot);

// Ne pas indexer l'app Vite (moxt-react) : des milliers de modules inutiles
// font gonfler la mémoire de Metro et le bundle web reste vers 99,9 %.
config.watchFolders = [
  path.resolve(workspaceRoot, 'packages'),
  rootNodeModules,
];
const webOnlyBlocks = [
  /\/moxt-react\/src\/.*/,
  /\/moxt-react\/node_modules\/.*/,
  /\/moxt-react\/dist\/.*/,
];
if (Array.isArray(config.resolver.blockList)) {
  config.resolver.blockList = config.resolver.blockList.concat(webOnlyBlocks);
} else if (config.resolver.blockList) {
  config.resolver.blockList = [config.resolver.blockList, ...webOnlyBlocks];
} else {
  config.resolver.blockList = webOnlyBlocks;
}
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

function webShadowShim(sourceFile) {
  const target = path.join(os.tmpdir(), 'moxt-parseDeclaration.web.js');
  if (!fs.existsSync(target)) {
    const source = fs.readFileSync(sourceFile, 'utf8');
    const patched = source.replace(
      `function parseBoxShadow(boxShadows, options) {
    if (boxShadows.length > 1) {
        options.addValueWarning("multiple box shadows");
        return;
    }
    const boxShadow = boxShadows[0];
    options.addStyleProp("shadowColor", parseColor(boxShadow.color, options));
    options.addStyleProp("shadowRadius", parseLength(boxShadow.spread, options));
}`,
      `function parseBoxShadow(boxShadows, options) {
    if (!boxShadows || !boxShadows.length) return;
    const pieces = [];
    for (const boxShadow of boxShadows) {
        const color = parseColor(boxShadow.color, options) || "rgba(0,0,0,0.12)";
        const x = parseLength(boxShadow.xOffset, options) || 0;
        const y = parseLength(boxShadow.yOffset, options) || 0;
        const blur = parseLength(boxShadow.blur, options) || 0;
        const spread = parseLength(boxShadow.spread, options) || 0;
        pieces.push(x + "px " + y + "px " + blur + "px " + spread + "px " + color);
    }
    options.addStyleProp("boxShadow", pieces.join(", "));
}`,
    );
    fs.writeFileSync(target, patched);
  }
  return target;
}

const bundled = withNativeWind(config, { input: './global.css' });
const previousResolve = bundled.resolver.resolveRequest;
bundled.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolved = previousResolve
    ? previousResolve(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
  if (
    platform === 'web' &&
    resolved &&
    resolved.filePath &&
    resolved.filePath.includes(`${path.sep}react-native-css-interop${path.sep}`) &&
    resolved.filePath.endsWith(`${path.sep}parseDeclaration.js`)
  ) {
    return { type: 'sourceFile', filePath: webShadowShim(resolved.filePath) };
  }
  return resolved;
};

module.exports = bundled;
