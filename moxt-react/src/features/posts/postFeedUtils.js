import { sortPostsByPublishedAt } from './postSortUtils'

export const WELCOME_POST_IMAGE_MARKER = 'welcome-moxt-launch'

/** Post de lancement MOXT — épinglé en tête du fil pour tous les utilisateurs. */
export function isWelcomePost(post) {
  if (!post || post.status !== 'published') return false
  if (post.pinned === true) return true
  if (post.sourceType !== 'free') return false
  if (post.directLink === '/news') return true
  if (post.imageUrl?.includes(WELCOME_POST_IMAGE_MARKER)) return true
  if (typeof post.message === 'string' && /bienvenue sur moxt/i.test(post.message)) return true
  return false
}

/** Affiche les posts sans langue (legacy) pour toutes les locales. */
export function postMatchesDisplayLanguage(post, language) {
  if (isWelcomePost(post)) return true
  if (!post?.language) return true
  return post.language === language
}

/**
 * Construit le fil actualités : message de bienvenue épinglé + tri + filtres.
 */
export function buildNewsFeed(posts = [], { language = 'fr', sourceTypeFilter = 'all' } = {}) {
  const published = posts.filter((post) => post.status === 'published')
  const welcome = published.find(isWelcomePost)
  let pool = published.filter((post) => !isWelcomePost(post))
  pool = pool.filter((post) => postMatchesDisplayLanguage(post, language))

  if (sourceTypeFilter !== 'all') {
    pool = pool.filter((post) => post.sourceType === sourceTypeFilter)
  }

  const sorted = sortPostsByPublishedAt(pool)
  const showWelcome =
    welcome && (sourceTypeFilter === 'all' || sourceTypeFilter === 'free')

  return showWelcome ? [welcome, ...sorted] : sorted
}
