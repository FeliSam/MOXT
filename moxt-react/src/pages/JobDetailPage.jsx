import { useFormik } from 'formik'
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiBriefcase,
  FiEdit2,
  FiMapPin,
  FiSend,
  FiUsers,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { Badge, VerifiedBadge } from '../components/ui/Badge'
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
import { FavoriteButton } from '../features/account/FavoriteButton'
import { ContactButton } from '../features/communications/ContactButton'
import { applicationSchema } from '../features/jobs/jobSchemas'
import { applyToJob, reportJob, withdrawApplication } from '../features/jobs/jobSlice'
import { applicationsForJob, applicationJobId, applicationUserId } from '../features/jobs/jobUtils'
import { PublisherDetailCard } from '../features/publications/PublisherDetailCard'
import { usePublisherDetailProfile } from '../features/publications/usePublisherDetailProfile'
import {
  JOB_CONTRACTS,
  JOB_EXPERIENCE_LEVELS,
  JOB_SALARY_PERIODS,
  optionLabel,
} from '../config/options'
import { statusMeta } from '../config/statuses'

const applicationNextSteps = {
  submitted: {
    title: 'Candidature envoyée',
    description:
      'Le recruteur peut accepter ou refuser votre candidature depuis son espace de gestion.',
  },
  accepted: {
    title: 'Candidature acceptée',
    description: 'Contactez le recruteur pour organiser les prochaines étapes.',
  },
  rejected: {
    title: 'Candidature refusée',
    description: 'Vous pouvez garder cette offre en favori ou contacter le recruteur si besoin.',
  },
}

export function JobDetailPage() {
  const dispatch = useDispatch()
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
  const contractLabel = optionLabel(JOB_CONTRACTS, job.contractType)
  const experienceLabel =
    job.experienceLevel && job.experienceLevel !== 'none'
      ? optionLabel(JOB_EXPERIENCE_LEVELS, job.experienceLevel)
      : null
  const salaryLabel = job.salaryPeriod
    ? `${job.salary} / ${optionLabel(JOB_SALARY_PERIODS, job.salaryPeriod)}`
    : job.salary
  const formik = useFormik({
    initialValues: { message: '' },
    validationSchema: applicationSchema,
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
  if (!job) return <Card>Job introuvable.</Card>
  const jobStatus = statusMeta(job.status)
  const existingStatus = existing ? statusMeta(existing.status) : null
  const nextStep = existing ? applicationNextSteps[existing.status] : null

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={job.sector}
        title={job.title}
        description={`${job.publisherName} · ${job.location}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Favori — icône seule, coin droit, distinct de la candidature */}
            <FavoriteButton
              relatedId={job.id}
              relatedType="job"
              title={job.title}
              path={`/jobs/${job.id}`}
              entity={job}
              showLabel={false}
              className="size-11 shrink-0"
            />
            <ReshareButton sourceType="job" sourceId={job.id} sourceData={job} />
            {job.ownerId === user.id ? (
              <Link to={`/jobs/${jobId}/edit`}>
                <Button variant="secondary" icon={FiEdit2}>Modifier</Button>
              </Link>
            ) : null}
            <Link to="/jobs">
              <Button variant="secondary" icon={FiArrowLeft}>Retour</Button>
            </Link>
          </div>
        }
      />

      {job.images?.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {job.images.map((src, index) => (
            <a
              key={src}
              href={src}
              target="_blank"
              rel="noreferrer"
              className={`overflow-hidden rounded-2xl border border-[var(--app-border)] ${index === 0 ? 'col-span-2 row-span-2' : ''}`}
            >
              <img
                src={src}
                alt={`${job.title} — affiche ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      ) : null}
      <DetailMetrics
        items={[
          { icon: FiBriefcase, label: 'Contrat', value: contractLabel },
          { icon: FiMapPin, label: 'Lieu', value: job.location || '—' },
          {
            icon: FiUsers,
            label: 'Candidatures',
            value: `${jobApplications.length}`,
          },
          { icon: FiBriefcase, label: 'Rémunération', value: salaryLabel || '—' },
        ]}
      />
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{contractLabel}</Badge>
            <Badge tone="success">{salaryLabel}</Badge>
            {experienceLabel ? <Badge tone="info">{experienceLabel}</Badge> : null}
            {job.remote ? <Badge tone="slate">Télétravail</Badge> : null}
            <Badge tone={jobStatus.tone}>{jobStatus.label}</Badge>
            {job.businessId ? <VerifiedBadge size="sm" label="Entreprise" /> : null}
          </div>
          <h2 className="mt-6 font-black">Description</h2>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            {job.description || '—'}
          </p>
          <h2 className="mt-6 font-black">Profil recherché</h2>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            {job.requirements || '—'}
          </p>
          {job.benefits ? (
            <>
              <h2 className="mt-6 font-black">Avantages</h2>
              <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{job.benefits}</p>
            </>
          ) : null}
        </Card>
        <Card>
          <h2 className="font-black">Candidature</h2>
          <div className="mt-4">
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
              onClick={() =>
                dispatch(
                  reportJob({
                    jobId: job.id,
                    reporterId: user.id,
                    reason: 'Offre à vérifier',
                  }),
                )
              }
            >
              Signaler
            </Button>
          ) : null}
          {job.ownerId === user.id ? (
            <p className="mt-3 text-sm text-slate-500">
              {jobApplications.length} candidature(s) reçue(s).
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
                {nextStep?.description ||
                  'Votre candidature est suivie et vous serez notifié à chaque changement.'}
              </Alert>
              {nextStep ? (
                <Card className="mt-3 bg-[var(--app-surface-muted)] p-4 shadow-sm">
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-brand-700">
                    Prochaine étape
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
                  Retirer ma candidature
                </Button>
              ) : null}
            </div>
          ) : (
            <form className="mt-5 grid gap-4" onSubmit={formik.handleSubmit}>
              <label className="grid gap-1.5">
                <span className="text-sm font-semibold">Message</span>
                <textarea
                  className="min-h-36 rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-950"
                  {...formik.getFieldProps('message')}
                />
                {formik.touched.message && formik.errors.message ? (
                  <span className="text-xs text-red-600">{formik.errors.message}</span>
                ) : null}
              </label>
              <Button type="submit" icon={FiSend}>
                Postuler
              </Button>
            </form>
          )}
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <DetailSection title="Informations sur le poste">
          <DetailFacts
            items={[
              { label: 'Entreprise', value: job.publisherName || '—' },
              { label: 'Profil', value: job.businessId ? 'Entreprise' : 'Particulier' },
              { label: 'Secteur', value: job.sector || '—' },
              { label: 'Type de contrat', value: contractLabel },
              { label: 'Expérience', value: experienceLabel || '—' },
              { label: 'Localisation', value: job.location || '—' },
              { label: 'Début', value: job.startDate || '—' },
              { label: 'Date limite', value: job.applicationDeadline || '—' },
              { label: 'Statut', value: jobStatus.label },
              { label: 'Référence', value: job.id },
            ]}
          />
        </DetailSection>
        <div className="grid gap-5">
          {publisherProfile ? <PublisherDetailCard {...publisherProfile} /> : null}
          <TrustPanel
            title="Conseils aux candidats"
            items={[
              'Ne transmettez aucun paiement pour candidater.',
              'Échangez avec le recruteur dans la messagerie.',
              'Vérifiez les conditions avant d’accepter une mission.',
            ]}
          />
        </div>
      </div>
    </div>
  )
}
