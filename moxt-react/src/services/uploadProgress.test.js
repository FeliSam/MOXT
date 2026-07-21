import { describe, expect, it, vi } from 'vitest'
import {
  clampPercent,
  fileSliceProgress,
  reportProgress,
  shortenFileName,
  UPLOAD_PHASES,
} from './uploadProgress.js'

describe('uploadProgress', () => {
  it('raccourcit les noms de fichiers trop longs', () => {
    expect(shortenFileName('short.jpg')).toBe('short.jpg')
    expect(shortenFileName('a'.repeat(40) + '.png', 20)).toMatch(/^a{8,}…\.png$/)
    expect(shortenFileName('a'.repeat(40) + '.png', 20).length).toBeLessThanOrEqual(20)
  })

  it('borne le pourcentage entre 0 et 100', () => {
    expect(clampPercent(-5)).toBe(0)
    expect(clampPercent(140)).toBe(100)
    expect(clampPercent(42.6)).toBe(43)
  })

  it('répartit la progression sur plusieurs fichiers', () => {
    expect(fileSliceProgress(0, 2, 100)).toBe(50)
    expect(fileSliceProgress(1, 2, 100)).toBe(100)
  })

  it('notifie les phases via onProgress', () => {
    const onProgress = vi.fn()
    reportProgress(onProgress, { phase: UPLOAD_PHASES.uploading, percent: 55, fileName: 'a.jpg' })
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: 'uploading',
        percent: 55,
        fileName: 'a.jpg',
      }),
    )
  })
})
