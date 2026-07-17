import { BackButton } from '../components/ui/BackButton'
import { PageHeader } from '../components/ui/PageHeader'
import { useLanguage } from '../contexts/useLanguage'
import { JobApplicationsPanel } from '../features/jobs/JobApplicationsPanel'

export function JobApplicationsPage() {
  const { t } = useLanguage()

  return (
    <div className="community-warm-bg grid gap-7 rounded-[var(--radius-card-lg)]">
      <PageHeader
        eyebrow={t('jobs.applications.eyebrow')}
        title={t('jobs.applications.title')}
        description={t('jobs.applications.description')}
        actions={<BackButton fallback="/jobs" label={t('jobs.applications.back')} />}
      />
      <JobApplicationsPanel embedded />
    </div>
  )
}
