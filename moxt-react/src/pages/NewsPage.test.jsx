import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NewsPage } from './NewsPage'

vi.mock('../contexts/useLanguage', () => ({
  useLanguage: () => ({
    language: 'fr',
    t: (key) => key,
  }),
}))

vi.mock('../features/security/useSecurityGate', () => ({
  useSecurityGate: () => ({
    requirePublish: () => false,
  }),
}))

vi.mock('../components/ui/ShareToFeedModal', () => ({
  ShareToFeedModal: () => null,
}))

vi.mock('../components/ui/FeedPostCard', () => ({
  FeedPostCard: ({ post }) => <article data-testid="feed-post">{post.id}</article>,
}))

function renderNews(posts) {
  const store = configureStore({
    reducer: {
      auth: () => ({ user: { id: 'u1', role: 'user', firstName: 'A', lastName: 'B' } }),
      posts: () => ({ items: posts }),
    },
  })
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <NewsPage />
      </MemoryRouter>
    </Provider>,
  )
}

describe('NewsPage', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { ...navigator, onLine: true })
  })

  it('renders welcome and regular posts without crashing', () => {
    renderNews([
      {
        id: 'welcome',
        status: 'published',
        sourceType: 'free',
        directLink: '/news',
        message: 'Bienvenue sur MOXT',
        pinned: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'p2',
        status: 'published',
        sourceType: 'free',
        language: 'fr',
        message: 'Salut',
        createdAt: '2026-07-01T00:00:00.000Z',
      },
    ])
    expect(screen.getAllByTestId('feed-post')).toHaveLength(2)
  })

  it('met en évidence la publication ciblée par ?post= (lien de notification)', () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView

    const store = configureStore({
      reducer: {
        auth: () => ({ user: { id: 'u1', role: 'user', firstName: 'A', lastName: 'B' } }),
        posts: () => ({
          items: [
            {
              id: 'p2',
              status: 'published',
              sourceType: 'free',
              language: 'fr',
              message: 'Salut',
              createdAt: '2026-07-01T00:00:00.000Z',
            },
          ],
        }),
      },
    })
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/news?post=p2']}>
          <NewsPage />
        </MemoryRouter>
      </Provider>,
    )

    expect(document.getElementById('news-post-p2')).toHaveClass('news-post-highlight')
    expect(scrollIntoView).toHaveBeenCalled()
  })
})
