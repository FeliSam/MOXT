import { describe, expect, it } from 'vitest'
import {
  buildNewsFeed,
  isPinnedPost,
  isWelcomePost,
  postMatchesDisplayLanguage,
} from './postFeedUtils'

describe('postFeedUtils', () => {
  const welcome = {
    id: 'welcome',
    status: 'published',
    sourceType: 'free',
    directLink: '/news',
    message: 'Bienvenue sur MOXT',
    createdAt: '2026-01-01T00:00:00.000Z',
  }

  const frenchPost = {
    id: 'fr-post',
    status: 'published',
    sourceType: 'free',
    language: 'fr',
    message: 'Salut',
    createdAt: '2026-07-01T00:00:00.000Z',
  }

  const englishPost = {
    id: 'en-post',
    status: 'published',
    sourceType: 'free',
    language: 'en',
    message: 'Hello',
    createdAt: '2026-07-02T00:00:00.000Z',
  }

  it('detects the welcome post without forcing pin state', () => {
    expect(isWelcomePost(welcome)).toBe(true)
    expect(isPinnedPost(welcome)).toBe(false)
    expect(isPinnedPost({ ...welcome, pinned: true })).toBe(true)
  })

  it('filters posts by display language but keeps welcome and legacy posts', () => {
    const legacy = { ...frenchPost, id: 'legacy', language: undefined }
    expect(postMatchesDisplayLanguage(frenchPost, 'fr')).toBe(true)
    expect(postMatchesDisplayLanguage(englishPost, 'fr')).toBe(false)
    expect(postMatchesDisplayLanguage(legacy, 'en')).toBe(true)
    expect(postMatchesDisplayLanguage(welcome, 'en')).toBe(true)
  })

  it('keeps welcome visible across languages even when unpinned', () => {
    const feed = buildNewsFeed([englishPost, frenchPost, welcome], {
      language: 'en',
      sourceTypeFilter: 'all',
    })
    expect(feed.some((post) => post.id === 'welcome')).toBe(true)
    expect(feed.some((post) => post.id === 'en-post')).toBe(true)
    expect(feed.some((post) => post.id === 'fr-post')).toBe(false)
  })

  it('puts DB-pinned posts first', () => {
    const pinned = {
      ...englishPost,
      id: 'pinned-en',
      pinned: true,
      createdAt: '2026-06-01T00:00:00.000Z',
    }
    const feed = buildNewsFeed([frenchPost, englishPost, pinned, welcome], {
      language: 'en',
      sourceTypeFilter: 'all',
    })
    expect(feed[0].id).toBe('pinned-en')
    expect(feed.map((post) => post.id)).toContain('welcome')
  })

  it('hides linked posts whose catalog source is unavailable', () => {
    const linked = {
      id: 'job-post',
      status: 'published',
      sourceType: 'job',
      sourceId: 'J1',
      language: 'en',
      createdAt: '2026-07-03T00:00:00.000Z',
    }
    const feed = buildNewsFeed([englishPost, linked], {
      language: 'en',
      catalogs: { jobs: [{ id: 'J1', status: 'expired' }] },
    })
    expect(feed.map((post) => post.id)).toEqual(['en-post'])
  })
})
