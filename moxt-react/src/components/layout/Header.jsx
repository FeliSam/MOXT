import { FiBell, FiChevronDown, FiClock, FiFileText, FiHeart, FiMessageSquare, FiMoon, FiSun } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import { getRouteMetadata } from '../../config/routeMeta'
import { useTheme } from '../../contexts/useTheme'
import { useLanguage } from '../../contexts/useLanguage'
import { selectUnreadMessageCount, selectUnreadNotificationCount } from '../../features/selectors'
import { useSmartNavbar } from '../../hooks/useSmartNavbar'
import { CountBounce } from '../ui/CountBounce'
import { LanguageSwitcher } from '../ui/LanguageSwitcher'
import { VerifiedDisplayName } from '../ui/Badge'
import { isProfileVerified } from '../../features/profile/userProfileUtils'
import { Brand } from './Brand'
import { GlobalSearch } from './GlobalSearch'

export function Header({ hideOnMobile = false }) {
  const location = useLocation()
  const route = getRouteMetadata(location.pathname)
  const user = useSelector((state) => state.auth.user)
  const unreadCount = useSelector(selectUnreadNotificationCount)
  const unreadMessagesCount = useSelector(selectUnreadMessageCount)
  const { theme, toggleTheme } = useTheme()
  const { t, translateLabel } = useLanguage()
  const visible = useSmartNavbar({ disabled: location.pathname === '/messages' })

  return (
    <header
      className={`app-top-header sticky top-0 z-[var(--z-nav)] shrink-0 px-3 pt-3 transition-transform duration-300 ease-out sm:px-5 lg:px-5 lg:pt-4 ${
        visible ? 'translate-y-0' : '-translate-y-[calc(100%+1rem)]'
      } ${hideOnMobile ? 'hidden lg:block' : ''}`}
    >
      <div className="mx-auto flex max-w-[96rem] items-center gap-3 rounded-[1.4rem] border border-[var(--app-border)] bg-[var(--app-surface)]/94 px-3 py-3 shadow-[var(--shadow-card)] backdrop-blur-xl sm:px-5 lg:min-h-[4.75rem] lg:px-6">

        <Link
          to="/profile"
          aria-label={t('settings.profileSecurity.openProfile')}
          className="hidden size-11 shrink-0 place-items-center rounded-full transition hover:bg-[var(--app-surface-muted)] max-lg:grid"
        >
          <UserAvatar user={user} size={36} />
        </Link>

        <div className="hidden w-[8rem] shrink-0 lg:flex xl:hidden">
          <Brand compact iconOnly />
        </div>

        {/* Recherche globale — desktop uniquement */}
        <div className="hidden flex-1 lg:block lg:max-w-[26rem]">
          <GlobalSearch />
        </div>

        <div className="min-w-0 flex-1 lg:hidden">
          <p className="hidden truncate text-[9px] font-black uppercase tracking-[0.16em] text-brand-700 sm:block">
            {translateLabel(route.eyebrow)}
          </p>
          <p className="truncate text-sm font-black leading-tight">{translateLabel(route.title)}</p>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1.5">
          <Link
            to="/news"
            className="header-action-btn grid lg:hidden"
            aria-label={t('nav.news')}
          >
            <FiFileText className="text-lg" />
          </Link>

          <Link
            to="/notifications"
            className="header-action-btn relative grid"
            aria-label={
              unreadCount
                ? t('nav.notificationsUnreadAria', { count: unreadCount })
                : t('notifications.title')
            }
          >
            <FiBell className="text-lg" />
            {unreadCount ? (
              <CountBounce
                value={unreadCount}
                className="absolute right-0 top-0 grid min-w-[1.05rem] place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm"
              />
            ) : null}
          </Link>

          <Link
            to="/transfers/history"
            className="header-action-btn grid"
            aria-label={t('dashboard.overview.history')}
          >
            <FiClock className="text-lg" />
          </Link>

          <Link
            to="/messages"
            className="header-action-btn relative grid lg:hidden"
            aria-label={
              unreadMessagesCount
                ? t('nav.messagesUnreadAria', { count: unreadMessagesCount })
                : t('nav.messages')
            }
          >
            <FiMessageSquare className="text-lg" />
            {unreadMessagesCount ? (
              <CountBounce
                value={unreadMessagesCount}
                className="absolute right-0 top-0 grid min-w-[1.05rem] place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm"
              />
            ) : null}
          </Link>

          <Link
            to="/favorites"
            className="header-action-btn hidden lg:grid"
            aria-label={t('favorites.title')}
          >
            <FiHeart className="text-lg" />
          </Link>

          <LanguageSwitcher className="hidden shrink-0 xl:block" />

          <button
            type="button"
            className="header-action-btn btn-press hidden sm:grid"
            aria-label={
              theme === 'dark' ? t('nav.enableLightTheme') : t('nav.enableDarkTheme')
            }
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <FiSun className="transition-transform duration-300" /> : <FiMoon className="transition-transform duration-300" />}
          </button>

          <Link
            to="/profile"
            className="hidden min-w-0 items-center gap-2.5 rounded-2xl py-1 pl-1.5 pr-2.5 transition hover:bg-[var(--app-surface-muted)] xl:flex"
          >
            <UserAvatar user={user} />
            <span className="min-w-0">
              <VerifiedDisplayName
                as="strong"
                name={user?.firstName || 'Mon compte'}
                verified={isProfileVerified(user)}
                iconSize="sm"
                className="max-w-[8rem] text-xs font-black"
                nameClassName="truncate"
              />
              {!isProfileVerified(user) ? (
                <small className="mt-0.5 block text-[10px] text-[var(--app-text-faint)]">
                  {t('dashboard.hero.welcome', { name: 'MOXT' })}
                </small>
              ) : null}
            </span>
            <FiChevronDown className="ml-1 shrink-0 text-sm text-[var(--app-text-faint)]" />
          </Link>

          <Link
            to="/profile"
            aria-label={t('settings.profileSecurity.openProfile')}
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
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()
  return (
    <span
      style={{ width: size, height: size }}
      className={`grid shrink-0 place-items-center whitespace-nowrap rounded-full bg-gradient-to-br from-brand-700 to-[var(--app-teal)] text-xs font-black text-white shadow-sm ${ring}`}
    >
      {initials}
    </span>
  )
}
