import { describe, expect, it } from 'vitest'
import { storageService } from './storageService'

describe('storageService document path helpers', () => {
  it('extrait le chemin depuis une URL signee documents', () => {
    const url =
      'https://xyz.supabase.co/storage/v1/object/sign/documents/user-1/identity-123.pdf?token=abc'
    expect(storageService.extractDocumentsPath(url)).toBe('user-1/identity-123.pdf')
  })

  it('conserve un chemin relatif deja normalise', () => {
    expect(storageService.extractDocumentsPath('user-1/selfie-9.jpg')).toBe('user-1/selfie-9.jpg')
  })
})
