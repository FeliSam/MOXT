import { afterEach, describe, expect, it } from 'vitest'
import { pauseAllDocumentMedia } from './mediaPlayback.js'

describe('pauseAllDocumentMedia', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it('met en pause toutes les balises video et audio', () => {
    const video = document.createElement('video')
    const audio = document.createElement('audio')
    video.pause = () => {
      video.dataset.paused = '1'
    }
    audio.pause = () => {
      audio.dataset.paused = '1'
    }
    document.body.append(video, audio)

    expect(pauseAllDocumentMedia()).toBe(2)
    expect(video.dataset.paused).toBe('1')
    expect(audio.dataset.paused).toBe('1')
  })
})
