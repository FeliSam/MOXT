import { FiCheckCircle, FiGlobe, FiShield, FiUsers } from 'react-icons/fi'
import { Outlet } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { Brand } from './Brand'

const trustStats = [
  { icon: FiGlobe, value: '36+', label: 'Pays africains connectés' },
  { icon: FiShield, value: '100%', label: 'Profils vérifiés' },
  { icon: FiUsers, value: '24/7', label: 'Support en français' },
]

export function AuthLayout() {
  const location = useLocation()
  const registering = location.pathname === '/register'
  return (
    <main className="grid h-dvh overflow-y-auto lg:grid-cols-[1.1fr_0.9fr] lg:overflow-hidden">
      <section className="relative hidden overflow-hidden bg-[linear-gradient(135deg,#0f766e_0%,#08705f_45%,#2563eb_100%)] p-10 text-white lg:flex lg:h-full lg:flex-col lg:justify-between xl:p-12">
        <div className="absolute -left-24 top-32 size-96 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -bottom-32 right-0 size-80 rounded-full bg-brand-400/20 blur-3xl" />

        <div className="relative">
          <Brand iconOnly />
        </div>

        <div className="relative max-w-xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] backdrop-blur">
            <span className="ds-dot-pulse size-1.5 rounded-full bg-white" />
            MOXT · En ligne
          </p>
          <p className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight xl:text-5xl">
            Envoyez de l'argent, des colis et des opportunités entre l'Afrique et la Russie.
          </p>
          <p className="mt-5 text-base leading-7 text-white/75 xl:text-lg xl:leading-8">
            Transferts, colis, marketplace, jobs et entreprises vérifiées dans une seule
            plateforme, pensée pour la diaspora africaine en Russie.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {trustStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <stat.icon className="text-lg text-white/70" />
                <strong className="mt-3 block text-xl font-black tabular-nums">{stat.value}</strong>
                <span className="mt-1 block text-[11px] leading-4 text-white/60">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative flex items-center gap-2 text-sm text-white/60">
          <FiCheckCircle className="shrink-0" />
          Une plateforme claire, moderne et évolutive.
        </p>
      </section>

      <section className="scrollbar-hidden flex min-h-dvh items-center justify-center overflow-y-auto p-5 sm:p-8 lg:h-full lg:min-h-0">
        <div className={`w-full ${registering ? 'max-w-2xl' : 'max-w-md'}`}>
          <Outlet />
        </div>
      </section>
    </main>
  )
}
