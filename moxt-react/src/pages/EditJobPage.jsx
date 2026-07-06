import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { CitySelector } from '../components/ui/CitySelector'
import { PageHeader } from '../components/ui/PageHeader'
import { JOB_CONTRACTS } from '../config/options'
import { updateJob } from '../features/jobs/jobSlice'
import { useState } from 'react'

export function EditJobPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { jobId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const job = useSelector((state) => state.jobs.items.find((item) => item.id === jobId))

  const [form, setForm] = useState(null)

  if (!job) return <Card>Offre introuvable.</Card>
  if (job.ownerId !== user.id) return <Navigate to={`/jobs/${jobId}`} replace />

  const values = form ?? {
    title: job.title || '',
    sector: job.sector || '',
    contractType: job.contractType || 'full_time',
    experienceLevel: job.experienceLevel || 'none',
    language: job.language || 'fr_ru',
    salary: job.salary || '',
    salaryPeriod: job.salaryPeriod || 'month',
    description: job.description || '',
    requirements: job.requirements || '',
    benefits: job.benefits || '',
    location: job.location || '',
    remote: job.remote || false,
    startDate: job.startDate || '',
    applicationDeadline: job.applicationDeadline || '',
    publisherName: job.publisherName || '',
  }

  function set(field, value) {
    setForm((prev) => ({ ...(prev ?? values), [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    dispatch(updateJob({ ...values, id: jobId, ownerId: user.id }))
    navigate(`/jobs/${jobId}`)
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Jobs"
        title="Modifier l'offre d'emploi"
        description="Mettez à jour les informations de votre offre."
        actions={
          <Link to={`/jobs/${jobId}`}>
            <Button variant="secondary" icon={FiArrowLeft}>Annuler</Button>
          </Link>
        }
      />
      <Card className="mx-auto w-full max-w-3xl">
        <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Intitulé du poste"
              required
              value={values.title}
              onChange={(e) => set('title', e.target.value)}
            />
            <Input
              label="Secteur d'activité"
              value={values.sector}
              onChange={(e) => set('sector', e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Type de contrat"
              value={values.contractType}
              onChange={(e) => set('contractType', e.target.value)}
            >
              {JOB_CONTRACTS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
            <Select
              label="Expérience requise"
              value={values.experienceLevel}
              onChange={(e) => set('experienceLevel', e.target.value)}
            >
              <option value="none">Sans expérience</option>
              <option value="junior">1–2 ans (Junior)</option>
              <option value="mid">3–5 ans (Confirmé)</option>
              <option value="senior">5+ ans (Expert)</option>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Rémunération"
              placeholder="Ex : 95 000 RUB"
              value={values.salary}
              onChange={(e) => set('salary', e.target.value)}
            />
            <Select
              label="Période"
              value={values.salaryPeriod}
              onChange={(e) => set('salaryPeriod', e.target.value)}
            >
              <option value="hour">Par heure</option>
              <option value="day">Par jour</option>
              <option value="month">Par mois</option>
              <option value="project">Par projet</option>
            </Select>
          </div>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">Description</span>
            <textarea
              className="min-h-32 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">Profil recherché</span>
            <textarea
              className="min-h-24 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              value={values.requirements}
              onChange={(e) => set('requirements', e.target.value)}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">Avantages (optionnel)</span>
            <textarea
              className="min-h-20 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              value={values.benefits}
              onChange={(e) => set('benefits', e.target.value)}
            />
          </label>
          <CitySelector
            label="Lieu"
            value={values.location}
            onChange={(city) => set('location', city)}
          />
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-[var(--app-border)] p-4 transition hover:border-brand-400">
            <input
              type="checkbox"
              checked={values.remote}
              onChange={(e) => set('remote', e.target.checked)}
              className="size-5 accent-brand-700"
            />
            <div>
              <p className="text-sm font-bold">Télétravail possible</p>
              <p className="text-xs text-[var(--app-text-muted)]">Le poste peut être exercé à distance</p>
            </div>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Date de début (optionnel)"
              type="date"
              value={values.startDate}
              onChange={(e) => set('startDate', e.target.value)}
            />
            <Input
              label="Date limite candidature"
              type="date"
              value={values.applicationDeadline}
              onChange={(e) => set('applicationDeadline', e.target.value)}
            />
          </div>
          <Input
            label="Nom de l'employeur affiché"
            value={values.publisherName}
            onChange={(e) => set('publisherName', e.target.value)}
          />
          <Button type="submit" icon={FiSave}>Enregistrer les modifications</Button>
        </form>
      </Card>
    </div>
  )
}
