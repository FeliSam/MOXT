import { describe, expect, it } from 'vitest'
import {
  buildBusinessDocumentPath,
  buildPersonalDocumentPath,
  storageService,
} from './storageService'

describe('storageService document path helpers', () => {
  it('extrait le chemin depuis une URL signee documents', () => {
    const url =
      'https://xyz.supabase.co/storage/v1/object/sign/documents/user-1/identity/123-file.pdf?token=abc'
    expect(storageService.extractDocumentsPath(url)).toBe('user-1/identity/123-file.pdf')
  })

  it('conserve un chemin relatif deja normalise', () => {
    expect(storageService.extractDocumentsPath('user-1/selfie/9.jpg')).toBe('user-1/selfie/9.jpg')
  })

  it('conserve un chemin dossier categorie entreprise', () => {
    expect(
      storageService.extractDocumentsPath('uid/business/BIZ-1/registration/1-statuts.pdf'),
    ).toBe('uid/business/BIZ-1/registration/1-statuts.pdf')
  })

  it('adresse perso avec dossier categorie sans deux-points', () => {
    const file = { name: 'Passeport.pdf' }
    expect(buildPersonalDocumentPath('uid-1', 'identity:passport', file, 1700000000000)).toBe(
      'uid-1/identity_passport/1700000000000-Passeport.pdf',
    )
  })

  it('adresse entreprise avec dossier categorie', () => {
    const file = { name: 'statuts (1).pdf' }
    expect(
      buildBusinessDocumentPath('uid-1', 'BIZ-ABC', 'registration', file, 1700000000000),
    ).toBe('uid-1/business/BIZ-ABC/registration/1700000000000-statuts_1_.pdf')
  })
})
