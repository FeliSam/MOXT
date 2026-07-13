import { describe, expect, it } from 'vitest'
import { isShellKey, partitionUploadItems } from './safe-deploy.mjs'

describe('safe-deploy', () => {
  it('sépare les fichiers shell des assets', () => {
    const items = [
      { key: 'assets/index-abc.js', file: '/tmp/assets/index-abc.js' },
      { key: 'index.html', file: '/tmp/index.html' },
      { key: 'icons/icon.svg', file: '/tmp/icons/icon.svg' },
      { key: 'sw.js', file: '/tmp/sw.js' },
    ]

    const { staged, shell } = partitionUploadItems(items)
    expect(staged.map((item) => item.key)).toEqual(['assets/index-abc.js', 'icons/icon.svg'])
    expect(shell.map((item) => item.key)).toEqual(['index.html', 'sw.js'])
  })

  it('identifie les clés shell', () => {
    expect(isShellKey('index.html')).toBe(true)
    expect(isShellKey('assets/app.js')).toBe(false)
  })
})
