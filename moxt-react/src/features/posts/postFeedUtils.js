import { isFeedPostSourceAvailable } from './archiveLinkedPosts'
import { sortPostsByPublishedAt } from './postSortUtils'

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
 * Construit le fil actualités : posts `pinned` en tête, puis tri chronologique.
 * Avec `catalogs`, masque les posts liés à une source absente / archivée / indisponible.
 */
export function buildNewsFeed(
  posts = [],
  { language = 'fr', sourceTypeFilter = 'all', catalogs } = {},
) {
  const published = posts.filter((post) => post.status === 'published')
  let pool = published.filter((post) => postMatchesDisplayLanguage(post, language))

  if (catalogs) {
    pool = pool.filter((post) => isFeedPostSourceAvailable(post, catalogs))
  }

  if (sourceTypeFilter !== 'all') {
    pool = pool.filter((post) => post.sourceType === sourceTypeFilter)
  }

  const pinned = sortPostsByPublishedAt(pool.filter(isPinnedPost))
  const rest = sortPostsByPublishedAt(pool.filter((post) => !isPinnedPost(post)))
  return [...pinned, ...rest]
}
