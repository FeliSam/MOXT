import { useFormik } from 'formik'
import { useState } from 'react'
import { ImageLightbox } from '../components/ui/ImageLightbox'
import {
  FiAlertTriangle,
  FiBriefcase,
  FiEdit2,
  FiMapPin,
  FiSend,
  FiUsers,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { BackButton } from '../components/ui/BackButton'
import { Badge, VerifiedBadge } from '../components/ui/Badge'
import { EntityVerifiedName } from '../components/ui/EntityVerifiedName'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import {
  DetailFacts,
  DetailMetrics,
  DetailSection,
  TrustPanel,
} from '../components/ui/DetailBlocks'
import { PageHeader } from '../components/ui/PageHeader'
import { ReshareButton } from '../components/ui/ReshareButton'
import { DetailFloatingActions } from '../components/ui/DetailFloatingActions'
import { FavoriteButton } from '../features/account/FavoriteButton'
import { ContactButton } from '../features/communications/ContactButton'
import { createJobSchemas } from '../features/jobs/jobSchemas'
import { applyToJob, reportJob, withdrawApplication } from '../features/jobs/jobSlice'
import { applicationsForJob, applicationJobId, applicationUserId } from '../features/jobs/jobUtils'
import {
  displayJobField,
  formatJobDate,
  formatJobExperienceLabel,
  formatJobLanguageLabel,
  formatJobLocationLabel,
  formatJobSalaryLabel,
  hasJobText,
  jobContractLabel,
  jobHeaderSubtitle,
  jobSectorLabel,
  JOB_EMPTY_LABEL_KEY,
} from '../features/jobs/jobDisplayUtils'
import { PublisherDetailCard } from '../features/publications/PublisherDetailCard'
import { PublisherPublicationsStrip } from '../features/publications/PublisherPublicationsStrip'
import { usePublisherDetailProfile } from '../features/publications/usePublisherDetailProfile'
import { ReportDialog } from '../components/ui/ReportDialog'
import { useLanguage } from '../contexts/useLanguage'
import { addToast } from '../features/ui/uiSlice'
import { statusMeta } from '../config/statuses'

const APPLICATION_NEXT_STEPS = {
  submitted: {
    titleKey: 'jobs.detail.nextStep.submittedTitle',
    descriptionKey: 'jobs.detail.nextStep.submittedDescription',
  },
  accepted: {
    titleKey: 'jobs.detail.nextStep.acceptedTitle',
    descriptionKey: 'jobs.detail.nextStep.acceptedDescription',
  },
  rejected: {
    titleKey: 'jobs.detail.nextStep.rejectedTitle',
    descriptionKey: 'jobs.detail.nextStep.rejectedDescription',
  },
}

export function JobDetailPage() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const { jobId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const job = useSelector((state) => state.jobs.items.find((item) => item.id === jobId))
  const applications = useSelector((state) => state.jobs.applications)
  const jobApplications = applicationsForJob(applications, jobId)
  const existing = applications.find(
    (item) =>
      applicationJobId(item) === jobId &&
      applicationUserId(item) === user.id &&
      item.status !== 'withdrawn',
  )
  const publisherProfile = usePublisherDetailProfile(job, 'job')
  const [reportOpen, setReportOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const emptyLabel = t(JOB_EMPTY_LABEL_KEY)
  const sectorLabel = jobSectorLabel(t, job?.sector)
  const contractLabel = jobContractLabel(t, job?.contractType)
  const experienceLabel = formatJobExperienceLabel(job?.experienceLevel, t)
  const salaryLabel = formatJobSalaryLabel(job)
  const locationLabel = formatJobLocationLabel(job, t)
  const languageLabel = formatJobLanguageLabel(job?.language)
  const startDateLabel = formatJobDate(job?.startDate)
  const deadlineLabel = formatJobDate(job?.applicationDeadline)
  const formik = useFormik({
    initialValues: { message: '' },
    validationSchema: createJobSchemas(t).applicationSchema,
    onSubmit: (values) =>
      dispatch(
        applyToJob({
          ...values,
          jobId,
          userId: user.id,
          applicantName: `${user.firstName} ${user.lastName}`,
        }),
      ),
  })
  if (!job) return <Card>{t('jobs.detail.notFound')}</Card>
  const jobStatus = statusMeta(job.status, t)
  const existingStatus = existing ? statusMeta(existing.status, t) : null
  const nextStepConfig = existing ? APPLICATION_NEXT_STEPS[existing.status] : null
  const nextStep = nextStepConfig
    ? { title: t(nextStepConfig.titleKey), description: t(nextStepConfig.descriptionKey) }
    : null

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={sectorLabel}
        title={job.title}
        description={jobHeaderSubtitle(job, t)}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Favori — icône seule, coin droit, distinct de la candidature.
                Sur mobile/tablette, Contacter + Favoris passent par le bouton "..." flottant. */}
            <FavoriteButton
              relatedId={job.id}
              relatedType="job"
              title={job.title}
              path={`/jobs/${job.id}`}
              entity={job}
              showLabel={false}
              className="hidden !size-11 shrink-0 xl:inline-flex"
            />
            <ReshareButton sourceType="job" sourceId={job.id} sourceData={job} />
            {job.ownerId === user.id ? (
              <Link to={`/jobs/${jobId}/edit`}>
                <Button variant="secondary" icon={FiEdit2}>{t('jobs.detail.edit')}</Button>
              </Link>
            ) : null}
            <BackButton fallback="/jobs" />
          </div>
        }
      />

      {job.images?.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {job.images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => setLightboxIndex(index)}
              className={`relative block overflow-hidden rounded-2xl border border-[var(--app-border)] ${
                index === 0 ? 'col-span-2 sm:col-span-2' : ''
              }`}
            >
              <img
                src={src}
                alt={t('jobs.detail.imageAlt', { title: job.title, index: index + 1 })}
                className={`w-full object-cover ${index === 0 ? 'aspect-[16/10] max-h-96' : 'aspect-square'}`}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : null}
      <ImageLightbox
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        images={job.images || []}
        index={lightboxIndex ?? 0}
        onIndexChange={(updater) =>
          setLightboxIndex((current) => updater(current ?? 0))
        }
        alt={job.title}
      />
      <DetailMetrics
        items={[
          { icon: FiBriefcase, label: t('jobs.detail.metrics.contract'), value: contractLabel || emptyLabel },
          { icon: FiMapPin, label: t('jobs.detail.metrics.location'), value: locationLabel || emptyLabel },
          {
            icon: FiUsers,
            label: t('jobs.detail.metrics.applications'),
            value: `${jobApplications.length}`,
          },
          {
            icon: FiBriefcase,
            label: t('jobs.detail.metrics.salary'),
            value: salaryLabel || emptyLabel,
          },
        ]}
      />
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{contractLabel}</Badge>
            {salaryLabel ? <Badge tone="success">{salaryLabel}</Badge> : null}
            <Badge tone="info">{experienceLabel}</Badge>
            {languageLabel ? <Badge tone="slate">{languageLabel}</Badge> : null}
            {job.remote ? <Badge tone="slate">{t('jobs.labels.remote')}</Badge> : null}
            <Badge tone={jobStatus.tone}>{jobStatus.label}</Badge>
            {job.businessId ? <VerifiedBadge size="sm" label={t('jobs.card.business')} /> : null}
          </div>
          <h2 className="mt-6 font-black">{t('jobs.detail.description')}</h2>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            {displayJobField(job.description, t)}
          </p>
          {hasJobText(job.requirements) ? (
            <>
              <h2 className="mt-6 font-black">{t('jobs.detail.requirements')}</h2>
              <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
                {job.requirements}
              </p>
            </>
          ) : null}
          {job.benefits ? (
            <>
              <h2 className="mt-6 font-black">{t('jobs.detail.benefits')}</h2>
              <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{job.benefits}</p>
            </>
          ) : null}
        </Card>
        <Card>
          <h2 className="font-black">{t('jobs.detail.application')}</h2>
          <div className="mt-4 hidden xl:block">
            <ContactButton
              ownerId={job.ownerId}
              relatedEntity={job}
              relatedId={job.id}
              relatedPath={`/jobs/${job.id}`}
              relatedTitle={job.title}
              relatedType="job"
              variant="secondary"
            />
          </div>
          {job.ownerId !== user.id ? (
            <Button
              className="mt-3"
              variant="danger"
              icon={FiAlertTriangle}
              onClick={() => setReportOpen(true)}
            >
              {t('jobs.detail.report')}
            </Button>
          ) : null}
          {job.ownerId === user.id ? (
            <p className="mt-3 text-sm text-slate-500">
              {t('jobs.detail.receivedCount', { count: jobApplications.length })}
            </p>
          ) : existing ? (
            <div className="mt-4">
              <Alert
                variant={
                  existing.status === 'accepted'
                    ? 'success'
                    : existing.status === 'rejected'
                      ? 'error'
                      : 'info'
                }
                title={existingStatus.label}
              >
                {nextStep?.description || t('jobs.detail.applicationTracked')}
              </Alert>
              {nextStep ? (
                <Card className="mt-3 bg-[var(--app-surface-muted)] p-4 shadow-sm">
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-brand-700">
                    {t('jobs.detail.nextStepLabel')}
                  </span>
                  <h3 className="mt-2 font-black">{nextStep.title}</h3>
                </Card>
              ) : null}
              {existing.status === 'submitted' ? (
                <Button
                  className="mt-3"
                  variant="secondary"
                  onClick={() =>
                    dispatch(withdrawApplication({ id: existing.id, userId: user.id }))
                  }
                >
                  {t('jobs.detail.withdraw')}
                </Button>
              ) : null}
            </div>
          ) : (
            <form className="mt-5 grid gap-4" onSubmit={formik.handleSubmit}>
              <label className="grid gap-1.5">
                <span className="text-sm font-semibold">{t('jobs.detail.message')}</span>
                <textarea
                  className="min-h-36 rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-950"
                  {...formik.getFieldProps('message')}
                />
                {formik.touched.message && formik.errors.message ? (
                  <span className="text-xs text-red-600">{formik.errors.message}</span>
                ) : null}
              </label>
              <Button type="submit" icon={FiSend}>
                {t('jobs.detail.apply')}
              </Button>
            </form>
          )}
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <DetailSection title={t('jobs.detail.infoTitle')}>
          <DetailFacts
            items={[
              {
                label: t('jobs.detail.facts.company'),
                value: (
                  <EntityVerifiedName
                    name={displayJobField(job.publisherName, t)}
                    userId={job.ownerId}
                    businessId={job.businessId}
                  />
                ),
              },
              {
                label: t('jobs.detail.facts.profile'),
                value: job.businessId ? t('jobs.card.business') : t('jobs.card.individual'),
              },
              { label: t('jobs.detail.facts.sector'), value: sectorLabel || emptyLabel },
              { label: t('jobs.detail.facts.contractType'), value: contractLabel || emptyLabel },
              { label: t('jobs.detail.facts.experience'), value: experienceLabel },
              ...(languageLabel ? [{ label: t('jobs.detail.facts.language'), value: languageLabel }] : []),
              { label: t('jobs.detail.facts.location'), value: locationLabel || emptyLabel },
              ...(startDateLabel ? [{ label: t('jobs.detail.facts.start'), value: startDateLabel }] : []),
              ...(deadlineLabel ? [{ label: t('jobs.detail.facts.deadline'), value: deadlineLabel }] : []),
              { label: t('jobs.detail.facts.status'), value: jobStatus.label },
              { label: t('jobs.detail.facts.reference'), value: job.id },
            ]}
          />
        </DetailSection>
        <div className="grid gap-5">
          {publisherProfile ? (
            <>
              <PublisherDetailCard {...publisherProfile} />
              <PublisherPublicationsStrip
                currentId={job.id}
                ownerId={publisherProfile.ownerId}
                publications={publisherProfile.publications}
                allPath={publisherProfile.publicationsPath}
              />
            </>
          ) : null}
          <TrustPanel
            title={t('jobs.detail.tipsTitle')}
            items={[
              t('jobs.detail.tips.noPayment'),
              t('jobs.detail.tips.useMessaging'),
              t('jobs.detail.tips.checkConditions'),
            ]}
          />
        </div>
      </div>
      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={t('jobs.detail.reportTitle')}
        userId={user.id}
        onSubmit={async ({ reason, evidenceUrl }) => {
          dispatch(
            reportJob({
              jobId: job.id,
              reporterId: user.id,
              reason,
              evidenceUrl,
            }),
          )
          dispatch(
            addToast({
              title: t('jobs.detail.reportToastTitle'),
              message: t('jobs.detail.reportToastMessage'),
              tone: 'success',
            }),
          )
        }}
      />
      <DetailFloatingActions
        isOwner={job.ownerId === user.id}
        ownerId={job.ownerId}
        entity={job}
        relatedId={job.id}
        relatedPath={`/jobs/${job.id}`}
        relatedType="job"
        title={job.title}
      />
    </div>
  )
}
