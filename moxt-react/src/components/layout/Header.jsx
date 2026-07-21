import {
  FiBell,
  FiBookOpen,
  FiBriefcase,
  FiChevronDown,
  FiClock,
  FiFileText,
  FiHeart,
  FiMessageSquare,
  FiMoon,
  FiSun,
} from 'react-icons/fi'
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

function HeaderActionLabel({ children }) {
  return (
    <span className="header-action-label" role="tooltip">
      {children}
    </span>
  )
}

function pathMatches(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

/** Mobile header shortcuts — contextual per section. */
function getMobileHeaderActions(pathname) {
  const isTransfers = pathMatches(pathname, '/transfers')
  const isParcels = pathMatches(pathname, '/parcels')
  const isNews = pathMatches(pathname, '/news')
  return {
    showNews: !isTransfers && !isParcels && !isNews,
    showGuide: isNews,
    showHistory: isTransfers,
    showJobs: isParcels,
    showMessages: true,
  }
}

export function Header({ hideOnMobile = false }) {
  const location = useLocation()
  const route = getRouteMetadata(location.pathname)
  const user = useSelector((state) => state.auth.user)
  const unreadCount = useSelector(selectUnreadNotificationCount)
  const unreadMessagesCount = useSelector(selectUnreadMessageCount)
  const { theme, toggleTheme } = useTheme()
  const { t, translateLabel } = useLanguage()
  const visible = useSmartNavbar({ disabled: location.pathname === '/messages' })
  const mobileActions = getMobileHeaderActions(location.pathname)

  return (
    <header
      data-tour="header"
      className={`app-top-header sticky top-0 z-[var(--z-nav)] shrink-0 px-3 pt-5 transition-transform duration-300 ease-out sm:px-5 sm:pt-5 lg:px-5 lg:pt-5 ${
        visible ? 'translate-y-0' : '-translate-y-[calc(100%+1rem)]'
      } ${hideOnMobile ? 'hidden lg:block' : ''}`}
    >
      <div className="mx-auto flex max-w-[96rem] items-center gap-1.5 sm:gap-2 lg:min-h-[4.75rem] lg:gap-3 lg:rounded-[1.4rem] lg:border lg:border-[var(--app-border)]/80 lg:bg-[var(--app-surface)]/65 lg:px-6 lg:py-3 lg:shadow-[var(--shadow-card)] lg:backdrop-blur-xl">
        {/* Mobile: avatar + page title share one pill. Desktop: children flow into outer pill. */}
        <div className="header-brand-chip flex h-[3.1625rem] min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--app-border)]/80 bg-[var(--app-surface)]/65 px-1.5 pr-2.5 backdrop-blur-md sm:h-[3.47875rem] sm:gap-2.5 sm:pr-3 lg:contents lg:h-auto lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <Link
            to="/profile"
            aria-label={t('settings.profileSecurity.openProfile')}
            className="hidden size-[2.3rem] shrink-0 place-items-center rounded-full transition hover:bg-[var(--app-surface-muted)]/60 max-lg:grid sm:size-[2.5875rem]"
          >
            <UserAvatar user={user} size={37} />
          </Link>

          <div className="hidden w-[8rem] shrink-0 lg:flex xl:hidden">
            <Brand compact iconOnly />
          </div>

          <div className="hidden flex-1 lg:block lg:max-w-[26rem]" data-tour="header-search">
            <GlobalSearch />
          </div>

          <div className="min-w-0 flex-1 lg:hidden">
            <p className="truncate text-sm font-black leading-none text-[var(--app-text)] sm:text-[0.9375rem]" title={translateLabel(route.title)}>
              {translateLabel(route.title)}
            </p>
          </div>
        </div>

        <div
          className="ml-auto flex h-[3.1625rem] shrink-0 items-center gap-1.5 sm:h-[3.47875rem] lg:h-auto lg:gap-1.5"
          data-tour="header-actions"
        >
          {mobileActions.showNews ? (
            <Link
              to="/news"
              data-tour="header-news"
              className="header-action-btn relative grid lg:hidden"
              aria-label={t('nav.news')}
            >
              <FiFileText className="header-action-icon" strokeWidth={2.1} aria-hidden="true" />
              <HeaderActionLabel>{t('nav.news')}</HeaderActionLabel>
            </Link>
          ) : null}

          {mobileActions.showGuide ? (
            <Link
              to="/guide"
              className="header-action-btn relative grid lg:hidden"
              aria-label={t('nav.guide')}
            >
              <FiBookOpen className="header-action-icon" strokeWidth={2.1} aria-hidden="true" />
              <HeaderActionLabel>{t('nav.guide')}</HeaderActionLabel>
            </Link>
          ) : null}

          {mobileActions.showJobs ? (
            <Link
              to="/jobs"
              className="header-action-btn relative grid lg:hidden"
              aria-label={t('nav.jobs')}
            >
              <FiBriefcase className="header-action-icon" strokeWidth={2.1} aria-hidden="true" />
              <HeaderActionLabel>{t('nav.jobs')}</HeaderActionLabel>
            </Link>
          ) : null}

          {/* Desktop: toujours visible. Mobile: uniquement sur les pages transferts. */}
          <Link
            to="/transfers/history"
            className={`header-action-btn relative ${
              mobileActions.showHistory ? 'grid' : 'hidden lg:grid'
            }`}
            aria-label={t('dashboard.overview.history')}
          >
            <FiClock className="header-action-icon" strokeWidth={2.1} aria-hidden="true" />
            <HeaderActionLabel>{t('dashboard.overview.history')}</HeaderActionLabel>
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
            <FiBell className="header-action-icon" strokeWidth={2.1} aria-hidden="true" />
            {unreadCount ? (
              <CountBounce
                value={unreadCount}
                className="absolute right-0 top-0 z-[1] grid min-w-[1.05rem] place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm"
              />
            ) : null}
            <HeaderActionLabel>{t('notifications.title')}</HeaderActionLabel>
          </Link>

          {mobileActions.showMessages ? (
            <Link
              to="/messages"
              className="header-action-btn relative grid lg:hidden"
              aria-label={
                unreadMessagesCount
                  ? t('nav.messagesUnreadAria', { count: unreadMessagesCount })
                  : t('nav.messages')
              }
            >
              <FiMessageSquare className="header-action-icon" strokeWidth={2.1} aria-hidden="true" />
              {unreadMessagesCount ? (
                <CountBounce
                  value={unreadMessagesCount}
                  className="absolute right-0 top-0 z-[1] grid min-w-[1.05rem] place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm"
                />
              ) : null}
              <HeaderActionLabel>{t('nav.messages')}</HeaderActionLabel>
            </Link>
          ) : null}

          <Link
            to="/favorites"
            className="header-action-btn relative hidden lg:grid"
            aria-label={t('favorites.title')}
          >
            <FiHeart className="header-action-icon" strokeWidth={2.1} aria-hidden="true" />
            <HeaderActionLabel>{t('favorites.title')}</HeaderActionLabel>
          </Link>

          <LanguageSwitcher className="hidden shrink-0 xl:block" />

          <button
            type="button"
            className="header-action-btn btn-press relative hidden sm:grid"
            aria-label={
              theme === 'dark' ? t('nav.enableLightTheme') : t('nav.enableDarkTheme')
            }
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <FiSun className="header-action-icon transition-transform duration-300" strokeWidth={2.1} />
            ) : (
              <FiMoon className="header-action-icon transition-transform duration-300" strokeWidth={2.1} />
            )}
            <HeaderActionLabel>
              {theme === 'dark' ? t('nav.enableLightTheme') : t('nav.enableDarkTheme')}
            </HeaderActionLabel>
          </button>

          <Link
            to="/profile"
            data-tour="header-profile"
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
            data-tour="header-profile"
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
