import { useMemo, useState } from 'react'
import { FiArrowRight, FiBriefcase, FiClock, FiMapPin, FiPlus, FiUser, FiUsers } from 'react-icons/fi'
import { sortBySubscriptionPriority } from '@moxt/shared/utils/subscriptionUtils.js'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Badge, VerifiedBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { CatalogArchiveTabs } from '../components/ui/CatalogArchiveTabs'
import { CatalogSearch } from '../components/ui/CatalogSearch'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { RevealListItem } from '../components/ui/RevealListItem'
import { ScrollSectionAnchor } from '../components/ui/ScrollSectionAnchor'
import { Select } from '../components/ui/Select'
import { useLanguage } from '../contexts/useLanguage'
import { CatalogFavoriteButton } from '../features/account/CatalogFavoriteButton'
import { jobContractLabel, jobSectorLabel } from '../features/jobs/jobDisplayUtils'
import { formatMoney } from '../features/transfers/transferUtils'
import { useScrollToSecondSection } from '../hooks/useScrollToSecondSection'

const SECTOR_TONES = ['brand', 'info', 'teal', 'violet', 'rose', 'success']

function sectorTone(sector) {
  if (!sector) return 'brand'
  let hash = 0
  for (let i = 0; i < sector.length; i += 1) hash = (hash + sector.charCodeAt(i)) % SECTOR_TONES.length
  return SECTOR_TONES[hash]
}

function normalizeJobSalary(value, t) {
  if (!value) return t('jobs.card.salaryToConfirm')
  const text = String(value).trim()
  const digits = text.replace(/[^\d]/g, '')
  if (!digits) return text.includes('RUB') ? text : `${text} RUB`
  return formatMoney(Number(digits), 'RUB')
}

