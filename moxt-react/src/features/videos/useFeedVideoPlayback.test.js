import { describe, expect, it } from 'vitest'
import { primeFeedVideoElement, useFeedVideoPlayback } from './useFeedVideoPlayback.js'

describe('primeFeedVideoElement', () => {
  it('pose playsinline pour l’autoplay iOS WKWebView', () => {
    const el = document.createElement('video')
    primeFeedVideoElement(el)
    expect(el.playsInline).toBe(true)
    expect(el.getAttribute('playsinline')).not.toBeNull()
    expect(el.getAttribute('webkit-playsinline')).not.toBeNull()
  })
})

describe('useFeedVideoPlayback', () => {
  it('exporte un hook de lecture (smoke)', () => {
    expect(typeof useFeedVideoPlayback).toBe('function')
  })
})
