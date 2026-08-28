import { describe, expect, it } from 'vitest'
import {
  buildVideoObjectKey,
  guessVideoMimeFromExt,
  isActiveVideo,
  isAllowedVideoFile,
  isArchivedVideo,
  isWebSafeVideoContainer,
  pickInitialVideoIndex,
  selectActiveVideos,
  videoFileExtension,
} from './videoUtils'

describe('videoUtils', () => {
  it('buildVideoObjectKey normalise business et id', () => {
    expect(buildVideoObjectKey('BIZ-1', 'VID-abc', 'mp4')).toBe('BIZ-1/VID-abc.mp4')
    expect(buildVideoObjectKey('biz/x', 'vid@1', 'webm')).toBe('biz_x/vid_1.webm')
  })

  it('accepte les formats iPhone / Android', () => {
    expect(isAllowedVideoFile({ name: 'clip.MOV', type: 'video/quicktime' })).toBe(true)
    expect(isAllowedVideoFile({ name: 'clip.mov', type: '' })).toBe(true)
    expect(isAllowedVideoFile({ name: 'clip.mp4', type: 'video/mp4' })).toBe(true)
    expect(isAllowedVideoFile({ name: 'clip.3gp', type: 'video/3gpp' })).toBe(true)
    expect(isAllowedVideoFile({ name: 'clip.mkv', type: 'video/x-matroska' })).toBe(true)
    expect(isAllowedVideoFile({ name: 'clip.avi', type: 'video/x-msvideo' })).toBe(false)
    expect(videoFileExtension({ name: 'IMG_1234.MOV', type: 'video/quicktime' })).toBe('mov')
    expect(videoFileExtension({ name: 'cam.mp4', type: 'video/mp4' })).toBe('mp4')
  })

  it('filtre actives et ordre created_at desc', () => {
    const items = [
      { id: 'a', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'b', status: 'archived', createdAt: '2026-02-01T00:00:00Z' },
      { id: 'c', status: 'active', createdAt: '2026-03-01T00:00:00Z' },
    ]
    expect(selectActiveVideos(items).map((v) => v.id)).toEqual(['c', 'a'])
    expect(isActiveVideo(items[0])).toBe(true)
    expect(isArchivedVideo(items[1])).toBe(true)
  })

  it('pickInitialVideoIndex honore ?v=', () => {
    const videos = [{ id: 'v1' }, { id: 'v2' }, { id: 'v3' }]
    expect(pickInitialVideoIndex(videos, 'v2')).toBe(1)
    expect(pickInitialVideoIndex(videos, 'missing')).toBe(0)
    expect(pickInitialVideoIndex([], 'v1')).toBe(0)
  })

  it('détecte les conteneurs web-safe', () => {
    expect(isWebSafeVideoContainer({ name: 'a.mp4', type: 'video/mp4' })).toBe(true)
    expect(isWebSafeVideoContainer({ name: 'a.webm', type: 'video/webm' })).toBe(true)
    expect(isWebSafeVideoContainer({ name: 'a.mov', type: 'video/quicktime' })).toBe(false)
    expect(guessVideoMimeFromExt('mov')).toBe('video/quicktime')
    expect(guessVideoMimeFromExt('webm')).toBe('video/webm')
  })
})
