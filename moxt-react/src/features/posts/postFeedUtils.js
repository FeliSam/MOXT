import { isFeedPostSourceAvailable } from './archiveLinkedPosts'
import { sortPostsByPublishedAt } from './postSortUtils'

export const WELCOME_POST_IMAGE_MARKER = 'welcome-moxt-launch'

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
