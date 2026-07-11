import { FiArrowRight, FiCheckCircle } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { VerifiedBadge } from '../../../components/ui/Badge'
import { RevealOnScroll } from '../../../components/ui/RevealOnScroll'
import { DashboardTransferCalculator } from '../../transfers/DashboardTransferCalculator'

export function DashboardHero({ user, onOpenCalculator }) {
  return (
    <RevealOnScroll
      as="section"
      className="relative overflow-hidden rounded-[2.25rem] bg-[linear-gradient(125deg,#07594d_0%,#08705f_42%,#245de8_100%)] px-6 py-8 text-white shadow-[0_35px_90px_rgb(7_89_77/0.22)] sm:px-10 sm:py-12 lg:min-h-[31rem] lg:px-14"
    >
      <div className="absolute -right-24 -top-32 size-96 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute -bottom-40 left-1/3 size-96 rounded-full bg-blue-400/25 blur-3xl" />
      <div className="relative z-10 grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-bold backdrop-blur">
              <FiCheckCircle /> Bienvenue {user.firstName}
            </div>
            {user.verified ? (
              <VerifiedBadge size="sm" className="border-white/25 bg-white/12 !text-white" />
            ) : null}
          </div>
          <h1 className="font-display mt-6 max-w-4xl text-4xl font-extrabold leading-[0.98] tracking-[-0.03em] sm:text-5xl lg:text-7xl">
            Tous vos services essentiels, réunis.
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
            Transferts, colis, ventes, jobs et événements dans une expérience simple,
            instantanée et pensée pour vos échanges entre l’Afrique et la Russie.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/transfers"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-emerald-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              Créer un transfert <FiArrowRight />
            </Link>
            <Link
              to="/jobs/publish"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-violet-200/80 bg-violet-500/90 px-5 text-sm font-black text-white shadow-lg shadow-violet-950/25 transition hover:-translate-y-0.5 hover:bg-violet-400/95"
            >
              Publier un job <FiArrowRight />
            </Link>
          </div>
        </div>
        <DashboardTransferCalculator onOpen={onOpenCalculator} />
      </div>
    </RevealOnScroll>
  )
}
