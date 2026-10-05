/** Photos d’un post : colonne `images`, `imageUrl`, ou les mêmes champs dans `payload`. */

function pushUrl(urls, value) {
  if (typeof value !== 'string') return
  const trimmed = value.trim()
  if (!trimmed) return
  urls.push(trimmed)
}

function readBucket(urls, bucket) {
  if (bucket == null || bucket === '') return
  if (typeof bucket === 'string') {
    const trimmed = bucket.trim()
    if (!trimmed) return
    if (trimmed.startsWith('[')) {
      try {
        readBucket(urls, JSON.parse(trimmed))
        return
      } catch {
        pushUrl(urls, trimmed)
        return
      }
    }
    pushUrl(urls, trimmed)
    return
  }
  if (Array.isArray(bucket)) {
    for (const item of bucket) {
      if (item && typeof item === 'object') pushUrl(urls, item.url || item.src || item.imageUrl)
      else pushUrl(urls, item)
    }
  }
}

export function collectPostImages(post) {
  if (!post || typeof post !== 'object') return []
  const payload = post.payload && typeof post.payload === 'object' && !Array.isArray(post.payload) ? post.payload : {}
  const urls = []
  readBucket(urls, post.images)
  readBucket(urls, payload.images)
  readBucket(urls, post.imageUrl)
  readBucket(urls, payload.imageUrl)
  readBucket(urls, post.photos)
  readBucket(urls, payload.photos)
  const unique = []
  for (const url of urls) {
    if (!unique.includes(url)) unique.push(url)
    if (unique.length >= 5) break
  }
  return unique
}

/** Garantit `images[]` + `imageUrl` même si la colonne écrase le payload par null. */
export function withPostImages(post) {
  if (!post) return post
  const images = collectPostImages(post)
  return {
    ...post,
    images,
    imageUrl: images[0] || (typeof post.imageUrl === 'string' ? post.imageUrl : null),
  }
}
