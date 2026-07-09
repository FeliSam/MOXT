import {
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiHome,
  FiPackage,
  FiShoppingBag,
  FiStar,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../ui/Modal'

const START_ACTIONS = [
  {
    to: '/dashboard',
    icon: FiHome,
    title: 'Accueil',
    description: 'Découvrez votre tableau de bord et vos premiers pas.',
    accent: 'from-emerald-500/20 to-teal-500/10',
    iconBg: 'bg-brand-700 text-white',
  },
  {
    to: '/marketplace',
    icon: FiShoppingBag,
    title: 'Marketplace',
    description: 'Achetez, vendez et explorez les annonces près de chez vous.',
    accent: 'from-blue-500/20 to-indigo-500/10',
    iconBg: 'bg-blue-600 text-white',
  },
  {
    to: '/parcels',
    icon: FiPackage,
    title: 'Colis',
    description: 'Envoyez ou recevez un colis entre l’Afrique et la Russie.',
    accent: 'from-amber-500/20 to-orange-500/10',
    iconBg: 'bg-amber-600 text-white',
  },
  {
    to: '/jobs',
    icon: FiBriefcase,
    title: 'Jobs',
    description: 'Trouvez une opportunité ou publiez une offre d’emploi.',
    accent: 'from-violet-500/20 to-purple-500/10',
    iconBg: 'bg-violet-600 text-white',
  },
  {
    to: '/verification',
    icon: FiCheckCircle,
    title: 'Vérifier le compte',
    description: 'Renforcez la confiance avec une vérification d’identité.',
    accent: 'from-rose-500/20 to-pink-500/10',
    iconBg: 'bg-rose-600 text-white',
    span: 'col-span-full @md:col-span-1',
  },
]

export function WelcomeModal({ open, onClose, user }) {
  const navigate = useNavigate()

  function handleAction(to) {
    onClose()
    navigate(to)
  }

  return (
    <Modal open={open} onClose={onClose} title="Bienvenue sur MOXT" size="large">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[linear-gradient(125deg,#07594d_0%,#08705f_48%,#245de8_100%)] p-5 text-white shadow-[0_24px_60px_rgb(7_89_77/0.22)] sm:p-6">
        <div className="absolute -right-16 -top-20 size-56 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 size-56 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-bold backdrop-blur">
            <FiStar />
            Compte créé avec succès
          </div>
          <h3 className="font-display mt-4 text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">
            Bonjour {user?.firstName || 'sur MOXT'} !
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
            Votre espace est prêt. MOXT réunit transferts, colis, marketplace, jobs et
            événements pour vos échanges entre l’Afrique et la Russie.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-black text-[var(--app-text)]">Par où commencer ?</p>
        <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
          Choisissez une action pour explorer la plateforme. Vous pourrez toujours y revenir
          depuis le menu.
        </p>
      </div>

      <div className="@container mt-5 grid gap-3 @md:grid-cols-2">
        {START_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.to}
              type="button"
              className={`group rounded-[1.35rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-900/5 dark:hover:border-brand-700 ${action.span || ''}`}
              onClick={() => handleAction(action.to)}
            >
              <div
                className={`rounded-[1.1rem] bg-gradient-to-br p-[1px] ${action.accent}`}
              >
                <div className="flex items-start gap-3 rounded-[1.05rem] bg-[var(--app-surface)] p-3">
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-2xl text-lg shadow-sm ${action.iconBg}`}
                  >
                    <Icon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-sm font-black text-[var(--app-text)]">
                        {action.title}
                      </strong>
                      <FiArrowRight className="shrink-0 text-sm text-[var(--app-text-faint)] transition group-hover:translate-x-0.5 group-hover:text-brand-700" />
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">
                      {action.description}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
