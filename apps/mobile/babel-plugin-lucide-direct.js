/**
 * Réécrit `import { Heart } from 'lucide-react-native'` vers le fichier d’icône.
 * Le champ `react-native` du paquet pointe vers un baril qui réexporte les ~3500
 * icônes : Metro les embarque toutes et le bundle web reste bloqué vers 99,9 %.
 * Les alias (MoreHorizontal → ellipsis.mjs) viennent du baril, pas d’un kebab naïf.
 */
const fs = require('fs');
const path = require('path');

let iconFiles = null;

function iconFileFor(name) {
  if (!iconFiles) {
    iconFiles = new Map();
    const barrel = path.resolve(
      __dirname,
      '../../node_modules/lucide-react-native/dist/esm/lucide-react-native.mjs',
    );
    const source = fs.readFileSync(barrel, 'utf8');
    const re = /export \{([^}]+)\} from '\.\/icons\/([^']+)'/g;
    let match = re.exec(source);
    while (match) {
      const file = match[2];
      for (const part of match[1].split(',')) {
        const alias = part.trim().split(/\s+as\s+/).pop();
        if (alias) iconFiles.set(alias, file);
      }
      match = re.exec(source);
    }
  }
  return iconFiles.get(name) || null;
}

module.exports = function lucideDirectPlugin({ types: t }) {
  return {
    name: 'lucide-direct',
    visitor: {
      ImportDeclaration(path) {
        if (path.node.source.value !== 'lucide-react-native') return;
        if (path.node.importKind === 'type') return;
        const kept = [];
        const next = [];
        for (const spec of path.node.specifiers) {
          if (spec.type !== 'ImportSpecifier' || spec.importKind === 'type') {
            kept.push(spec);
            continue;
          }
          const imported = spec.imported.name;
          const file = iconFileFor(imported);
          if (!file) {
            kept.push(spec);
            continue;
          }
          next.push(
            t.importDeclaration(
              [t.importDefaultSpecifier(t.identifier(spec.local.name))],
              t.stringLiteral(`lucide-react-native/dist/esm/icons/${file}`),
            ),
          );
        }
        if (!next.length) return;
        if (kept.length) {
          path.node.specifiers = kept;
          path.insertAfter(next);
        } else {
          path.replaceWithMultiple(next);
        }
      },
    },
  };
};
