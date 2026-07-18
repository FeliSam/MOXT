export const MAX_POST_IMAGES = 4

/** Normalize post media: prefer `images[]`, fall back to legacy `imageUrl`. */
export function getPostImages(post) {
  if (!post) return []
  const fromArray = Array.isArray(post.images)
    ? post.images.filter((url) => typeof url === 'string' && url.trim())
    : []
  if (fromArray.length) return fromArray.slice(0, MAX_POST_IMAGES)
  if (typeof post.imageUrl === 'string' && post.imageUrl.trim()) {
    return [post.imageUrl.trim()]
  }
  return []
}

export function normalizePostImages(urls = []) {
  const cleaned = (Array.isArray(urls) ? urls : [])
    .filter((url) => typeof url === 'string' && url.trim())
    .map((url) => url.trim())
    .slice(0, MAX_POST_IMAGES)
  return {
    images: cleaned,
    imageUrl: cleaned[0] || null,
  }
}
