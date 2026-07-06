import { FiArrowLeft } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { JobApplicationsPanel } from '../features/jobs/JobApplicationsPanel'

export function JobApplicationsPage() {
  return (
    <div className="community-warm-bg grid gap-7 rounded-[var(--radius-card-lg)]">
      <PageHeader
        eyebrow="Jobs"
        title="Demandes de job"
        description="Traitez les candidatures liées à vos offres publiées."
        actions={
          <Link to="/jobs">
            <Button variant="secondary" icon={FiArrowLeft}>
              Retour aux jobs
            </Button>
          </Link>
        }
      />
      <JobApplicationsPanel embedded />
    </div>
  )
}
