import { BackButton } from '../components/ui/BackButton'
import { PageHeader } from '../components/ui/PageHeader'
import { JobApplicationsPanel } from '../features/jobs/JobApplicationsPanel'

export function JobApplicationsPage() {
  return (
    <div className="community-warm-bg grid gap-7 rounded-[var(--radius-card-lg)]">
      <PageHeader
        eyebrow="Jobs"
        title="Demandes de job"
        description="Traitez les candidatures liées à vos offres publiées."
        actions={<BackButton fallback="/jobs" label="Retour aux jobs" />}
      />
      <JobApplicationsPanel embedded />
    </div>
  )
}
