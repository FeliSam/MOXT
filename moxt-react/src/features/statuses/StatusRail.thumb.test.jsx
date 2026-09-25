import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { describe, expect, it, vi } from 'vitest'
import { StatusRail } from './StatusRail'

vi.mock('../../contexts/useLanguage', () => ({
  useLanguage: () => ({ language: 'fr', t: (key) => key }),
}))
vi.mock('../../services/supabaseClient', () => ({ supabase: null }))
vi.mock('./statusSync', () => ({
  hydrateStatusRailIfEmpty: () => {},
  refreshStatusesData: () => ({ type: 'statuses/noop' }),
}))
vi.mock('./StatusViewer', () => ({ StatusViewer: () => null }))
vi.mock('./StatusComposer', () => ({ StatusComposer: () => null }))

const ME = { id: 'me', firstName: 'Nadia', avatarUrl: 'https://example.test/me.jpg' }
const future = new Date(Date.now() + 86_400_000).toISOString()

function renderRail(statuses) {
  const store = configureStore({
    reducer: {
      auth: () => ({ user: ME }),
      businesses: () => ({ items: [] }),
      statuses: () => ({ items: statuses }),
    },
  })
  return render(
    <Provider store={store}>
      <StatusRail />
    </Provider>,
  )
}

describe('StatusRail — miniature du dernier élément', () => {
  it('affiche la dernière image, un statut texte, et garde l’avatar pour « Vous » sans statut', () => {
    const { container } = renderRail([
      {
        id: 'S1',
        authorId: 'moxt',
        authorName: 'MOXT',
        authorAvatarUrl: 'https://example.test/logo.png',
        isOfficial: true,
        images: ['https://example.test/a.jpg', 'https://example.test/b.jpg'],
        createdAt: new Date().toISOString(),
        expiresAt: future,
      },
      {
        id: 'S2',
        authorId: 'ami',
        authorName: 'Ami',
        images: [],
        caption: 'Qui vient ce soir ?',
        createdAt: new Date().toISOString(),
        expiresAt: future,
      },
    ])
    const img = screen.getByTestId('status-thumb-image')
    expect(img.getAttribute('src')).toBe('https://example.test/b.jpg')
    expect(img.getAttribute('loading')).toBe('lazy')
    expect(screen.getByTestId('status-thumb-text').textContent).toBe('Qui vient ce soir ?')
    // « Vous » sans statut : photo + bouton « + ».
    expect(container.querySelector('img[src="https://example.test/me.jpg"]')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'status.rail.addYours' })).toBeTruthy()
    expect(screen.getByText('MOXT', { selector: 'span.line-clamp-1' })).toBeTruthy()
  })

  it('retombe sur le logo si la miniature ne charge pas', () => {
    const { container } = renderRail([
      {
        id: 'S1',
        authorId: 'moxt',
        authorName: 'MOXT',
        authorAvatarUrl: 'https://example.test/logo.png',
        images: ['https://example.test/broken.jpg'],
        createdAt: new Date().toISOString(),
        expiresAt: future,
      },
    ])
    fireEvent.error(screen.getByTestId('status-thumb-image'))
    expect(screen.queryByTestId('status-thumb-image')).toBeNull()
    expect(container.querySelector('img[src="https://example.test/logo.png"]')).toBeTruthy()
  })

  it('« Vous » avec un statut actif : dernière miniature + bouton « + »', () => {
    renderRail([
      {
        id: 'M1',
        authorId: 'me',
        authorName: 'Nadia',
        images: ['https://example.test/mine.jpg'],
        createdAt: new Date().toISOString(),
        expiresAt: future,
      },
    ])
    expect(screen.getByTestId('status-thumb-image').getAttribute('src')).toBe(
      'https://example.test/mine.jpg',
    )
    expect(screen.getByRole('button', { name: 'status.rail.addYours' })).toBeTruthy()
  })
})
