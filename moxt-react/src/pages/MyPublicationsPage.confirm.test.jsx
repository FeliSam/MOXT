import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfirmDialogProvider } from '../contexts/ConfirmDialogProvider'
import { deleteListing, updateListingStatus } from '../features/marketplace/marketplaceSlice'
import { MyPublicationsPage } from './MyPublicationsPage'

vi.mock('../contexts/useLanguage', async () => {
  const { fr } = await import('@moxt/shared/i18n/locales/fr.js')
  const t = (key, vars = {}) => {
    const value = key.split('.').reduce((node, part) => (node == null ? node : node[part]), fr)
    if (typeof value !== 'string') return key
    return value.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m))
  }
  return { useLanguage: () => ({ language: 'fr', t }) }
})
vi.mock('../features/publications/usePublicationProfile', () => ({
  usePublicationProfile: () => ({ profile: null }),
}))
vi.mock('../features/reviews/useScopedTargetReviews', () => ({
  useScopedProfileReviews: () => ({ rating: null, reviews: [] }),
}))
vi.mock('../features/stars/useStarsModuleEnabled', () => ({ useStarsModuleEnabled: () => false }))
vi.mock('../features/stars/starsSlice', () => ({ loadFeedBoosts: () => ({ type: 'test/loadFeedBoosts' }) }))
vi.mock('../features/publications/coverBanners/useOwnerCoverStyleEdit', () => ({
  useOwnerCoverStyleEdit: () => ({ open: false, closeEditor: () => {}, openEditor: () => {} }),
}))
vi.mock('../features/publications/coverBanners/CoverStylePicker', () => ({ CoverStylePicker: () => null }))
vi.mock('../features/share/ProfileQrShareButton', () => ({ ProfileQrShareButton: () => null }))
vi.mock('../features/publications/PublicProfileHero', () => ({
  PublicProfileHero: ({ actions }) => <div data-testid="hero">{actions}</div>,
}))

const USER = { id: 'user-1', firstName: 'Ada', lastName: 'Lovelace', gender: 'female' }
const LISTING = {
  id: 'ANN-1',
  ownerId: USER.id,
  title: 'Casque audio sans fil',
  type: 'product',
  category: 'Telephone',
  price: 4500,
  currency: 'RUB',
  city: 'Moscou',
  status: 'active',
  images: [],
  favorites: [],
  createdAt: '2026-08-02T10:00:00.000Z',
}

let actions = []

function renderPage() {
  const state = {
    auth: { user: USER },
    businesses: { items: [], members: [], documents: [], requests: [] },
    stars: { feedBoosts: [], balance: null },
    account: { preferences: {}, subscriptions: [], subscriberBans: [], favorites: [] },
    marketplace: { items: [LISTING] },
    parcels: { items: [] },
    jobs: { items: [] },
    events: { items: [] },
    p2p: { offers: [] },
    videos: { items: [] },
    posts: { items: [] },
    communications: { conversations: [] },
    reviews: { items: [] },
    ui: { toasts: [] },
  }
  const recorder = () => (next) => (action) => {
    actions.push(action)
    return next(action)
  }
  const store = configureStore({
    reducer: (s = state) => s,
    middleware: (getDefault) =>
      getDefault({ serializableCheck: false, immutableCheck: false }).concat(recorder),
  })
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/publications/mine']}>
        <ConfirmDialogProvider>
          <MyPublicationsPage />
        </ConfirmDialogProvider>
      </MemoryRouter>
    </Provider>,
  )
}

const ofType = (creator) => actions.filter((action) => action.type === creator.type)

describe('MyPublicationsPage — modales de confirmation', () => {
  beforeEach(() => {
    actions = []
  })

  it('Supprimer : la modale s’ouvre, Annuler n’exécute rien, Confirmer supprime une fois', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Supprimer cette publication ?')).toBeTruthy()
    expect(within(dialog).getByText('Casque audio sans fil')).toBeTruthy()
    expect(
      within(dialog).getByText('Elle disparaîtra définitivement de votre profil et du Marketplace.'),
    ).toBeTruthy()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(ofType(deleteListing)).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }))
    const again = await screen.findByRole('dialog')
    const confirmButton = within(again).getByRole('button', { name: 'Supprimer' })
    fireEvent.click(confirmButton)
    fireEvent.click(confirmButton)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(ofType(deleteListing)).toHaveLength(1)
    expect(ofType(deleteListing)[0].payload).toMatchObject({ id: 'ANN-1', ownerId: USER.id })
  })

  it('Archiver et Marquer comme vendu passent aussi par une modale (accent prune)', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Archiver' }))
    let dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Archiver cette publication ?')).toBeTruthy()
    expect(dialog.querySelector('[data-confirm-tone="accent"][data-profile-kind="personal"]')).toBeTruthy()
    expect(ofType(updateListingStatus)).toHaveLength(0)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Archiver' }))
    await waitFor(() => expect(ofType(updateListingStatus)).toHaveLength(1))
    expect(ofType(updateListingStatus)[0].payload).toMatchObject({ status: 'archived' })

    fireEvent.click(screen.getByRole('button', { name: /vendu/i }))
    dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Marquer comme vendu ?')).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(ofType(updateListingStatus)).toHaveLength(1)
  })

  it('Dupliquer demande confirmation avant de créer la copie', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Dupliquer' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Dupliquer cette publication ?')).toBeTruthy()
    expect(actions.some((action) => /duplicate/i.test(action.type || ''))).toBe(false)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Dupliquer' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(actions.filter((action) => /duplicate/i.test(action.type || ''))).toHaveLength(1)
  })
})