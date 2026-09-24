import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PublicProfileHero } from './PublicProfileHero'

describe('PublicProfileHero empty cover', () => {
  it('renders editorial-dark fallback when business has no cover', () => {
    const { container } = render(
      <PublicProfileHero name="RO2-SERVICES" emptyCoverVariant="editorial-dark" />,
    )
    expect(container.querySelector('[data-cover-style="editorial-dark"]')).toBeTruthy()
    expect(screen.getByText('Moxt')).toBeTruthy()
    expect(screen.getByText('Business')).toBeTruthy()
  })

  it('keeps real banner image when coverUrl is set', () => {
    const { container } = render(
      <PublicProfileHero
        name="With Banner"
        coverUrl="https://cdn.example/banner.jpg"
        emptyCoverVariant="editorial-dark"
      />,
    )
    const img = container.querySelector('img[alt="With Banner"]')
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toContain('banner.jpg')
    const fallback = container.querySelector('[data-cover-style="editorial-dark"]')
    expect(fallback?.className).toMatch(/\bhidden\b/)
  })

  it('defaults to legacy gradient for non-business profiles', () => {
    const { container } = render(<PublicProfileHero name="User" />)
    expect(container.querySelector('[data-cover-style="editorial-dark"]')).toBeNull()
    expect(container.querySelector('.from-brand-700')).toBeTruthy()
  })
})
