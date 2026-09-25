import { describe, expect, it } from 'vitest'
import {
  latestStatusOfGroup,
  pickStatusThumb,
  statusTextBackground,
  statusTextExcerpt,
  statusThumbUrl,
} from './statusThumb'

const SUPA = 'https://abc.supabase.co/storage/v1/object/public/listings/u1/statuses/S1'

function group(items) {
  return { authorId: 'u1', items }
}

describe('pickStatusThumb — choix de la miniature du dernier élément', () => {
  it('image : dernière image du statut le plus récent, en variante miniature', () => {
    const thumb = pickStatusThumb(
      group([
        { id: 'S0', createdAt: '2026-09-24T08:00:00Z', images: [`${SUPA}/old.jpg`] },
        {
          id: 'S1',
          createdAt: '2026-09-24T10:00:00Z',
          images: [`${SUPA}/a-0.jpg`, `${SUPA}/a-1.jpg`],
          caption: 'Légende ignorée',
        },
      ]),
    )
    expect(thumb.kind).toBe('image')
    expect(thumb.key).toBe('S1:image:1')
    expect(thumb.fullSrc).toBe(`${SUPA}/a-1.jpg`)
    // Supabase : transformation d’image (pas le média pleine taille).
    expect(thumb.src).toContain('/render/image/public/')
    expect(thumb.src).toContain('width=144&height=144&resize=cover')
  })

  it('prend le plus récent même si les items ne sont pas triés', () => {
    const latest = latestStatusOfGroup(
      group([
        { id: 'new', createdAt: '2026-09-24T12:00:00Z' },
        { id: 'old', createdAt: '2026-09-24T09:00:00Z' },
      ]),
    )
    expect(latest.id).toBe('new')
  })

  it('texte : extrait lisible + fond du statut (ou dégradé Moxt par défaut)', () => {
    const plain = pickStatusThumb(
      group([
        {
          id: 'T1',
          createdAt: '2026-09-24T10:00:00Z',
          images: [],
          caption: '  Bonjour   à tous  ',
        },
      ]),
    )
    expect(plain).toEqual({
      key: 'T1:text',
      kind: 'text',
      text: 'Bonjour à tous',
      background: null,
    })

    const colored = pickStatusThumb(
      group([{ id: 'T2', images: [], caption: 'Promo', backgroundColor: '#0f766e' }]),
    )
    expect(colored.background).toBe('#0f766e')
  })

  it('vidéo : poster existant en miniature, sinon première frame', () => {
    const withPoster = pickStatusThumb(
      group([
        {
          id: 'V1',
          videoUrl: 'https://storage.yandexcloud.net/moxt-public/v.mp4',
          thumbnailUrl: `${SUPA}/poster.jpg`,
        },
      ]),
    )
    expect(withPoster.kind).toBe('video')
    expect(withPoster.src).toContain('/render/image/public/')
    expect(withPoster.videoSrc).toBe('https://storage.yandexcloud.net/moxt-public/v.mp4')

    const noPoster = pickStatusThumb(group([{ id: 'V2', video: { url: 'https://x.test/v.mp4' } }]))
    expect(noPoster).toMatchObject({ kind: 'video', src: '', videoSrc: 'https://x.test/v.mp4' })
  })

  it('rien à montrer → null (la bulle garde l’avatar / le logo)', () => {
    expect(pickStatusThumb(null)).toBeNull()
    expect(pickStatusThumb(group([]))).toBeNull()
    expect(pickStatusThumb(group([{ id: 'E', images: [], caption: '   ' }]))).toBeNull()
  })
})

describe('helpers', () => {
  it('statusTextExcerpt coupe sur un mot', () => {
    expect(
      statusTextExcerpt('Nouvelle promo sur les transferts vers le Bénin ce week-end', 32),
    ).toBe('Nouvelle promo sur les…')
  })

  it('statusTextBackground n’accepte que des couleurs / dégradés CSS', () => {
    expect(statusTextBackground({ background: 'linear-gradient(90deg,#000,#fff)' })).toMatch(
      /^linear-gradient/,
    )
    expect(statusTextBackground({ bgColor: 'rgb(1,2,3)' })).toBe('rgb(1,2,3)')
    expect(statusTextBackground({ background: 'url(javascript:alert(1))' })).toBeNull()
  })

  it('statusThumbUrl garde les data:/blob: et les URL sans variante', () => {
    expect(statusThumbUrl('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA')
    expect(statusThumbUrl('https://example.test/a.jpg')).toBe('https://example.test/a.jpg')
  })
})
