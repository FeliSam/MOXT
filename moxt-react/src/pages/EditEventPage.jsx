import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { CitySelector } from '../components/ui/CitySelector'
import { PageHeader } from '../components/ui/PageHeader'
import { EVENT_CATEGORIES } from '../config/options'
import { updateEvent } from '../features/events/eventSlice'

export function EditEventPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { eventId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const event = useSelector((state) => state.events.items.find((item) => item.id === eventId))

  const [form, setForm] = useState(null)

  if (!event) return <Card>Événement introuvable.</Card>
  if (event.ownerId !== user.id) return <Navigate to={`/events/${eventId}`} replace />

  const values = form ?? {
    title: event.title || '',
    category: event.category || '',
    format: event.format || 'in_person',
    language: event.language || 'fr',
    description: event.description || '',
    program: event.program || '',
    speakers: event.speakers || '',
    startAt: event.startAt ? event.startAt.slice(0, 16) : '',
    endAt: event.endAt ? event.endAt.slice(0, 16) : '',
    registrationDeadline: event.registrationDeadline ? event.registrationDeadline.slice(0, 10) : '',
    city: event.city || '',
    venue: event.venue || '',
    address: event.address || '',
    onlineLink: event.onlineLink || '',
    capacity: event.capacity ?? 50,
    price: event.price ?? 0,
    freeEntry: event.price === 0,
    organizerName: event.organizerName || '',
    organizerContact: event.organizerContact || '',
  }

  function set(field, value) {
    setForm((prev) => ({ ...(prev ?? values), [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    dispatch(updateEvent({
      ...values,
      id: eventId,
      ownerId: user.id,
      price: values.freeEntry ? 0 : Number(values.price),
      capacity: Number(values.capacity),
    }))
    navigate(`/events/${eventId}`)
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Événements"
        title="Modifier l'événement"
        description="Mettez à jour les informations de votre événement."
        actions={
          <Link to={`/events/${eventId}`}>
            <Button variant="secondary" icon={FiArrowLeft}>Annuler</Button>
          </Link>
        }
      />
      <Card className="mx-auto w-full max-w-3xl">
        <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
          <Input
            label="Titre de l'événement"
            required
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Catégorie"
              value={values.category}
              onChange={(e) => set('category', e.target.value)}
            >
              <option value="">Sélectionner</option>
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </Select>
            <Select
              label="Format"
              value={values.format}
              onChange={(e) => set('format', e.target.value)}
            >
              <option value="in_person">Présentiel</option>
              <option value="online">En ligne</option>
              <option value="hybrid">Hybride</option>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Début"
              type="datetime-local"
              value={values.startAt}
              onChange={(e) => set('startAt', e.target.value)}
            />
            <Input
              label="Fin (optionnel)"
              type="datetime-local"
              value={values.endAt}
              onChange={(e) => set('endAt', e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Date limite d'inscription"
              type="date"
              value={values.registrationDeadline}
              onChange={(e) => set('registrationDeadline', e.target.value)}
            />
            <Input
              label="Capacité (personnes)"
              type="number"
              min="1"
              value={values.capacity}
              onChange={(e) => set('capacity', e.target.value)}
            />
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
            <span className="text-sm font-bold">Programme / déroulé (optionnel)</span>
            <textarea
              className="min-h-20 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              value={values.program}
              onChange={(e) => set('program', e.target.value)}
            />
          </label>
          <Input
            label="Intervenants / Artistes (optionnel)"
            value={values.speakers}
            onChange={(e) => set('speakers', e.target.value)}
          />
          {values.format !== 'online' ? (
            <>
              <CitySelector
                label="Ville"
                value={values.city}
                onChange={(city) => set('city', city)}
              />
              <Input
                label="Nom du lieu"
                value={values.venue}
                onChange={(e) => set('venue', e.target.value)}
              />
              <Input
                label="Adresse complète"
                value={values.address}
                onChange={(e) => set('address', e.target.value)}
              />
            </>
          ) : null}
          {values.format !== 'in_person' ? (
            <Input
              label="Lien de connexion"
              value={values.onlineLink}
              onChange={(e) => set('onlineLink', e.target.value)}
            />
          ) : null}
          <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition ${
            values.freeEntry ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' : 'border-[var(--app-border)]'
          }`}>
            <input
              type="checkbox"
              checked={values.freeEntry}
              onChange={(e) => set('freeEntry', e.target.checked)}
              className="size-5 accent-brand-700"
            />
            <div>
              <p className="text-sm font-bold">Entrée gratuite</p>
              <p className="text-xs text-[var(--app-text-muted)]">Décochez pour définir un tarif</p>
            </div>
          </label>
          {!values.freeEntry ? (
            <Input
              label="Tarif d'entrée (RUB)"
              type="number"
              min="0"
              value={values.price}
              onChange={(e) => set('price', e.target.value)}
            />
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Organisateur (nom affiché)"
              value={values.organizerName}
              onChange={(e) => set('organizerName', e.target.value)}
            />
            <Input
              label="Contact de l'organisateur"
              value={values.organizerContact}
              onChange={(e) => set('organizerContact', e.target.value)}
            />
          </div>
          <Button type="submit" icon={FiSave}>Enregistrer les modifications</Button>
        </form>
      </Card>
    </div>
  )
}
