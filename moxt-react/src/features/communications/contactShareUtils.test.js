import { describe, expect, it } from 'vitest'
import {
  buildContactAttachment,
  buildShareableContacts,
  filterShareableContacts,
  isContactAttachment,
} from './contactShareUtils.js'

describe('isContactAttachment', () => {
  it('accepte uniquement kind contact avec userId', () => {
    expect(isContactAttachment({ kind: 'contact', userId: 'u1' })).toBe(true)
    expect(isContactAttachment({ kind: 'contact' })).toBe(false)
    expect(isContactAttachment({ type: 'image/png', url: '/a.png' })).toBe(false)
    expect(isContactAttachment(null)).toBe(false)
  })
})

describe('buildContactAttachment', () => {
  it('construit un attachment contact normalisé', () => {
    expect(
      buildContactAttachment({
        userId: 'u42',
        name: ' Ada ',
        avatarUrl: 'https://cdn/a.png',
        city: 'Moscou',
      }),
    ).toEqual({
      kind: 'contact',
      userId: 'u42',
      name: 'Ada',
      avatarUrl: 'https://cdn/a.png',
      city: 'Moscou',
      path: '/users/u42/publications',
    })
  })

  it('retourne null sans userId', () => {
    expect(buildContactAttachment({ name: 'X' })).toBeNull()
  })
})

describe('buildShareableContacts', () => {
  it('sépare abonnements et abonnés et déduplique', () => {
    const { following, followers } = buildShareableContacts({
      userId: 'me',
      subscriptions: [
        {
          userId: 'me',
          publisherType: 'user',
          publisherId: 'a',
          publisherName: 'Alice',
        },
        {
          userId: 'me',
          publisherType: 'user',
          publisherId: 'a',
          publisherName: 'Alice dup',
        },
        {
          userId: 'b',
          publisherType: 'user',
          publisherId: 'me',
        },
        {
          userId: 'me',
          publisherType: 'business',
          publisherId: 'biz',
          publisherName: 'Shop',
        },
      ],
      profileById: {
        b: { firstName: 'Bob', lastName: 'Martin', city: 'SPB' },
      },
    })

    expect(following).toHaveLength(1)
    expect(following[0].userId).toBe('a')
    expect(following[0].name).toBe('Alice')
    expect(followers).toHaveLength(1)
    expect(followers[0]).toMatchObject({
      userId: 'b',
      name: 'Bob Martin',
      city: 'SPB',
      section: 'followers',
    })
  })

  it('n’utilise jamais l’UUID comme nom affiché', () => {
    const uid = '438bc62c-1111-4111-8111-abcdefabcdef'
    const { following, followers } = buildShareableContacts({
      userId: 'me',
      subscriptions: [
        {
          userId: 'me',
          publisherType: 'user',
          publisherId: uid,
          publisherName: uid,
        },
        {
          userId: uid,
          publisherType: 'user',
          publisherId: 'me',
        },
      ],
      profileById: {},
      nameFallback: 'Contact MOXT',
    })
    expect(following[0].name).toBe('Contact MOXT')
    expect(followers[0].name).toBe('Contact MOXT')
  })
})

describe('buildContactAttachment uuid', () => {
  it('remplace un nom UUID par le fallback', () => {
    const uid = '438bc62c-1111-4111-8111-abcdefabcdef'
    expect(buildContactAttachment({ userId: uid, name: uid }).name).toBe('Contact MOXT')
  })
})

describe('filterShareableContacts', () => {
  it('filtre par nom ou ville', () => {
    const list = [
      { name: 'Alice', city: 'Moscou' },
      { name: 'Bob', city: 'Paris' },
    ]
    expect(filterShareableContacts(list, 'mos')).toEqual([list[0]])
    expect(filterShareableContacts(list, 'BOB')).toEqual([list[1]])
    expect(filterShareableContacts(list, '')).toEqual(list)
  })
})
