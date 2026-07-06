import { useEffect, useMemo, useState } from 'react'
import { FiLogOut, FiSearch, FiSettings, FiUser, FiX } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { navigationGroups } from '../../config/navigation'
import { bottomNavigationPaths } from '../../config/primaryNavigation'
import { logout } from '../../features/auth/authSlice'
import { stopRealtimeSubscription } from '../../services/realtimeService'
import { useLanguage } from '../../contexts/useLanguage'
import { MoreServicesContent } from './MoreServicesContent'
import { filterNavigationGroups, useNavigationBadges } from './moreServicesUtils'

export function MobileMoreDrawer({ open, onClose }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const role = user?.role
  const state = useSelector((v) => v)
  const { translateLabel } = useLanguage()
  const [query, setQuery] = useState('')
  const [closing, setClosing] = useState(false)

  const badgeForItem = useNavigationBadges(user?.id)

  useEffect(() => {
    if (!open) return undefined
    function onKey(event) {
      if (event.key === 'Escape') requestClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(
    () => navigationGroups.filter((group) => !group.roles || group.roles.includes(role)),
    [role],
  )

  const filteredGroups = useMemo(
    () => filterNavigationGroups(groups, role, bottomNavigationPaths, query, translateLabel),
    [groups, query, role, translateLabel],
  )

  function requestClose() {
    setClosing(true)
    setTimeout(() => {
      onClose()
      setClosing(false)
      setQuery('')
    }, 220)
  }

  async function handleLogout() {
    stopRealtimeSubscription()
    await dispatch(logout())
    requestClose()
    navigate('/login')
  }

  if (!open && !closing) return null

  return (
    <div className="fixed inset-0 z-[55] lg:hidden">
      <button
        type="button"
        aria-label="Fermer les services"
        onClick={requestClose}
        className={`absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] ${
          closing ? 'animate-[fadeOut_200ms_ease-in_forwards]' : 'animate-[fadeIn_200ms_ease-out_forwards]'
        }`}
      />

      <div
        className={`absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[1rem] border border-b-0 border-[var(--app-border)] bg-[var(--app-bg)] shadow-[var(--shadow-float)] ${
          closing ? 'drawer-leave' : 'drawer-enter'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-center pt-2.5">
          <span className="h-1 w-9 rounded-full bg-[var(--app-border-md)]" />
        </div>

        <header className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-surface)] px-4 pb-4 pt-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-700">
                MOXT
              </p>
              <h2 className="font-display text-xl font-extrabold tracking-tight text-[var(--app-text)]">
                Tous les services
              </h2>
              <p className="mt-1 text-xs text-[var(--app-text-muted)]">
                Accédez aux modules hors barre de navigation.
              </p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Fermer"
              className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-btn)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface)]"
            >
              <FiX />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-input)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2.5">
            <FiSearch className="shrink-0 text-[var(--app-text-faint)]" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un service..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--app-text-faint)]"
            />
          </div>
        </header>

        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-4 py-4" data-navbar-ignore>
          <MoreServicesContent
            badgeFor={(item) => badgeForItem(item, state)}
            groups={filteredGroups}
            layout="grid"
            onNavigate={requestClose}
            translateLabel={translateLabel}
          />
        </div>

        <footer className="shrink-0 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
          <div className="mb-2 grid grid-cols-2 gap-2">
            <Link
              to="/profile"
              onClick={requestClose}
              className="flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-btn)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-xs font-semibold text-[var(--app-text)] transition hover:bg-[var(--app-surface)]"
            >
              <FiUser className="text-base text-[var(--app-accent)]" />
              Mon profil
            </Link>
            <Link
              to="/settings"
              onClick={requestClose}
              className="flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-btn)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-xs font-semibold text-[var(--app-text)] transition hover:bg-[var(--app-surface)]"
            >
              <FiSettings className="text-base text-[var(--app-accent)]" />
              Réglages
            </Link>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-btn)] border border-red-200 bg-red-50 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/35"
          >
            <FiLogOut />
            Déconnexion
          </button>
        </footer>
      </div>
    </div>
  )
}
