import { useEffect, useMemo, useState } from 'react'
import { FiEdit3, FiPlus, FiRss } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  canPublishContent,
  isEmailVerified,
  isPhoneVerified,
  isValidRussianPhone,
} from '@moxt/shared/auth/userSecurity.js'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { FeedPostCard } from '../components/ui/FeedPostCard'
import { headerIslandClass } from '../components/ui/PageHeader'
import { ShareToFeedModal } from '../components/ui/ShareToFeedModal'
import { useLanguage } from '../contexts/useLanguage'
import { useSecurityGate } from '../features/security/useSecurityGate'
import { buildNewsFeed } from '../features/posts/postFeedUtils'
import { StatusRail } from '../features/statuses/StatusRail'
import { StatusComposer } from '../features/statuses/StatusComposer'
import { phase3Text } from '../i18n/phase3I18n'

const FILTER_KEYS = ['all', 'listing', 'job', 'parcel', 'event', 'business', 'free']

export function NewsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const highlightPostId = searchParams.get('post')
  const { language, t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((s) => s.auth.user)
  const posts = useSelector((s) => s.posts?.items ?? [])
  const listings = useSelector((s) => s.marketplace?.items ?? [])
  const parcels = useSelector((s) => s.parcels?.items ?? [])
  const jobs = useSelector((s) => s.jobs?.items ?? [])
  const events = useSelector((s) => s.events?.items ?? [])
  const businesses = useSelector((s) => s.businesses?.items ?? [])
  const { requirePublish } = useSecurityGate()

  const [activeFilter, setActiveFilter] = useState('all')
  const [showShareModal, setShowShareModal] = useState(false)
  const [statusComposerOpen, setStatusComposerOpen] = useState(false)

  function openStatusComposer() {
    if (canPublishContent(user)) {
      setStatusComposerOpen(true)
      return
    }
    requirePublish()
    if (
      isPhoneVerified(user) &&
      isValidRussianPhone(user?.phone) &&
      !isEmailVerified(user)
    ) {
      navigate('/security?verify=email')
    }
  }

  function openComposer() {
    if (canPublishContent(user)) {
      setShowShareModal(true)
      return
    }
    requirePublish()
    if (
      isPhoneVerified(user) &&
      isValidRussianPhone(user?.phone) &&
      !isEmailVerified(user)
    ) {
      navigate('/security?verify=email')
    }
  }

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

  // Cible une publication précise depuis une notification (?post=id) : on
  // défile jusqu'à elle et on l'entoure brièvement, plutôt que de renvoyer
  // vers le fil général sans indication.
  useEffect(() => {
    if (!highlightPostId) return undefined
    const el = document.getElementById(`news-post-${highlightPostId}`)
    if (!el) return undefined
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      params.delete('post')
      setSearchParams(params, { replace: true })
    }, 2400)
    return () => window.clearTimeout(timer)
  }, [highlightPostId, filtered, searchParams, setSearchParams])

  return (
    <div className="grid min-w-0 max-w-full gap-7 overflow-x-clip">
      <header className="flex min-w-0 max-w-full flex-col gap-4 overflow-visible rounded-[var(--radius-card-lg)] border-0 bg-[var(--app-surface)]/80 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:gap-5 sm:p-7">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <h1 className="font-display min-w-0 break-words text-xl font-extrabold tracking-[-0.02em] text-[var(--app-text)] sm:text-4xl">
            {p3('news.title')}
          </h1>
          {user ? (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={openStatusComposer}
                aria-label={t('status.rail.addYours')}
                className="btn-press inline-flex shrink-0 items-center gap-2.5 text-sm font-semibold text-[var(--app-text)]"
              >
                <span className={headerIslandClass}>
                  <FiPlus className="text-base" aria-hidden="true" />
                </span>
                <span className="hidden sm:inline">{p3('news.addStatus')}</span>
              </button>
              <button
                type="button"
                onClick={openComposer}
                aria-label={p3('news.writePost')}
                className="btn-press inline-flex shrink-0 items-center gap-2.5 text-sm font-semibold text-[var(--app-text)]"
              >
                <span className={headerIslandClass}>
                  <FiEdit3 className="text-base" aria-hidden="true" />
                </span>
                <span className="hidden sm:inline">{p3('news.writePost')}</span>
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {/* Statuts + filtres + fil centré, une publication par ligne */}
      <div className="mx-auto grid w-full min-w-0 max-w-3xl gap-5">
        <StatusRail
          composerOpen={statusComposerOpen}
          onComposerOpenChange={setStatusComposerOpen}
          renderComposer={false}
        />

        {statusComposerOpen ? (
          <StatusComposer onClose={() => setStatusComposerOpen(false)} />
        ) : null}

        <div className="flex items-center gap-6 overflow-x-auto border-b border-[var(--app-border)] scrollbar-hidden">
          {FILTER_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              className={`relative shrink-0 pb-3 text-sm font-bold transition-colors ${
                activeFilter === key
                  ? 'text-[var(--app-text)]'
                  : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
              }`}
            >
              {p3(`news.filters.${key}`)}
              {activeFilter === key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-600" />
              )}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <div className="flex min-w-0 flex-col divide-y divide-[var(--app-border)]">
            {filtered.map((post) => (
              <div
                key={post.id}
                id={`news-post-${post.id}`}
                className={
                  highlightPostId === post.id
                    ? 'news-post-highlight min-w-0 max-w-full rounded-2xl py-5 sm:py-6'
                    : 'min-w-0 max-w-full py-5 sm:py-6'
                }
              >
                <FeedPostCard post={post} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FiRss}
            tone="search"
            title={p3('news.empty.title')}
            description={
              activeFilter === 'all'
                ? p3('news.empty.description')
                : p3('news.empty.type', { type: p3(`news.filters.${activeFilter}`) })
            }
            action={
              user && (
                <Button icon={FiEdit3} onClick={openComposer}>
                  {p3('news.writePost')}
                </Button>
              )
            }
          />
        )}
      </div>

      {/* Modal post libre */}
      {showShareModal && (
        <ShareToFeedModal
          sourceType="free"
          sourceId={null}
          sourceData={{}}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}
