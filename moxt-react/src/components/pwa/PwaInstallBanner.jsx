import { useEffect, useState } from 'react'
import { FiShare, FiX } from 'react-icons/fi'
import { isStandalone } from '../../pwa'
import { canUseWebPushApi, isIosDevice } from '../../platform/webPush'

const DISMISS_KEY = 'moxt-pwa-install-banner-dismissed'

export function PwaInstallBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isIosDevice() || isStandalone() || !canUseWebPushApi()) return
    if (localStorage.getItem(DISMISS_KEY) === '1') return
    setVisible(true)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[var(--z-nav)] lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-md">
      <div className="rounded-2xl border border-brand-200/70 bg-[var(--app-surface)] p-4 shadow-xl dark:border-brand-800/60">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white">
            <FiShare aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black">Installez MOXT pour les notifications</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--app-text-muted)]">
              Sur iPhone, ajoutez MOXT à l&apos;écran d&apos;accueil via Safari (Partager → Sur
              l&apos;écran d&apos;accueil), puis activez les notifications dans Paramètres.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1 text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)]"
            aria-label="Fermer"
            onClick={() => {
              localStorage.setItem(DISMISS_KEY, '1')
              setVisible(false)
            }}
          >
            <FiX />
          </button>
        </div>
      </div>
    </div>
  )
}
