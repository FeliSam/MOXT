import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'android',
    'ios',
    '.npm-cache',
    '.playwright-browsers',
    'playwright-report',
    'test-results',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      // Constantes injectées au build par vite-plugin-build-version.mjs.
      globals: {
        ...globals.browser,
        __MOXT_BUILD_ID__: 'readonly',
        __MOXT_APP_VERSION__: 'readonly',
      },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' }],
      // Confort de développement (Fast Refresh) uniquement, aucun impact en
      // production : quelques helpers restent volontairement co-localisés avec
      // leur composant. Signalé, mais ne bloque pas la CI.
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    files: ['playwright.config.js', 'scripts/**/*.js', 'scripts/**/*.mjs', 'vite.config.js', 'vite-plugin-*.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.test.{js,jsx}'],
    languageOptions: {
      // `global` (Node) sert à poser des stubs type ResizeObserver en test.
      globals: { ...globals.browser, ...globals.vitest, global: 'writable' },
    },
  },
])
