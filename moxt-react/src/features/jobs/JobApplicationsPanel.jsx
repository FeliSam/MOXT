import { FiCheck, FiX } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Badge } from '../../components/ui/Badge'
import { EntityVerifiedName } from '../../components/ui/EntityVerifiedName'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { useLanguage } from '../../contexts/useLanguage'
import { updateApplicationStatus } from './jobSlice'
import { applicationJobId, applicationUserId } from './jobUtils'

export function JobApplicationsPanel({ embedded = false, id = 'job-applications' }) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const jobs = useSelector((state) => state.jobs.items)
  const applications = useSelector((state) => state.jobs.applications)
  const business = useSelector((state) =>
    state.businesses.items.find((item) => item.ownerId === user.id),
  )

  const ownedJobIds = new Set(
    jobs
      .filter(
        (job) =>
          job.ownerId === user.id || (business?.id && job.businessId === business.id),
      )
      .map((job) => job.id),
  )
  const rows = applications.filter((item) => ownedJobIds.has(applicationJobId(item)))

  const content = rows.length ? (
          <div className="grid gap-3">
            {rows.map((row) => {
              const job = jobs.find((item) => item.id === applicationJobId(row))
              return (
                <Card key={row.id} className="h-full bg-[var(--app-surface-muted)] p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <EntityVerifiedName
                        as="strong"
                        name={row.applicantName || t('jobs.applications.defaultApplicant')}
                        userId={applicationUserId(row)}
                      />
                      <p className="mt-1 text-sm text-[var(--app-text-muted)]">{job?.title}</p>
                      {row.message ? (
                        <p className="mt-2 text-sm text-[var(--app-text-muted)]">{row.message}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{row.status}</Badge>
                      <Button
                        icon={FiCheck}
                        onClick={() =>
                          dispatch(updateApplicationStatus({ id: row.id, status: 'accepted' }))
                        }
                      >
                        {t('jobs.applications.accept')}
                      </Button>
                      <Button
                        icon={FiX}
                        variant="danger"
                        onClick={() =>
                          dispatch(updateApplicationStatus({ id: row.id, status: 'rejected' }))
                        }
                      >
                        {t('jobs.applications.reject')}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
  ) : (
    <EmptyState
      title={t('jobs.applications.emptyTitle')}
      description={t('jobs.applications.emptyDescription')}
    />
  )

  if (embedded) {
    return content
  }

  return (
    <section id={id} className="scroll-mt-24 lg:scroll-mt-28">
      <Card className="grid gap-4 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-black">{t('jobs.applications.panelTitle')}</h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            {t('jobs.applications.panelDescription')}
          </p>
        </div>
        {content}
      </Card>
    </section>
  )
}
