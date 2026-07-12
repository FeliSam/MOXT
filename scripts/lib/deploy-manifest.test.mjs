import { describe, expect, it } from 'vitest'
import { diffDeployManifests } from './deploy-manifest.mjs'

describe('deploy-manifest', () => {
  it('signale les fichiers nouveaux ou modifies', () => {
    const previous = {
      buildId: 'aaa',
      files: {
        'index.html': { size: 10, md5: 'old' },
        'assets/app.js': { size: 100, md5: 'same' },
      },
    }
    const current = {
      buildId: 'bbb',
      files: {
        'index.html': { size: 12, md5: 'new' },
        'assets/app.js': { size: 100, md5: 'same' },
        'version.json': { size: 40, md5: 'v1' },
      },
    }

    expect(diffDeployManifests(previous, current).sort()).toEqual(['index.html', 'version.json'])
    expect(diffDeployManifests(null, current).length).toBe(3)
  })
})
