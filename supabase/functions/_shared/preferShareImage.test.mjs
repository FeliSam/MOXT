import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  isCdnShareImageUrl,
  isLegacySupabaseStorageUrl,
  preferShareImageUrl,
  selectEntityShareImage,
} from './preferShareImage.mjs'

const STORAGE_A =
  'https://rbvqfkccbkwjxkvpnwqn.supabase.co/storage/v1/object/public/listings/posts/mugaaxbk-0.png'
const STORAGE_B =
  'https://rbvqfkccbkwjxkvpnwqn.supabase.co/storage/v1/object/public/listings/posts/mugaaxbk-1.png'
const STORAGE_C =
  'https://rbvqfkccbkwjxkvpnwqn.supabase.co/storage/v1/object/public/listings/posts/mugaaxbk-2.png'
const CDN = 'https://cdn.moxtapp.ru/public/listings/posts/mugaaxbk-0.png'
const FALLBACK = 'https://moxtapp.ru/assets/logos/X.png'

describe('preferShareImage', () => {
  it('classifies CDN and legacy Storage hosts', () => {
    assert.equal(isLegacySupabaseStorageUrl(STORAGE_A), true)
    assert.equal(isLegacySupabaseStorageUrl(CDN), false)
    assert.equal(isCdnShareImageUrl(CDN), true)
    assert.equal(isCdnShareImageUrl('https://storage.yandexcloud.net/moxt-public/a.png'), true)
    assert.equal(isCdnShareImageUrl(STORAGE_A), false)
    assert.equal(isCdnShareImageUrl(FALLBACK), false)
  })

  it('prefers a later CDN URL over earlier Supabase Storage URLs', () => {
    assert.equal(preferShareImageUrl([STORAGE_A, STORAGE_B, CDN], FALLBACK), CDN)
  })

  it('keeps the first Storage URL when the row has not moved to the CDN', () => {
    assert.equal(preferShareImageUrl([STORAGE_A, STORAGE_B], FALLBACK), STORAGE_A)
  })

  it('keeps an earlier non-Storage photo ahead of a later CDN URL', () => {
    const external = 'https://images.example/cover.jpg'
    assert.equal(preferShareImageUrl([external, CDN], FALLBACK), external)
  })

  it('uses the post CDN image_url instead of stale images[] Storage URLs', () => {
    assert.equal(
      selectEntityShareImage(
        'post',
        {
          id: 'POST-MUGAAX9N-OUD2LAUC',
          images: [STORAGE_A, STORAGE_B, STORAGE_C],
          image_url: CDN,
        },
        FALLBACK,
      ),
      CDN,
    )
  })

  it('reads image_url when images is a JSON string of Storage URLs', () => {
    assert.equal(
      selectEntityShareImage(
        'post',
        {
          images: JSON.stringify([STORAGE_A, STORAGE_B]),
          image_url: CDN,
        },
        FALLBACK,
      ),
      CDN,
    )
  })

  it('prefers a CDN url nested in images when image_url is empty', () => {
    assert.equal(
      selectEntityShareImage(
        'post',
        {
          images: [{ url: STORAGE_A }, { url: CDN }],
          image_url: '',
        },
        FALLBACK,
      ),
      CDN,
    )
  })

  it('falls back to the static logo only when the row has no photo', () => {
    assert.equal(selectEntityShareImage('post', { images: [], image_url: null }, FALLBACK), FALLBACK)
  })

  it('prefers parcel image_url on the CDN over a Storage travel proof', () => {
    assert.equal(
      selectEntityShareImage(
        'parcel',
        {
          travel_proof_url: STORAGE_A,
          images: [STORAGE_B],
          image_url: CDN,
        },
        FALLBACK,
      ),
      CDN,
    )
  })

  it('keeps a CDN travel proof ahead of Storage gallery URLs', () => {
    const proof = 'https://cdn.moxtapp.ru/public/parcels/proof.png'
    assert.equal(
      selectEntityShareImage(
        'parcel',
        {
          travel_proof_url: proof,
          images: [STORAGE_A],
          image_url: STORAGE_B,
        },
        FALLBACK,
      ),
      proof,
    )
  })

  it('prefers payload image_url on the CDN for jobs', () => {
    assert.equal(
      selectEntityShareImage(
        'job',
        {
          images: [],
          payload: {
            images: [STORAGE_A],
            image_url: CDN,
          },
        },
        FALLBACK,
      ),
      CDN,
    )
  })

  it('prefers a Yandex object URL in image_url over Storage images[]', () => {
    const yandex = 'https://storage.yandexcloud.net/moxt-public/public/listings/posts/mugaaxbk-0.png'
    assert.equal(
      selectEntityShareImage(
        'post',
        {
          images: [STORAGE_A, STORAGE_B],
          image_url: yandex,
        },
        FALLBACK,
      ),
      yandex,
    )
  })

  it('keeps a Storage gallery when the only CDN URL is an avatar', () => {
    assert.equal(
      selectEntityShareImage(
        'post',
        {
          images: [STORAGE_A, STORAGE_B],
          avatar_url: CDN,
        },
        FALLBACK,
      ),
      STORAGE_A,
    )
  })

  it('uses a CDN avatar when the row has no gallery photo', () => {
    assert.equal(
      selectEntityShareImage(
        'user',
        {
          avatar_url: CDN,
        },
        FALLBACK,
      ),
      CDN,
    )
  })

  it('uses thumbnail_url on the CDN when images[] is still Storage', () => {
    const thumb = 'https://cdn.moxtapp.ru/public/listings/thumb.png'
    assert.equal(
      selectEntityShareImage(
        'listing',
        {
          images: [STORAGE_A],
          thumbnail_url: thumb,
        },
        FALLBACK,
      ),
      thumb,
    )
  })
})
