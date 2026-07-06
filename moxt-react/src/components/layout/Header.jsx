import { FiBell, FiCheckCircle, FiChevronDown, FiClock, FiMessageSquare, FiMoon, FiSun } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import { getRouteMetadata } from '../../config/routeMeta'
import { useTheme } from '../../contexts/useTheme'
import { useLanguage } from '../../contexts/useLanguage'
import { selectUnreadMessageCount } from '../../features/selectors'
import { useSmartNavbar } from '../../hooks/useSmartNavbar'
import { LanguagePicker } from '../ui/LanguagePicker'
import { Brand } from './Brand'
import { GlobalSearch } from './GlobalSearch'

export function Header({ hideOnMobile = false }) {
  const dispatch = useDispatch()
  const location = useLocation()
  const route = getRouteMetadata(location.pathname)
  const user = useSelector((state) => state.auth.user)
  const unreadCount = useSelector(
    (state) =>
      state.communications.notifications.filter((item) => item.userId === user?.id && !item.read)
        .length,
  )
  const unreadMessagesCount = useSelector(selectUnreadMessageCount)
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, translateLabel } = useLanguage()
  const visible = useSmartNavbar({ disabled: location.pathname === '/messages' })

  return (
    <header
      className={`sticky top-0 z-20 shrink-0 px-3 pt-3 transition-transform duration-300 ease-out sm:px-5 lg:px-5 lg:pt-4 ${
        visible ? 'translate-y-0' : '-translate-y-[calc(100%+1rem)]'
      } ${hideOnMobile ? 'hidden lg:block' : ''}`}
    >
      <div className="mx-auto flex max-w-[96rem] items-center gap-3 rounded-[1.4rem] border border-[var(--app-border)] bg-[var(--app-surface)]/94 px-3 py-3 shadow-[var(--shadow-card)] backdrop-blur-xl sm:px-5 lg:min-h-[4.75rem] lg:px-6">

        <Link
          to="/profile"
          aria-label="Ouvrir mon profil"
          className="hidden size-11 shrink-0 place-items-center rounded-full transition hover:bg-[var(--app-surface-muted)] max-lg:grid"
        >
          <UserAvatar user={user} size={36} />
        </Link>

        <div className="hidden w-[8rem] shrink-0 lg:flex xl:hidden">
          <Brand compact />
        </div>

        {/* Recherche globale — desktop uniquement */}
        <div className="hidden flex-1 lg:block lg:max-w-[26rem]">
          <GlobalSearch />
        </div>

        <div className="min-w-0 flex-1 lg:hidden">
          <p className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-brand-700">
            {translateLabel(route.eyebrow)}
          </p>
          <p className="truncate text-sm font-black">{translateLabel(route.title)}</p>
        </div>

        <div className="hidden min-w-0 flex-1 md:block lg:hidden" />

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <Link
            to="/notifications"
            className="relative grid size-10 place-items-center rounded-2xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)]"
            aria-label={`Notifications${unreadCount ? ` (${unreadCount} non lues)` : ''}`}
          >
            <FiBell className="text-lg" />
            {unreadCount ? (
              <span className="absolute right-0 top-0 grid min-w-[1.05rem] place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </Link>

          <Link
            to="/messages"
            className="relative grid size-10 place-items-center rounded-2xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)] lg:hidden"
            aria-label={`Messagerie${unreadMessagesCount ? ` (${unreadMessagesCount} non lus)` : ''}`}
          >
            <FiMessageSquare className="text-lg" />
            {unreadMessagesCount ? (
              <span className="absolute right-0 top-0 grid min-w-[1.05rem] place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm">
                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
              </span>
            ) : null}
          </Link>

          <LanguagePicker language={language} setLanguage={setLanguage} className="hidden lg:block" />

          <button
            className="hidden size-10 place-items-center rounded-2xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)] sm:grid"
            aria-label={theme === 'dark' ? 'Activer le theme clair' : 'Activer le theme sombre'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </button>

          <Link
            to="/transfers/history"
            className="hidden size-10 place-items-center rounded-2xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)] sm:grid"
            aria-label="Historique des transferts"
          >
            <FiClock className="text-lg" />
          </Link>

          <Link
            to="/profile"
            className="hidden min-w-0 items-center gap-2.5 rounded-2xl py-1 pl-1.5 pr-2.5 transition hover:bg-[var(--app-surface-muted)] xl:flex"
          >
            <UserAvatar user={user} />
            <span className="min-w-0">
              <strong className="block max-w-[8rem] truncate text-xs font-black">
                {user?.firstName || 'Mon compte'}
              </strong>
              {user?.verified ? (
                <span className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-brand-700 dark:text-brand-300">
                  <FiCheckCircle className="text-[10px]" />
                  Verifie
                </span>
              ) : (
                <small className="mt-0.5 block text-[10px] text-[var(--app-text-faint)]">
                  Bienvenue sur MOXT
                </small>
              )}
            </span>
            <FiChevronDown className="ml-1 shrink-0 text-sm text-[var(--app-text-faint)]" />
          </Link>

          <Link
            to="/profile"
            aria-label="Ouvrir mon profil"
            className="hidden size-10 shrink-0 place-items-center rounded-full transition hover:bg-[var(--app-surface-muted)] lg:grid xl:hidden"
          >
            <UserAvatar user={user} size={36} />
          </Link>
        </div>
      </div>
    </header>
  )
}

function UserAvatar({ user, size = 40 }) {
  const ring = user?.verified ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-[var(--app-surface)]' : ''
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={`${user.firstName || 'Utilisateur'} ${user.lastName || ''}`.trim()}
        style={{ width: size, height: size }}
        className={`shrink-0 rounded-full object-cover shadow-sm ${ring}`}
      />
    )
  }
  return (
    <span
      style={{ width: size, height: size }}
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-700 to-[var(--app-teal)] text-xs font-black text-white shadow-sm ${ring}`}
    >
      {user?.firstName?.[0]}
      {user?.lastName?.[0]}
    </span>
  )
}
