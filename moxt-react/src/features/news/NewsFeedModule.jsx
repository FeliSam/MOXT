import { useState } from 'react'
import { FiEdit3, FiRss } from 'react-icons/fi'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { FeedPostCard } from '../../components/ui/FeedPostCard'
import { ShareToFeedModal } from '../../components/ui/ShareToFeedModal'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { StatusComposer } from '../statuses/StatusComposer'
import { StatusRail } from '../statuses/StatusRail'
import { NewsFeedHeader } from './NewsFeedHeader'
import { NewsFilterTabs } from './NewsFilterTabs'
import { useNewsFeed } from './useNewsFeed'
import { useNewsPublishActions } from './useNewsPublishActions'

/**
 * Module fil d’actualité : en-tête, statuts, filtres, liste de posts.
 * La page `/news` n’est qu’un hôte mince.
 */
export function NewsFeedModule() {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const [activeFilter, setActiveFilter] = useState('all')
  const { highlightPostId, targetedPost, visiblePosts } = useNewsFeed(activeFilter)
  const {
    user,
    showShareModal,
    setShowShareModal,
    statusComposerOpen,
    setStatusComposerOpen,
    openStatusComposer,
    openComposer,
  } = useNewsPublishActions()

  return (
    <div className="grid min-w-0 max-w-full gap-7 overflow-x-clip">
      <NewsFeedHeader
        user={user}
        onAddStatus={openStatusComposer}
        onWritePost={openComposer}
      />

      <div className="mx-auto grid w-full min-w-0 max-w-3xl gap-5">
        <StatusRail
          composerOpen={statusComposerOpen}
          onComposerOpenChange={setStatusComposerOpen}
          renderComposer={false}
        />

        {statusComposerOpen ? (
          <StatusComposer onClose={() => setStatusComposerOpen(false)} />
        ) : null}

        <NewsFilterTabs activeFilter={activeFilter} onChange={setActiveFilter} />

        {highlightPostId && !targetedPost ? (
          <EmptyState
            icon={FiRss}
            tone="search"
            title={p3('news.empty.notFoundTitle')}
            description={p3('news.empty.notFoundDescription')}
          />
        ) : visiblePosts.length > 0 ? (
          <div className="flex min-w-0 flex-col divide-y divide-[var(--app-border)]">
            {visiblePosts.map((post) => (
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
              user ? (
                <Button icon={FiEdit3} onClick={openComposer}>
                  {p3('news.writePost')}
                </Button>
              ) : null
            }
          />
        )}
      </div>

      {showShareModal ? (
        <ShareToFeedModal
          sourceType="free"
          sourceId={null}
          sourceData={{}}
          onClose={() => setShowShareModal(false)}
        />
      ) : null}
    </div>
  )
}
