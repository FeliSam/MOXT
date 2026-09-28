import { describe, expect, it } from 'vitest'
import { collectPostImages, withPostImages } from './postMedia.js'

describe('collectPostImages', () => {
  it('lit un tableau, une URL simple et le payload quand la colonne est nulle', () => {
    expect(collectPostImages({ images: ['https://cdn.example/a.jpg', ''], imageUrl: null })).toEqual([
      'https://cdn.example/a.jpg',
    ])
    expect(collectPostImages({ images: null, imageUrl: 'https://cdn.example/b.jpg' })).toEqual([
      'https://cdn.example/b.jpg',
    ])
    expect(
      collectPostImages({
        images: null,
        imageUrl: null,
        payload: { images: ['https://cdn.example/c.jpg'] },
      }),
    ).toEqual(['https://cdn.example/c.jpg'])
    expect(collectPostImages({ images: '["https://cdn.example/d.jpg"]' })).toEqual(['https://cdn.example/d.jpg'])
  })

  it('recopie les images normalisées sur le post', () => {
    const post = withPostImages({ id: 'p1', images: null, payload: { imageUrl: 'https://cdn.example/e.jpg' } })
    expect(post.images).toEqual(['https://cdn.example/e.jpg'])
    expect(post.imageUrl).toBe('https://cdn.example/e.jpg')
    expect(post.id).toBe('p1')
  })
})
