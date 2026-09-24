import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { FeedPostCard } from './FeedPostCard'

vi.mock('../../contexts/useLanguage', () => ({
  useLanguage: () => ({
    language: 'fr',
    t: (key) => key,
  }),
}))

describe('FeedPostCard', () => {

  it('renders a pinned welcome post', () => {
    const store = configureStore({
      reducer: {
        auth: () => ({
          user: { id: 'u1', role: 'superadmin', firstName: 'A', lastName: 'B' },
        }),
      },
    })
    render(
      <Provider store={store}>
        <MemoryRouter>
          <FeedPostCard
            post={{
              id: 'welcome',
              status: 'published',
              sourceType: 'free',
              directLink: '/news',
              message: 'Bienvenue sur MOXT\n\n'.repeat(20),
              pinned: true,
              authorId: 'other',
              authorName: 'Feliciano Fanou',
              likes: [],
              comments: [],
              createdAt: '2026-01-01T00:00:00.000Z',
            }}
          />
        </MemoryRouter>
      </Provider>,
    )
    expect(screen.getByText(/Bienvenue sur MOXT/)).toBeTruthy()
    expect(screen.getByLabelText(/épinglée|Pinned|news\.pinned/i)).toBeTruthy()
  })

  it('renders a video Actualites card with play control', () => {
    const store = configureStore({
      reducer: {
        auth: () => ({
          user: { id: 'u1', role: 'user', firstName: 'A', lastName: 'B' },
        }),
        videos: () => ({ items: [] }),
      },
    })
    render(
      <Provider store={store}>
        <MemoryRouter>
          <FeedPostCard
            post={{
              id: 'VID-9',
              status: 'published',
              sourceType: 'video',
              sourceId: 'VID-9',
              message: 'Clip test',
              authorId: 'u2',
              authorName: 'Cafe MOXT',
              imageUrl: 'https://cdn.example/thumb.jpg',
              videoUrl: 'https://cdn.example/v.mp4',
              directLink: '/feed?type=video&item=video%3AVID-9',
              likes: [],
              comments: [],
              createdAt: '2026-07-04T00:00:00.000Z',
            }}
          />
        </MemoryRouter>
      </Provider>,
    )
    expect(screen.getByText('Clip test')).toBeTruthy()
    expect(screen.getByLabelText(/Lire la vid[eé]o|news\.feed\.playVideo/i)).toBeTruthy()
  })
})
