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
  const existing = applications.find(
    (item) => item.jobId === jobId && item.userId === user.id && item.status !== 'withdrawn',
  )
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
      <DetailMetrics
        items={[
          { icon: FiBriefcase, label: 'Contrat', value: job.contractType },
          { icon: FiMapPin, label: 'Lieu', value: job.location },
          {
            icon: FiUsers,
            label: 'Candidatures',
            value: `${
              applications.filter((item) => item.jobId === jobId && item.status !== 'withdrawn')
                .length
            }`,
          },
          { icon: FiBriefcase, label: 'Rémunération', value: job.salary },
        ]}
      />
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{job.contractType}</Badge>
            <Badge tone="success">{job.salary}</Badge>
            <Badge tone={jobStatus.tone}>{jobStatus.label}</Badge>
            {job.businessId ? <VerifiedBadge size="sm" label="Entreprise" /> : null}
          </div>
          <h2 className="mt-6 font-black">Description</h2>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{job.description}</p>
          <h2 className="mt-6 font-black">Profil recherché</h2>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{job.requirements}</p>
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
          <div className="mt-3">
            <FavoriteButton
              relatedId={job.id}
              relatedType="job"
              title={job.title}
              path={`/jobs/${job.id}`}
              entity={job}
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
              {
                applications.filter((item) => item.jobId === jobId && item.status !== 'withdrawn')
                  .length
              }{' '}
              candidature(s) reçue(s).
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
              { label: 'Entreprise', value: job.publisherName },
              { label: 'Profil', value: job.businessId ? 'Entreprise' : 'Particulier' },
              { label: 'Secteur', value: job.sector },
              { label: 'Type de contrat', value: job.contractType },
              { label: 'Localisation', value: job.location },
              { label: 'Statut', value: job.status },
              { label: 'Référence', value: job.id },
            ]}
          />
        </DetailSection>
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
  )
}
