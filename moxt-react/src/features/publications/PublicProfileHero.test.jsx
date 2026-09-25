import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PublicProfileHero } from './PublicProfileHero'
import { COVER_STYLE_IDS } from './coverBanners/coverBannerCatalog'

describe('PublicProfileHero empty cover', () => {
  it('renders business editorial-dark fallback when no cover', () => {
    const { container } = render(
      <PublicProfileHero
        name="RO2-SERVICES"
        emptyCoverVariant="editorial-dark"
        coverCategory="business"
      />,
    )
    expect(
      container.querySelector('[data-cover-style="editorial-dark"], [data-cover-style="business-b-editorial"]'),
    ).toBeTruthy()
    expect(screen.getByText('Moxt')).toBeTruthy()
  })

  it('renders selected business glass style', () => {
    const { container } = render(
      <PublicProfileHero
        name="Glass Co"
        coverCategory="business"
        coverStyle={COVER_STYLE_IDS.BUSINESS_C_GLASS}
      />,
    )
    expect(container.querySelector('[data-cover-style="business-c-glass"]')).toBeTruthy()
  })

  it('renders woman silk default for personal female', () => {
    const { container } = render(
      <PublicProfileHero name="Awa" coverCategory="personal" gender="female" />,
    )
    expect(container.querySelector('[data-cover-style="woman-a-silk"]')).toBeTruthy()
  })

  it('renders man steel default when gender unknown', () => {
    const { container } = render(
      <PublicProfileHero name="Sam" coverCategory="personal" />,
    )
    expect(container.querySelector('[data-cover-style="man-a-steel"]')).toBeTruthy()
  })

  it('keeps real banner image when coverUrl is set', () => {
    const { container } = render(
      <PublicProfileHero
        name="With Banner"
        coverUrl="https://cdn.example/banner.jpg"
        emptyCoverVariant="editorial-dark"
        coverCategory="business"
      />,
    )
    const img = container.querySelector('img[alt="With Banner"]')
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toContain('banner.jpg')
    const fallback = container.querySelector(
      '[data-cover-style="editorial-dark"], [data-cover-style="business-b-editorial"]',
    )
    expect(fallback?.className).toMatch(/\bhidden\b/)
  })

  it('shows owner edit cover control when showCoverEdit is set', () => {
    const { container } = render(
      <PublicProfileHero
        name="Owner Biz"
        coverCategory="business"
        showCoverEdit
        onEditCover={() => {}}
        editCoverLabel="Modifier la bannière"
      />,
    )
    expect(container.querySelector('button')?.textContent).toMatch(/Modifier la banni/)
  })

  it('hides edit cover control for non-owners', () => {
    render(
      <PublicProfileHero name="Public" coverCategory="business" />,
    )
    expect(screen.queryByText('Modifier la bannière')).toBeNull()
  })
})

describe('PublicProfileHero star rating', () => {
  it('calls onOpenReviews when the star rating row is clicked', () => {
    const onOpenReviews = vi.fn()
    render(
      <PublicProfileHero
        name="Rated Biz"
        coverCategory="business"
        rating={{ average: 4.5, count: 12 }}
        reviewsLabel="avis"
        onOpenReviews={onOpenReviews}
      />,
    )
    const button = screen.getByRole('button', { name: /Voir les avis/i })
    fireEvent.click(button)
    expect(onOpenReviews).toHaveBeenCalledTimes(1)
  })

  it('does not render a clickable rating control when count is 0', () => {
    render(
      <PublicProfileHero
        name="No Reviews"
        coverCategory="business"
        rating={{ average: 0, count: 0 }}
        onOpenReviews={() => {}}
      />,
    )
    expect(screen.queryByRole('button', { name: /Voir les avis/i })).toBeNull()
  })

  it('keeps rating non-clickable when onOpenReviews is omitted', () => {
    render(
      <PublicProfileHero
        name="Static Rating"
        coverCategory="business"
        rating={{ average: 4, count: 3 }}
        reviewsLabel="avis"
      />,
    )
    expect(screen.queryByRole('button', { name: /Voir les avis/i })).toBeNull()
    expect(screen.getByText(/4,0/)).toBeTruthy()
  })
})
