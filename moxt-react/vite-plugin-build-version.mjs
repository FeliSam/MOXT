import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

function resolveBuildId() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 12)
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return Date.now().toString(36)
  }
}

/** Injecte __MOXT_BUILD_ID__ et écrit dist/version.json à chaque build. */
export function moxtBuildVersion({ rootDir }) {
  const buildId = resolveBuildId()

  return {
    name: 'moxt-build-version',
    config() {
      return {
        define: {
          __MOXT_BUILD_ID__: JSON.stringify(buildId),
        },
      }
    },
    closeBundle() {
      const meta = {
        buildId,
        builtAt: new Date().toISOString(),
      }
      const distDir = path.join(rootDir, 'dist')
      mkdirSync(distDir, { recursive: true })
      writeFileSync(
        path.join(distDir, 'version.json'),
        `${JSON.stringify(meta, null, 2)}\n`,
        'utf8',
      )
    },
  }
}
