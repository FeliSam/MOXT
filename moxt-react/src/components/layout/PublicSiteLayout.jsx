import { FiMoon, FiSearch, FiSun } from 'react-icons/fi'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTheme } from '../../contexts/useTheme'
import { useLanguage } from '../../contexts/useLanguage'
import { cycleLanguage } from '../../config/uiTranslations'
import { useSmartNavbar } from '../../hooks/useSmartNavbar'
import { Button } from '../ui/Button'
import { Brand } from './Brand'

const publicLinks = [
  { label: 'Accueil', path: '/' },
  { label: 'Découvrir', path: '/discover' },
  { label: 'Confiance', path: '/trust' },
  { label: 'FAQ', path: '/faq' },
]

export function PublicSiteLayout() {
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, translateLabel } = useLanguage()
  const visible = useSmartNavbar()

  return (
    <div className="min-h-screen overflow-x-clip">
      <header
        className={`sticky top-0 z-30 border-b border-[var(--app-border)] bg-[color:var(--app-bg)]/90 px-4 py-3 backdrop-blur-xl transition-transform duration-300 sm:px-6 ${
          visible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link to="/" aria-label="Accueil MOXT">
            <Brand />
          </Link>
          <nav
            className="ml-auto hidden items-center gap-1 md:flex"
            aria-label="Navigation publique"
          >
            {publicLinks.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm font-bold ${
                    isActive
                      ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]'
                      : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface)]'
                  }`
                }
              >
                {translateLabel(item.label)}
              </NavLink>
            ))}
          </nav>
          <Link
            to="/discover"
            className="grid size-10 place-items-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] md:hidden"
            aria-label="Rechercher"
          >
            <FiSearch />
          </Link>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-xs font-black"
            onClick={() => setLanguage(cycleLanguage(language))}
            aria-label="Changer la langue"
          >
            {language.toUpperCase()}
          </button>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}
          >
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </button>
          <Link to="/login" className="hidden sm:block">
            <Button variant="secondary">Connexion</Button>
          </Link>
          <Link to="/register">
            <Button>Créer un compte</Button>
          </Link>
        </div>
      </header>

      <main className="page-enter">
        <Outlet />
      </main>

      <footer className="border-t border-[var(--app-border)] px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[var(--app-text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <Brand />
          <p>Plateforme de services pour la diaspora. Échangez en toute vigilance.</p>
          <div className="flex gap-4">
            <Link to="/trust">Sécurité</Link>
            <Link to="/faq">Aide</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
