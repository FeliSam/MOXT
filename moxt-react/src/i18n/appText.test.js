import { beforeEach, describe, expect, it } from 'vitest'
import { appText, resolveAppLanguage } from './appText'

describe('appText', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = ''
  })

  it('falls back to fr when no language is set', () => {
    expect(resolveAppLanguage()).toBe('fr')
    expect(appText('toasts.reportSent')).toBe('Signalement envoyé')
  })

  it('uses document.documentElement.lang when present', () => {
    document.documentElement.lang = 'ru'
    expect(resolveAppLanguage()).toBe('ru')
    expect(appText('toasts.reportSent')).toBe('Жалоба отправлена')
  })

  it('falls back to localStorage when document lang is empty', () => {
    localStorage.setItem('moxt-language', 'en')
    expect(resolveAppLanguage()).toBe('en')
    expect(appText('toasts.listingPublished')).toBe('Listing published')
  })

  it('interpolates variables', () => {
    document.documentElement.lang = 'fr'
    expect(appText('toasts.transferTimelineMessage', { status: 'completed' })).toBe(
      "L'action « completed » a été ajoutée à la chronologie.",
    )
  })
})
