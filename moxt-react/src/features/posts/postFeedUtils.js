import { isFeedPostSourceAvailable } from './archiveLinkedPosts'
import { sortPostsByPublishedAt } from './postSortUtils'
import { isActiveVideo, videoFeedPath } from '../videos/videoUtils'

export const WELCOME_POST_IMAGE_MARKER = 'welcome-moxt-launch'

/** URL stable d’une publication dans le fil d’actualité. */
export function newsPostPath(postId) {
  return postId ? `/news/${encodeURIComponent(postId)}` : '/news'
}

/** Convertit les anciens liens `/news?post=` vers `/news/:id`. */
export function resolveNewsFeedLink(link) {
  if (!link || typeof link !== 'string') return link || null
  const raw = link.trim()
  if (!raw) return null
  const pathOnly = raw.split('?')[0]
  if (/^\/news\/[^/]+\/edit\/?$/.test(pathOnly)) return raw
  try {
    const url = new URL(raw, 'https://moxt.local')
    const path = url.pathname.replace(/\/$/, '') || '/'
    if (path.startsWith('/news/') && path !== '/news') {
      const postId = decodeURIComponent(path.slice('/news/'.length).split('/')[0] || '')
      return postId && postId !== 'edit' ? newsPostPath(postId) : raw
    }
    if (path === '/news') {
      const postId = url.searchParams.get('post')
      return postId ? newsPostPath(postId) : '/news'
    }
  } catch {
    const match = raw.match(/[?&]post=([^&]+)/)
    if (match?.[1]) return newsPostPath(decodeURIComponent(match[1]))
  }
  return raw
}

/** Post de lancement MOXT (contenu), indépendant du flag d'épinglage DB. */
export function isWelcomePost(post) {
  if (!post || post.status !== 'published') return false
  if (post.sourceType !== 'free') return false
  if (post.directLink === '/news') return true
  if (post.imageUrl?.includes(WELCOME_POST_IMAGE_MARKER)) return true
  if (typeof post.message === 'string' && /bienvenue sur moxt/i.test(post.message)) return true
  return false
}

/** Épinglage UI / tri — uniquement le booléen persisté en base. */
export function isPinnedPost(post) {
  return post?.pinned === true
}

/** Affiche les posts sans langue (legacy) pour toutes les locales. */
export function postMatchesDisplayLanguage(post, language) {
  if (isPinnedPost(post) || isWelcomePost(post)) return true
  if (!post?.language) return true
  return post.language === language
}


/**
 * Carte Actualités pour une vidéo entreprise — même chrome que les posts (avatar, date, média).
 * Les likes / commentaires restent ceux de la vidéo.
 */
export function videoToNewsPost(video, { business } = {}) {
  if (!video?.id || !isActiveVideo(video)) return null
  const title = String(video.title || '').trim()
  const caption = String(video.caption || '').trim()
  const message = [title, caption].filter(Boolean).join('\n\n')
  const thumb = String(video.thumbnailUrl || '').trim()
  const authorName =
    String(business?.name || video.businessName || '').trim() || 'Entreprise'
  return {
    id: video.id,
    authorId: video.ownerId || business?.ownerId || '',
    authorName,
    authorAvatarUrl: business?.logoUrl || null,
    sourceType: 'video',
    sourceId: video.id,
    message,
    imageUrl: thumb || null,
    images: thumb ? [thumb] : [],
    videoUrl: String(video.videoUrl || '').trim(),
    directLink: videoFeedPath(video.id),
    status: 'published',
    likes: Array.isArray(video.likes) ? video.likes : [],
    comments: Array.isArray(video.comments) ? video.comments : [],
    shareCount: Number(video.shareCount) || 0,
    createdAt: video.createdAt || video.updatedAt || new Date().toISOString(),
    updatedAt: video.updatedAt || video.createdAt || new Date().toISOString(),
    language: null,
    pinned: false,
  }
}

function businessById(businesses = [], businessId) {
  if (!businessId || !Array.isArray(businesses)) return null
  return businesses.find((item) => item.id === businessId) || null
}

/**
 * Construit le fil actualités : posts `pinned` en tête, puis tri chronologique.
 * Avec `catalogs`, masque les posts liés à une source absente / archivée / indisponible.
 * Les vidéos actives du catalogue apparaissent comme cartes (même style) sous Tous / Vidéos.
 */
export function buildNewsFeed(
  posts = [],
  { language = 'fr', sourceTypeFilter = 'all', catalogs, videos } = {},
) {
  const published = posts.filter((post) => post.status === 'published')
  let pool = published.filter((post) => postMatchesDisplayLanguage(post, language))

  if (catalogs) {
    pool = pool.filter((post) => isFeedPostSourceAvailable(post, catalogs))
  }

  if (sourceTypeFilter !== 'all') {
    pool = pool.filter((post) => post.sourceType === sourceTypeFilter)
  }

  const includeVideos =
    Array.isArray(videos) &&
    (sourceTypeFilter === 'all' || sourceTypeFilter === 'video')
  if (includeVideos) {
    const linkedVideoIds = new Set(
      published
        .filter((post) => post.sourceType === 'video' && post.sourceId)
        .map((post) => post.sourceId),
    )
    const businesses = catalogs?.businesses || []
    for (const video of videos) {
      if (!video?.id || linkedVideoIds.has(video.id)) continue
      if (pool.some((post) => post.id === video.id)) continue
      const card = videoToNewsPost(video, {
        business: businessById(businesses, video.businessId),
      })
      if (!card) continue
      if (!postMatchesDisplayLanguage(card, language)) continue
      if (catalogs && !isFeedPostSourceAvailable(card, { ...catalogs, videos })) continue
      pool.push(card)
    }
  }

  const pinned = sortPostsByPublishedAt(pool.filter(isPinnedPost))
  const rest = sortPostsByPublishedAt(pool.filter((post) => !isPinnedPost(post)))
  return [...pinned, ...rest]
}
