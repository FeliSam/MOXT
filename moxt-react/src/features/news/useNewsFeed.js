import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/useLanguage'
import { buildNewsFeed, newsPostPath } from '../posts/postFeedUtils'

/**
 * Assemble le fil News (catalogues + posts), filtres et ciblage `?post=` / `/news/:postId`.
 */
export function useNewsFeed(activeFilter = 'all') {
  const navigate = useNavigate()
  const { postId: postIdParam } = useParams()
  const [searchParams] = useSearchParams()
  const highlightPostId = postIdParam || searchParams.get('post')
  const { language } = useLanguage()

  const posts = useSelector((s) => s.posts?.items ?? [])
  const listings = useSelector((s) => s.marketplace?.items ?? [])
  const parcels = useSelector((s) => s.parcels?.items ?? [])
  const jobs = useSelector((s) => s.jobs?.items ?? [])
  const events = useSelector((s) => s.events?.items ?? [])
  const businesses = useSelector((s) => s.businesses?.items ?? [])

  const catalogs = useMemo(
    () => ({ listings, parcels, jobs, events, businesses }),
    [businesses, events, jobs, listings, parcels],
  )

  const publishedPosts = useMemo(
    () => buildNewsFeed(posts, { language, catalogs }),
    [catalogs, language, posts],
  )

  const filtered = useMemo(
    () =>
      activeFilter === 'all'
        ? publishedPosts
        : buildNewsFeed(posts, { language, sourceTypeFilter: activeFilter, catalogs }),
    [activeFilter, catalogs, language, posts, publishedPosts],
  )

  const targetedPost = highlightPostId
    ? posts.find((item) => item.id === highlightPostId)
    : null

  const visiblePosts = useMemo(() => {
    if (!targetedPost) return filtered
    if (filtered.some((item) => item.id === targetedPost.id)) return filtered
    return [targetedPost, ...filtered]
  }, [filtered, targetedPost])

  useEffect(() => {
    if (!highlightPostId) return undefined
    if (!postIdParam) {
      navigate(newsPostPath(highlightPostId), { replace: true })
      return undefined
    }
    const el = document.getElementById(`news-post-${highlightPostId}`)
    if (!el) return undefined
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return undefined
  }, [highlightPostId, navigate, postIdParam, visiblePosts])

  return {
    highlightPostId,
    targetedPost,
    visiblePosts,
  }
}
