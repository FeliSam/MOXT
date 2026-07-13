import {
  FiArrowRight,
  FiCheckCircle,
  FiGlobe,
  FiRepeat,
  FiShield,
  FiSmartphone,
  FiUsers,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { MoxtAppPreview } from '../features/presentation/MoxtAppPreview'
import { PUBLIC_SERVICES, TRUST_PRINCIPLES } from '../config/publicContent'

const PILLARS = [
  {
    icon: FiRepeat,
    title: 'Transferts suivis',
    description: 'Estimation, partenaires vérifiés et historique dans une seule interface.',
  },
  {
    icon: FiUsers,
    title: 'Communauté diaspora',
    description: 'Profils, entreprises, jobs, événements et messagerie pour échanger en confiance.',
  },
  {
    icon: FiShield,
    title: 'Confiance intégrée',
    description: 'Vérification téléphone, identité et entreprise avant les opérations sensibles.',
  },
  {
    icon: FiGlobe,
    title: 'Multilingue',
    description: 'Russe, français, anglais et portugais — bascule instantanée dans l’application.',
  },
]

export function PresentationPage() {
  return (
    <div className="grid gap-14 pb-10 sm:gap-16">
      <section className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-12">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--app-accent-soft)] px-4 py-2 text-xs font-black uppercase tracking-wider text-[var(--app-accent)]">
            <FiSmartphone className="text-sm" />
            Web · Mobile · PWA
          </span>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            MOXT, la solution pour relier l’Afrique et la Russie.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--app-text-muted)]">
            Une plateforme unique pour les transferts, le transport de colis, la marketplace,
            les entreprises de la diaspora et la communication — sur ordinateur comme sur
            téléphone.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register">
              <Button icon={FiArrowRight}>Commencer gratuitement</Button>
            </Link>
            <Link to="/discover">
              <Button variant="secondary">Explorer les services</Button>
            </Link>
          </div>
          <ul className="mt-6 grid gap-2 text-sm text-[var(--app-text-muted)]">
            <li className="flex items-center gap-2">
              <FiCheckCircle className="shrink-0 text-emerald-600" />
              Même expérience sur navigateur et application native
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="shrink-0 text-emerald-600" />
              Interface en russe par défaut, adaptable en un clic
            </li>
          </ul>
        </div>
        <MoxtAppPreview />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PILLARS.map((item) => (
          <Card key={item.title} className="min-w-0">
            <item.icon className="text-2xl text-brand-700 dark:text-brand-300" />
            <h2 className="mt-4 font-black">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{item.description}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6">
        <div>
          <h2 className="text-2xl font-black sm:text-3xl">Tous les services au même endroit</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--app-text-muted)]">
            MOXT regroupe les usages quotidiens de la diaspora : envoyer de l’argent, trouver un
            transporteur, publier une annonce ou contacter un professionnel vérifié.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PUBLIC_SERVICES.map((service) => (
            <Card key={service.id} variant="interactive" className="min-w-0">
              <service.icon className="text-xl text-brand-700 dark:text-brand-300" />
              <h3 className="mt-3 font-black">{service.label}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
                {service.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--app-border)] bg-gradient-to-br from-brand-900 via-brand-800 to-[var(--app-teal)] p-6 text-white sm:p-10">
        <h2 className="text-2xl font-black sm:text-3xl">Pourquoi choisir MOXT ?</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {TRUST_PRINCIPLES.map((item) => (
            <div key={item.title} className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <item.icon className="text-xl text-brand-100" />
              <h3 className="mt-3 font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-brand-50/90">{item.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/register">
            <Button className="!bg-white !text-brand-900 hover:!bg-brand-50">Créer mon compte</Button>
          </Link>
          <Link to="/trust">
            <Button variant="secondary" className="!border-white/30 !bg-white/10 !text-white">
              En savoir plus
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
