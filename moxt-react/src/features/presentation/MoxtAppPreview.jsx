import {
  FiBell,
  FiHome,
  FiMessageSquare,
  FiPackage,
  FiRepeat,
  FiSearch,
  FiShoppingBag,
} from 'react-icons/fi'

const NAV = [
  { icon: FiHome, label: 'Accueil' },
  { icon: FiRepeat, label: 'Transferts', active: true },
  { icon: FiPackage, label: 'Colis' },
  { icon: FiShoppingBag, label: 'Marketplace' },
  { icon: FiMessageSquare, label: 'Messages' },
]

function AppScreen({ mobile = false }) {
  return (
    <div
      className={`flex h-full flex-col bg-[var(--app-bg)] text-[var(--app-text)] ${
        mobile ? 'text-[10px]' : 'text-xs'
      }`}
    >
      <header className="flex items-center gap-2 border-b border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5">
        <img src="/assets/brand/moxt-x.png?v=20260714d" alt="" className="size-6 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-black">MOXT</p>
          <p className="truncate text-[9px] text-[var(--app-text-muted)]">Transferts · Colis · Services</p>
        </div>
        <span className="grid size-7 place-items-center rounded-lg bg-[var(--app-surface-muted)]">
          <FiBell className="text-[11px]" />
        </span>
      </header>

      <div className="flex-1 space-y-2 overflow-hidden p-2.5">
        <div className="rounded-xl bg-gradient-to-br from-brand-800 to-brand-600 p-3 text-white">
          <p className="text-[9px] font-bold uppercase tracking-wider text-brand-100">Transfert estimé</p>
          <p className={`mt-1 font-black tabular-nums ${mobile ? 'text-lg' : 'text-2xl'}`}>125 000 ₽</p>
          <p className="mt-0.5 text-[9px] text-brand-100">Cotonou → Moscou</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {['Colis', 'Jobs', 'Events', 'P2P'].map((label) => (
            <div
              key={label}
              className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-2.5"
            >
              <p className="font-bold">{label}</p>
              <p className="mt-0.5 text-[9px] text-[var(--app-text-muted)]">Découvrir</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-2.5">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
              <FiSearch />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">Change Diaspora</p>
              <p className="text-[9px] text-[var(--app-text-muted)]">Partenaire vérifié · Bénin</p>
            </div>
          </div>
        </div>
      </div>

      <nav
        className={`grid shrink-0 border-t border-[var(--app-border)] bg-[var(--app-surface)] ${
          mobile ? 'grid-cols-5 gap-0 px-1 py-1.5' : 'grid-cols-5 gap-1 px-2 py-2'
        }`}
      >
        {NAV.map(({ icon: Icon, label, active }) => (
          <span
            key={label}
            className={`flex flex-col items-center gap-0.5 rounded-lg px-1 py-1 ${
              active ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : 'text-[var(--app-text-muted)]'
            }`}
          >
            <Icon className={mobile ? 'text-[11px]' : 'text-sm'} />
            <span className="text-[8px] font-bold">{label}</span>
          </span>
        ))}
      </nav>
    </div>
  )
}

export function MoxtAppPreview() {
  return (
    <div className="grid items-center gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
      <div className="relative mx-auto w-full max-w-3xl">
        <div className="overflow-hidden rounded-[1.35rem] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--shadow-float)]">
          <div className="flex items-center gap-2 border-b border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-red-400" />
            <span className="size-2.5 rounded-full bg-amber-400" />
            <span className="size-2.5 rounded-full bg-emerald-400" />
            <span className="ml-2 truncate rounded-md bg-[var(--app-surface)] px-3 py-1 text-[10px] font-semibold text-[var(--app-text-muted)]">
              moxtapp.ru
            </span>
          </div>
          <div className="aspect-[16/10] min-h-[16rem]">
            <AppScreen />
          </div>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[17rem] justify-self-center lg:justify-self-end">
        <div className="rounded-[2rem] border-[10px] border-slate-900 bg-slate-900 p-1 shadow-[0_24px_60px_rgb(15_23_42/0.28)] dark:border-slate-700">
          <div className="overflow-hidden rounded-[1.35rem] bg-[var(--app-bg)]">
            <div className="flex justify-center bg-[var(--app-surface)] py-1.5">
              <span className="h-1 w-16 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>
            <div className="aspect-[9/19] min-h-[22rem]">
              <AppScreen mobile />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
