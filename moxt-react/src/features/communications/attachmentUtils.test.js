import { describe, expect, it } from 'vitest'
import {
  attachmentSearchText,
  MAX_MESSAGE_IMAGES,
  MESSAGE_IMAGE_STACK_ANGLE_STEP,
  messageImageStackRotation,
} from './attachmentUtils.js'

describe('messageImageStackRotation', () => {
  it('applique un pas angulaire constant', () => {
    expect(MESSAGE_IMAGE_STACK_ANGLE_STEP).toBe(12)
    expect(MAX_MESSAGE_IMAGES).toBe(4)
    expect([0, 1, 2, 3].map((i) => messageImageStackRotation(i))).toEqual([0, 12, 24, 36])
  })

  it('inverse le sens pour les messages envoyés', () => {
    expect([0, 1, 2, 3].map((i) => messageImageStackRotation(i, { sent: true }))).toEqual([
      0, -12, -24, -36,
    ])
  })
})

describe('attachmentSearchText', () => {
  it('inclut le nom de fichier', () => {
    expect(attachmentSearchText({ name: 'devis.pdf', type: 'application/pdf' })).toContain('devis.pdf')
  })
})
