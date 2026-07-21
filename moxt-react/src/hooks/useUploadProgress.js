import { useCallback, useRef, useState } from 'react'
import { clampPercent, UPLOAD_PHASES } from '../services/uploadProgress'

const IDLE = { active: false, phase: null, percent: 0, fileName: '', fileIndex: 0, fileCount: 0 }

/**
 * État de progression d’upload pour une page / un formulaire.
 * track(asyncFn) enveloppe un upload et expose `progress` pour <UploadProgress />.
 */
export function useUploadProgress() {
  const [progress, setProgress] = useState(IDLE)
  const generationRef = useRef(0)

  const reset = useCallback(() => {
    generationRef.current += 1
    setProgress(IDLE)
  }, [])

  const onProgress = useCallback((update) => {
    setProgress((current) => ({
      active: update.phase !== UPLOAD_PHASES.done && update.phase !== UPLOAD_PHASES.error,
      phase: update.phase || current.phase,
      percent: clampPercent(update.percent ?? current.percent),
      fileName: update.fileName ?? current.fileName,
      fileIndex: update.fileIndex ?? current.fileIndex,
      fileCount: update.fileCount ?? current.fileCount,
    }))
  }, [])

  const track = useCallback(
    async (work) => {
      const gen = ++generationRef.current
      setProgress({
        active: true,
        phase: UPLOAD_PHASES.preparing,
        percent: 4,
        fileName: '',
        fileIndex: 0,
        fileCount: 0,
      })
      try {
        const result = await work(onProgress)
        if (generationRef.current === gen) {
          setProgress((current) => ({
            ...current,
            active: false,
            phase: UPLOAD_PHASES.done,
            percent: 100,
          }))
          window.setTimeout(() => {
            if (generationRef.current === gen) setProgress(IDLE)
          }, 700)
        }
        return result
      } catch (error) {
        if (generationRef.current === gen) {
          setProgress((current) => ({
            ...current,
            active: false,
            phase: UPLOAD_PHASES.error,
            percent: current.percent || 0,
          }))
        }
        throw error
      }
    },
    [onProgress],
  )

  return { progress, track, reset, onProgress }
}
