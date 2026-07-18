import { describe, expect, it } from 'vitest'
import { buildNewsFeed, isWelcomePost, postMatchesDisplayLanguage } from './postFeedUtils'

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

  it('detects the welcome post', () => {
    expect(isWelcomePost(welcome)).toBe(true)
    expect(isWelcomePost(frenchPost)).toBe(false)
  })

  it('filters posts by display language but keeps legacy posts', () => {
    const legacy = { ...frenchPost, id: 'legacy', language: undefined }
    expect(postMatchesDisplayLanguage(frenchPost, 'fr')).toBe(true)
    expect(postMatchesDisplayLanguage(englishPost, 'fr')).toBe(false)
    expect(postMatchesDisplayLanguage(legacy, 'en')).toBe(true)
  })

  it('pins welcome post above language-filtered posts', () => {
    const feed = buildNewsFeed([englishPost, frenchPost, welcome], {
      language: 'en',
      sourceTypeFilter: 'all',
    })
    expect(feed[0].id).toBe('welcome')
    expect(feed.some((post) => post.id === 'en-post')).toBe(true)
    expect(feed.some((post) => post.id === 'fr-post')).toBe(false)
  })
})