export function JobsPage() {
  useScrollToSecondSection()
  const { t } = useLanguage()
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [tab, setTab] = useState('active')
  const [showMine, setShowMine] = useState(false)
  const [filters, setFilters] = useState({ query: '', location: '', contractType: '', sector: '' })
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const subscriptions = useSelector((state) => state.account.subscriptions || [])
  const canPublish = !!user
  const jobs = useSelector((state) => state.jobs.items)

  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) => {
        if (showMine && (job.ownerId !== user.id || job.businessId)) return false
        const sectorLabel = jobSectorLabel(t, job.sector)
        const haystack =
          `${job.title} ${job.publisherName} ${job.sector} ${sectorLabel} ${job.location} ${job.description}`.toLowerCase()
        const sectorFilter = filters.sector.toLowerCase()
        return (
          (!filters.query || haystack.includes(filters.query.toLowerCase())) &&
          (!filters.location ||
            job.location.toLowerCase().includes(filters.location.toLowerCase())) &&
          (!filters.contractType ||
            job.contractType.toLowerCase().includes(filters.contractType.toLowerCase())) &&
          (!filters.sector ||
            job.sector.toLowerCase().includes(sectorFilter) ||
            sectorLabel.toLowerCase().includes(sectorFilter))
        )
      }),
    [filters, jobs, showMine, t, user.id],
  )

  const activeJobs = useMemo(
    () =>
      sortBySubscriptionPriority(
        filteredJobs.filter((job) => job.status === 'active'),
        subscriptions,
        user.id,
        'job',
      ),
    [filteredJobs, subscriptions, user.id],
  )

  const archivedJobs = useMemo(
    () => filteredJobs.filter((job) => job.status !== 'active'),
    [filteredJobs],
  )

  const displayedJobs = tab === 'active' ? activeJobs : archivedJobs
  function clearFilters() {
    setFilters({ query: '', location: '', contractType: '', sector: '' })
  }

  return (
    <div className="community-warm-bg grid gap-7 rounded-[var(--radius-card-lg)]">
      <PageHeader
        eyebrow={t('jobs.browse.eyebrow')}
        title={t('jobs.browse.title')}
        description={t('jobs.browse.description')}
        stats={[{ label: t('jobs.browse.activeOffers'), value: activeJobs.length }]}
        actions={
          <>
            {canPublish ? (
              <>
                <Button
                  variant={showMine ? 'primary' : 'secondary'}
                  icon={FiUser}
                  onClick={() => setShowMine((v) => !v)}
                >
                  {showMine ? t('jobs.browse.allJobs') : t('jobs.browse.myJobs')}
                </Button>
                <Button variant="secondary" icon={FiUsers} onClick={() => navigate('/jobs/applications')}>
                  {t('jobs.browse.receivedRequests')}
                </Button>
              </>
            ) : null}
            <Button icon={FiPlus} onClick={() => navigate('/jobs/publish')}>
              {t('jobs.browse.publish')}
            </Button>
          </>
        }
      />
      <ScrollSectionAnchor className="scroll-mt-24 grid gap-5 lg:scroll-mt-28">
        <CatalogSearch
          advancedOpen={advancedOpen}
          count={displayedJobs.length}
          query={filters.query}
          onQueryChange={(query) => setFilters((current) => ({ ...current, query }))}
          onToggleAdvanced={() => setAdvancedOpen((value) => !value)}
          onClear={clearFilters}
          placeholder={t('jobs.browse.searchPlaceholder')}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="job-filter-location"
              label={t('jobs.browse.location')}
              value={filters.location}
              onChange={(event) =>
                setFilters((current) => ({ ...current, location: event.target.value }))
              }
            />
            <Input
              id="job-filter-sector"
              label={t('jobs.browse.sector')}
              value={filters.sector}
              onChange={(event) =>
                setFilters((current) => ({ ...current, sector: event.target.value }))
              }
            />
            <Select
              id="job-filter-contract"
              label={t('jobs.browse.contract')}
              value={filters.contractType}
              onChange={(event) =>
                setFilters((current) => ({ ...current, contractType: event.target.value }))
              }
            >
              <option value="">{t('jobs.browse.allContracts')}</option>
              {[...new Set(jobs.map((job) => job.contractType).filter(Boolean))].map((type) => (
                <option key={type} value={type}>
                  {jobContractLabel(t, type)}
                </option>
              ))}
            </Select>
          </div>
        </CatalogSearch>
        <CatalogArchiveTabs
          active={tab}
          onChange={setTab}
          tabs={[
            { key: 'active', label: t('jobs.browse.activeTab'), count: activeJobs.length },
            { key: 'archived', label: t('jobs.browse.archivesTab'), count: archivedJobs.length },
          ]}
        />
        <CatalogGrid lazy={false} columns="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {displayedJobs.length ? (
            displayedJobs.map((job, index) => (
              <RevealListItem key={job.id} index={index} className="h-full overflow-visible">
                <div className="relative h-full">
                  <Link to={`/jobs/${job.id}`} className="block h-full">
                    {tab === 'archived' ? (
                      <Card
                        variant="interactive"
                        className="group relative flex h-full flex-col overflow-hidden p-4 opacity-80 sm:p-5"
                      >
                        <span className="absolute right-2 top-2 z-10 rounded-full bg-[var(--app-surface-muted)] px-1.5 py-0.5 text-[9px] font-black text-[var(--app-text-faint)]">
                          {t('jobs.card.archived')}
                        </span>
                        <div className="flex items-start gap-2">
                          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]">
                            <FiBriefcase />
                          </span>
                        </div>
                        <h2 className="mt-3.5 line-clamp-2 text-sm font-black leading-snug sm:text-base">
                          {job.title}
                        </h2>
                        <p className="mt-1.5 truncate text-xs text-[var(--app-text-faint)]">
                          {job.publisherName}
                        </p>
                        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[var(--app-surface-muted)] p-3">
                          <Badge tone={sectorTone(job.sector)} className="min-w-0 truncate normal-case">
                            {jobSectorLabel(t, job.sector)}
                          </Badge>
                          <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5 truncate text-xs font-bold text-[var(--app-text-muted)]">
                            <FiMapPin className="shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </span>
                        </div>
                      </Card>
                    ) : (
                    <Card
                      variant="interactive"
                      className="group relative flex h-full flex-col overflow-hidden p-4 ring-1 ring-transparent transition-shadow duration-300 hover:ring-brand-200 sm:p-5 dark:hover:ring-brand-800"
                    >
                      <span className="absolute left-2 top-2 z-10">
                        {job.businessId ? (
                          <VerifiedBadge size="sm" label={t('jobs.card.business')} />
                        ) : (
                          <span className="rounded-full bg-[var(--app-surface-muted)] px-1.5 py-0.5 text-[9px] font-black text-[var(--app-text-faint)]">
                            {t('jobs.card.individual')}
                          </span>
                        )}
                      </span>
                      <div className="flex items-start gap-2 pr-10">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
                          <FiBriefcase />
                        </span>
                      </div>

                      <h2 className="mt-3.5 line-clamp-2 text-sm font-black leading-snug sm:text-base">
                        {job.title}
                      </h2>
                      <p className="mt-1.5 truncate text-xs text-[var(--app-text-faint)]">
                        {job.publisherName}
                      </p>

                      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[var(--app-surface-muted)] p-3">
                        <Badge tone={sectorTone(job.sector)} className="min-w-0 truncate normal-case">
                          {jobSectorLabel(t, job.sector)}
                        </Badge>
                        <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5 truncate text-xs font-bold text-[var(--app-text-muted)]">
                          <FiMapPin className="shrink-0 text-brand-700 dark:text-brand-300" />
                          <span className="truncate">{job.location}</span>
                        </span>
                      </div>

                      <div className="mt-4 grid flex-1 content-start gap-2 sm:grid-cols-2">
                        <JobMetric value={normalizeJobSalary(job.salary, t)} label={t('jobs.card.salary')} />
                        <JobMetric
                          value={job.contractType ? jobContractLabel(t, job.contractType) : '—'}
                          label={t('jobs.card.contractType')}
                          icon={FiClock}
                        />
                      </div>

                      <span className="mt-4 flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-brand-700 px-2 text-center text-xs font-black text-white transition group-hover:bg-brand-800 sm:min-h-11 sm:text-sm dark:bg-brand-600">
                        {t('jobs.card.viewOffer')} <FiArrowRight className="text-xs" />
                      </span>
                    </Card>
                    )}
                  </Link>
                  {tab !== 'archived' ? (
                    <CatalogFavoriteButton
                      relatedId={job.id}
                      relatedType="job"
                      title={job.title}
                      path={`/jobs/${job.id}`}
                      entity={job}
                    />
                  ) : null}
                </div>
              </RevealListItem>
            ))
          ) : (
            <EmptyState
              className="col-span-full"
              icon={FiBriefcase}
              tone="warm"
              title={tab === 'active' ? t('jobs.browse.emptyActiveTitle') : t('jobs.browse.emptyArchiveTitle')}
              description={
                tab === 'active'
                  ? t('jobs.browse.emptyActiveDescription')
                  : t('jobs.browse.emptyArchiveDescription')
              }
              action={
                tab === 'active' && canPublish ? (
                  <Button icon={FiPlus} onClick={() => navigate('/jobs/publish')}>
                    {t('jobs.browse.publish')}
                  </Button>
                ) : undefined
              }
            />
          )}
        </CatalogGrid>
      </ScrollSectionAnchor>
    </div>
  )
}

function JobMetric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl bg-[var(--app-surface-muted)] p-4">
      <strong className="flex items-center gap-1.5 truncate">
        {Icon ? <Icon className="shrink-0 text-sm text-brand-700 dark:text-brand-300" /> : null}
        <span className="truncate">{value}</span>
      </strong>
      <span className="mt-1 block text-xs text-[var(--app-text-muted)]">{label}</span>
    </div>
  )
}
