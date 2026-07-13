import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { moxtBuildVersion } from './vite-plugin-build-version.mjs'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.resolve(rootDir, '..')
const sharedRoot = path.resolve(monorepoRoot, 'packages/shared/src')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')
  const supabaseUrl =
    env.VITE_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL
  const supabaseAnonKey =
    env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (mode === 'production' && (!supabaseUrl || !supabaseAnonKey)) {
    throw new Error(
      'Build production : définissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (pas de clés en dur).',
    )
  }

  const resolvedSupabaseUrl = supabaseUrl || 'https://rbvqfkccbkwjxkvpnwqn.supabase.co'
  const resolvedSupabaseAnonKey =
    supabaseAnonKey ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJidnFma2NjYmt3anhrdnBud3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NjI2NDMsImV4cCI6MjA5ODIzODY0M30.ZpAr5eEnxoxy3TQ4hIA3SoX1NTuPg-0pt4UQ2mS5lDI'

  return {
  // Chemins absolus requis pour le SPA hébergé sur Yandex (QR, /invite/, publications invité).
  base: '/',
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(resolvedSupabaseUrl),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(resolvedSupabaseAnonKey),
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
    moxtBuildVersion({ rootDir }),
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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('@reduxjs') || id.includes('react-redux') || id.includes('redux')) {
            return 'redux'
          }
          if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    globals: true,
    setupFiles: './src/test/setup.js',
  },
}})
