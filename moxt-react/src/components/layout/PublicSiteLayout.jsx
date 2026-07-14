import { FiMoon, FiSearch, FiSun } from 'react-icons/fi'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTheme } from '../../contexts/useTheme'
import { useLanguage } from '../../contexts/useLanguage'
import { useSmartNavbar } from '../../hooks/useSmartNavbar'
import { Button } from '../ui/Button'
import { LanguageSwitcher } from '../ui/LanguageSwitcher'
import { Brand } from './Brand'

const publicLinks = [
  { key: 'home', path: '/' },
  { key: 'solution', path: '/presentation' },
  { key: 'discover', path: '/discover' },
  { key: 'trust', path: '/trust' },
  { key: 'faq', path: '/faq' },
]

export function PublicSiteLayout({ children }) {
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()
  const visible = useSmartNavbar()

  return (
    <div className="min-h-screen overflow-x-clip">
      <header
        className={`app-top-header sticky top-0 z-[var(--z-nav)] border-b border-[var(--app-border)] bg-[color:var(--app-bg)]/90 px-4 py-3 backdrop-blur-xl transition-transform duration-300 sm:px-6 ${
          visible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link to="/" aria-label={t('public.nav.homeAria')}>
            <Brand iconOnly />
          </Link>
          <nav
            className="ml-auto hidden items-center gap-1 md:flex"
            aria-label={t('public.nav.aria')}
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
                {t(`public.nav.${item.key}`)}
              </NavLink>
            ))}
          </nav>
          <Link
            to="/discover"
            className="grid size-10 place-items-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] md:hidden"
            aria-label={t('public.nav.searchAria')}
          >
            <FiSearch />
          </Link>
          <LanguageSwitcher className="hidden shrink-0 xl:block" />
          <button
            type="button"
            className="grid size-10 place-items-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}
          >
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </button>
          <Link to="/login" className="hidden sm:block">
            <Button variant="secondary">{t('public.auth.login')}</Button>
          </Link>
          <Link to="/register">
            <Button>{t('public.auth.register')}</Button>
          </Link>
        </div>
      </header>

      <main className="page-enter">
        {children ? (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</div>
        ) : (
          <Outlet />
        )}
      </main>

      <footer className="border-t border-[var(--app-border)] px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[var(--app-text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Brand />
            <p className="mt-2 text-xs">
              {t('public.footer.copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
          <p>{t('public.footer.tagline')}</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/trust">{t('public.footer.security')}</Link>
            <Link to="/faq">{t('public.footer.help')}</Link>
            <Link to="/legal/mentions">{t('legal.nav.mentions')}</Link>
            <Link to="/legal/cgu">{t('legal.nav.cgu')}</Link>
            <Link to="/legal/privacy">{t('legal.nav.privacy')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
