import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.resolve(rootDir, '..')
const sharedRoot = path.resolve(monorepoRoot, 'packages/shared/src')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')
  const supabaseUrl =
    env.VITE_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    'https://rbvqfkccbkwjxkvpnwqn.supabase.co'
  const supabaseAnonKey =
    env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    ''

  return {
  base: './',
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-redux'],
    alias: {
      // Monorepo : mobile (NativeWind) hoist tailwindcss v3 à la racine ;
      // le web utilise Tailwind v4 via @import 'tailwindcss' → index.css
      tailwindcss: path.join(rootDir, 'node_modules/tailwindcss'),
      react: path.join(monorepoRoot, 'node_modules/react'),
      'react-dom': path.join(monorepoRoot, 'node_modules/react-dom'),
    },
    conditions: ['import', 'module', 'browser', 'development', 'default'],
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'moxt-shared-subpath-alias',
      resolveId(source) {
        if (source === '@moxt/shared') {
          return path.join(sharedRoot, 'index.js')
        }
        if (source.startsWith('@moxt/shared/')) {
          return path.join(sharedRoot, source.slice('@moxt/shared/'.length))
        }
        return null
      },
    },
  ],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: '127.0.0.1',
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    globals: true,
    setupFiles: './src/test/setup.js',
  },
}})
