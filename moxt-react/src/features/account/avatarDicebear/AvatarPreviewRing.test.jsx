import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AvatarPreviewRing } from './AvatarPreviewRing'

describe('AvatarPreviewRing', () => {
  it('affiche une image distante (portrait CDN) après chargement', () => {
    render(<AvatarPreviewRing src="https://cdn.moxt.test/portraits/f-3-2.jpg" alt="Aperçu" />)
    const img = screen.getByAltText('Aperçu')
    expect(img.getAttribute('src')).toBe('https://cdn.moxt.test/portraits/f-3-2.jpg')
    expect(img.className).toContain('opacity-0')
    fireEvent.load(img)
    expect(img.className).toContain('opacity-100')
  })

  it('affiche immédiatement un data-URI SVG', () => {
    render(<AvatarPreviewRing src="data:image/svg+xml;utf8,%3Csvg%3E%3C/svg%3E" alt="Aperçu" />)
    expect(screen.getByAltText('Aperçu').className).toContain('opacity-100')
  })
})
