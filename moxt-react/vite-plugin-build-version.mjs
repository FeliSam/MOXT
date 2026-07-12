import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { buildDeployManifest } from '../scripts/lib/deploy-manifest.mjs'

function resolveBuildId() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 12)
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return Date.now().toString(36)
  }
}

/** Injecte buildId, manifest de déploiement et SW versionné à chaque build. */
export function moxtBuildVersion({ rootDir }) {
  const buildId = resolveBuildId()
  const swCacheId = `moxt-${buildId}`

  return {
    name: 'moxt-build-version',
    config() {
      return {
        define: {
          __MOXT_BUILD_ID__: JSON.stringify(buildId),
          __MOXT_SW_CACHE_ID__: JSON.stringify(swCacheId),
        },
      }
    },
    async closeBundle() {
      const distDir = path.join(rootDir, 'dist')
      mkdirSync(distDir, { recursive: true })

      const release = {
        buildId,
        builtAt: new Date().toISOString(),
        swCacheId,
        channel: process.env.MOXT_RELEASE_CHANNEL || 'production',
      }

      writeFileSync(path.join(distDir, 'version.json'), `${JSON.stringify(release, null, 2)}\n`, 'utf8')

      const manifest = await buildDeployManifest(distDir, buildId)
      writeFileSync(
        path.join(distDir, 'deploy-manifest.json'),
        `${JSON.stringify(manifest, null, 2)}\n`,
        'utf8',
      )

      const swSource = path.join(rootDir, 'public', 'sw.js')
      const swDest = path.join(distDir, 'sw.js')
      if (existsSync(swSource)) {
        const swBody = readFileSync(swSource, 'utf8').replaceAll('__MOXT_CACHE_NAME__', swCacheId)
        writeFileSync(swDest, swBody, 'utf8')
      } else if (existsSync(swDest)) {
        const swBody = readFileSync(swDest, 'utf8').replaceAll('__MOXT_CACHE_NAME__', swCacheId)
        writeFileSync(swDest, swBody, 'utf8')
      }
    },
  }
}
