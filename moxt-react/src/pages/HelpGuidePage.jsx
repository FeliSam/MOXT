import { useMemo, useState } from 'react'
import { FiExternalLink, FiStar } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { Badge, PillBadge } from '../components/ui/Badge'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { CatalogSearch } from '../components/ui/CatalogSearch'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { RevealListItem } from '../components/ui/RevealListItem'
import { HELP_CATEGORIES, helpCategoryMeta } from '../config/helpCategories'
import { useLanguage } from '../contexts/useLanguage'
import { formatDate } from '../features/transfers/transferUtils'

export function HelpGuidePage() {
  const { t, language } = useLanguage()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const articles = useSelector((state) => state.helpArticles.items)

  const visibleArticles = useMemo(() => {
    const q = query.trim().toLowerCase()
    return articles
      .filter((article) => article.status === 'published')
      .filter((article) => article.language === language || article.language === 'fr')
      .filter((article) => !category || article.category === category)
      .filter(
        (article) =>
          !q ||
          `${article.title} ${article.summary}`.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [articles, category, language, query])

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={t('help.page.eyebrow')}
        title={t('help.page.title')}
        description={t('help.page.description')}
        stats={[{ label: t('help.page.stats.articles'), value: visibleArticles.length }]}
      />

      <div className="grid gap-5">
        <CatalogSearch
          count={visibleArticles.length}
          query={query}
          onQueryChange={setQuery}
          placeholder={t('help.page.searchPlaceholder')}
          showCount={false}
        />

        <div className="scrollbar-hidden -mx-1 flex touch-pan-x gap-2 overflow-x-auto px-1 pb-1">
          <PillBadge active={!category} onClick={() => setCategory('')} className="shrink-0 whitespace-nowrap">
            {t('help.categories.all')}
          </PillBadge>
          {HELP_CATEGORIES.map((item) => (
            <PillBadge
              key={item.value}
              active={category === item.value}
              onClick={() => setCategory(item.value)}
              className="shrink-0 whitespace-nowrap"
            >
              {t(item.labelKey)}
            </PillBadge>
          ))}
        </div>

        {visibleArticles.length ? (
          <CatalogGrid lazy={false}>
            {visibleArticles.map((article, index) => {
              const meta = helpCategoryMeta(article.category)
              const Icon = meta.icon
              return (
                <RevealListItem key={article.id} index={index}>
                  <Link
                    to={`/guide/${article.id}`}
                    className="flex h-full flex-col gap-3 rounded-[var(--radius-card-lg)] bg-[var(--app-surface)] p-4 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-brand-700 dark:text-brand-300">
                        <Icon className="text-sm" /> {t(meta.labelKey)}
                      </span>
                      {article.pinned ? (
                        <FiStar className="shrink-0 text-amber-500" aria-label={t('help.article.pinned')} />
                      ) : null}
                    </div>
                    <h3 className="font-black leading-snug">{article.title}</h3>
                    <p className="line-clamp-3 flex-1 text-sm leading-6 text-[var(--app-text-muted)]">
                      {article.summary}
                    </p>
                    {article.verifiedAt ? (
                      <p className="text-xs text-[var(--app-text-faint)]">
                        {t('help.article.verifiedOn', { date: formatDate(article.verifiedAt) })}
                      </p>
                    ) : null}
                  </Link>
                </RevealListItem>
              )
            })}
          </CatalogGrid>
        ) : (
          <EmptyState title={t('help.page.emptyTitle')} description={t('help.page.emptyDescription')} />
        )}
      </div>
    </div>
  )
}

export function HelpArticleDetailPage() {
  const { t } = useLanguage()
  const { articleId } = useParams()
  const article = useSelector((state) =>
    state.helpArticles.items.find((item) => item.id === articleId),
  )
  if (!article) return <EmptyState title={t('help.article.notFound')} />
  const meta = helpCategoryMeta(article.category)

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <PageHeader
        eyebrow={t(meta.labelKey)}
        title={article.title}
        description={article.summary}
      />
      <div className="grid gap-4 rounded-[var(--radius-card-lg)] bg-[var(--app-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <p className="whitespace-pre-line text-sm leading-7 text-[var(--app-text)]">
          {article.content}
        </p>
        {article.verifiedAt ? (
          <Badge tone="info" className="w-fit">
            {t('help.article.verifiedOn', { date: formatDate(article.verifiedAt) })}
          </Badge>
        ) : null}
        {article.sourceUrl ? (
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-[var(--app-border)] px-4 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-[var(--app-accent-soft)] dark:text-brand-300"
          >
            {t('help.article.officialSource', { name: article.sourceName || article.sourceUrl })}{' '}
            <FiExternalLink />
          </a>
        ) : null}
      </div>
    </div>
  )
}
