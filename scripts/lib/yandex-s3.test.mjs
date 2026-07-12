import { describe, expect, it } from 'vitest'
import { contentTypeForKey } from './yandex-s3.mjs'

describe('yandex-s3', () => {
  it('déduit le Content-Type depuis la clé objet', () => {
    expect(contentTypeForKey('index.html')).toBe('text/html; charset=utf-8')
    expect(contentTypeForKey('assets/app-abc123.js')).toBe('application/javascript; charset=utf-8')
    expect(contentTypeForKey('assets/style-abc123.css')).toBe('text/css; charset=utf-8')
    expect(contentTypeForKey('version.json')).toBe('application/json; charset=utf-8')
    expect(contentTypeForKey('manifest.webmanifest')).toBe('application/manifest+json; charset=utf-8')
    expect(contentTypeForKey('icons/favicon.ico')).toBe('image/x-icon')
    expect(contentTypeForKey('data/unknown.bin')).toBe('application/octet-stream')
  })
})
