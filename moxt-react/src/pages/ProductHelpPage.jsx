import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { LinkifiedText } from '../components/ui/LinkifiedText'
import { PillBadge } from '../components/ui/Badge'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { CatalogSearch } from '../components/ui/CatalogSearch'
import { EmptyState } from '../components/ui/EmptyState'
import { HeaderIslandButton, PageHeader } from '../components/ui/PageHeader'
import { RevealListItem } from '../components/ui/RevealListItem'
import { PRODUCT_HELP_CATEGORIES, productHelpCategoryMeta } from '../config/productHelpCategories'
import { findProductSession, resolveProductSessions } from '../config/productHelpSessions'
import { useLanguage } from '../contexts/useLanguage'
import { loadHelpArticles } from '../features/help/helpArticlesSlice'

export function ProductHelpPage() {
  const dispatch = useDispatch()
  const { t, language } = useLanguage()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const articles = useSelector((state) => state.helpArticles.items)

  useEffect(() => {
    dispatch(loadHelpArticles())
  }, [dispatch])

  const visibleSessions = useMemo(() => {
    const q = query.trim().toLowerCase()
    return resolveProductSessions({ articles, language, t })
      .filter((session) => !category || session.category === category)
      .filter(
        (session) =>
          !q || `${session.title} ${session.summary}`.toLowerCase().includes(q),
      )
  }, [articles, category, language, query, t])

  return (
    <div className="grid gap-7">
      <PageHeader
        title={t('productHelp.page.title')}
        description={t('productHelp.page.description')}
        stats={[
          {
            label: t(
              visibleSessions.length > 1
                ? 'productHelp.page.stats.sessions'
                : 'productHelp.page.stats.session',
            ),
            value: visibleSessions.length,
          },
        ]}
        actions={<BackButton fallback="/moxt" />}
      />

      <div className="grid gap-5">
        <CatalogSearch
          count={visibleSessions.length}
          query={query}
          onQueryChange={setQuery}
          onClear={() => setQuery('')}
          placeholder={t('productHelp.page.searchPlaceholder')}
          showCount={false}
        />

        <div className="scrollbar-hidden -mx-1 flex touch-pan-x gap-2 overflow-x-auto px-1 pb-1">
          <PillBadge active={!category} onClick={() => setCategory('')} className="shrink-0 whitespace-nowrap">
            {t('productHelp.categories.all')}
          </PillBadge>
          {PRODUCT_HELP_CATEGORIES.map((item) => (
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

        {visibleSessions.length ? (
          <CatalogGrid lazy={false} columns="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {visibleSessions.map((session, index) => {
              const meta = productHelpCategoryMeta(session.category)
              const Icon = meta.icon
              return (
                <RevealListItem key={session.id} index={index}>
                  <Link
                    to={`/aide/${session.id}`}
                    className="flex h-full flex-col overflow-hidden rounded-[var(--radius-card-lg)] bg-[var(--app-surface)] shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
                  >
                    {session.images?.[0] ? (
                      <img
                        src={session.images[0]}
                        alt=""
                        className="h-32 w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="grid size-8 place-items-center rounded-xl bg-brand-700 text-sm font-black text-white">
                          {index + 1}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-brand-700 dark:text-brand-300">
                          <Icon className="text-sm" /> {t(meta.labelKey)}
                        </span>
                      </div>
                      <h3 className="font-black leading-snug">{session.title}</h3>
                      <p className="line-clamp-3 flex-1 text-sm leading-6 text-[var(--app-text-muted)]">
                        {session.summary}
                      </p>
                    </div>
                  </Link>
                </RevealListItem>
              )
            })}
          </CatalogGrid>
        ) : (
          <EmptyState
            title={t('productHelp.page.emptyTitle')}
            description={t('productHelp.page.emptyDescription')}
          />
        )}
      </div>
    </div>
  )
}

export function ProductHelpSessionPage() {
  const dispatch = useDispatch()
  const { t, language } = useLanguage()
  const { sessionId } = useParams()
  const articles = useSelector((state) => state.helpArticles.items)

  useEffect(() => {
    dispatch(loadHelpArticles())
  }, [dispatch])

  const session = findProductSession({ articles, sessionId, language, t })
  if (!session) {
    return <EmptyState title={t('productHelp.session.notFound')} />
  }

  const meta = productHelpCategoryMeta(session.category)
  const Icon = meta.icon
  const sessions = resolveProductSessions({ articles, language, t })
  const index = sessions.findIndex((item) => item.id === session.id)
  const previous = index > 0 ? sessions[index - 1] : null
  const next = index >= 0 && index < sessions.length - 1 ? sessions[index + 1] : null

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <PageHeader
        title={session.title}
        actions={<HeaderIslandButton icon={FiArrowLeft} label={t('common.back')} to="/aide" />}
      />
      <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-brand-700 dark:text-brand-300">
        <span className="grid size-7 place-items-center rounded-lg bg-brand-700 text-white">
          {index + 1}
        </span>
        <Icon className="text-sm" /> {t(meta.labelKey)}
      </div>
      {session.summary ? (
        <p className="-mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{session.summary}</p>
      ) : null}
      {session.images?.[0] ? (
        <img
          src={session.images[0]}
          alt=""
          className="h-40 w-full rounded-[var(--radius-card-lg)] object-cover shadow-[var(--shadow-card)] sm:h-52"
        />
      ) : null}
      <div className="grid gap-4 rounded-[var(--radius-card-lg)] bg-[var(--app-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <LinkifiedText
          as="p"
          text={session.content}
          preserveWhitespace="pre-line"
          className="text-sm leading-7 text-[var(--app-text)]"
        />
      </div>
      <Link
        to="/support"
        className="flex items-center justify-between gap-3 rounded-[var(--radius-card-lg)] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 text-sm font-bold text-brand-700 transition hover:bg-[var(--app-accent-soft)] dark:text-brand-300"
      >
        {t('productHelp.session.stillStuck')}
        <span aria-hidden="true">→</span>
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {previous ? (
          <Link
            to={`/aide/${previous.id}`}
            className="rounded-xl border border-[var(--app-border)] px-4 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-[var(--app-accent-soft)] dark:text-brand-300"
          >
            ← {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={`/aide/${next.id}`}
            className="rounded-xl border border-[var(--app-border)] px-4 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-[var(--app-accent-soft)] dark:text-brand-300"
          >
            {next.title} →
          </Link>
        ) : null}
      </div>
    </div>
  )
}
