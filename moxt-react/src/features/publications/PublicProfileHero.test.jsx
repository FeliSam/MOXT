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

  it('renders the prune-rose default for personal female', () => {
    const { container } = render(
      <PublicProfileHero name="Awa" coverCategory="personal" gender="female" />,
    )
    expect(container.querySelector('[data-cover-style="woman-d-prune"]')).toBeTruthy()
  })

  it('renders the prune-night default when gender unknown', () => {
    const { container } = render(
      <PublicProfileHero name="Sam" coverCategory="personal" />,
    )
    expect(container.querySelector('[data-cover-style="man-d-prune"]')).toBeTruthy()
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

describe('PublicProfileHero profile kind', () => {
  it('personal : avatar rond avec anneau + chip « Particulier »', () => {
    const { container } = render(
      <PublicProfileHero
        name="Рикардо Оке"
        coverCategory="personal"
        profileKind="personal"
        kindLabel="Particulier"
      />,
    )
    expect(screen.getByText('Particulier')).toBeTruthy()
    expect(container.querySelector('[data-profile-kind-chip="personal"]')).toBeTruthy()
    const initials = screen.getByText('РИ')
    expect(initials.className).toMatch(/rounded-full/)
  })

  it('business : logo carré arrondi + chip « Entreprise »', () => {
    render(
      <PublicProfileHero
        name="Moxt Services"
        coverCategory="business"
        profileKind="business"
        kindLabel="Entreprise"
      />,
    )
    expect(screen.getByText('Entreprise')).toBeTruthy()
    expect(screen.getByText('MO').className).toMatch(/rounded-\[1\.15rem\]/)
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
