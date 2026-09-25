import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { useAvatarModule } from '../../platform/useAvatarModule'
import { hasSeenWelcome, isTourPreview, isWelcomePending } from '../../onboarding/welcomeStorage'
import { updateAccountPreferences } from '../accountSlice'
import { AvatarDicebearEditorLazy } from './AvatarDicebearEditorLazy'
import {
  clearLocalPromptState,
  markPromptShownThisSession,
  mergePromptStates,
  readLocalPromptState,
  recordPromptShown,
  shouldShowAvatarPrompt,
  wasPromptShownThisSession,
  writeLocalPromptState,
} from './avatarPrompt'

const AvatarPromptSheet = lazy(() => import('./AvatarPromptSheet.jsx'))

/** Inscription / vérification / onboarding : jamais d’invitation. */
const BLOCKED_PATH = /^\/(register|login|signup|onboarding|verification|auth|welcome)(\/|$)/

/**
 * Invitation « Personnaliser mon avatar » à la connexion (voir avatarPrompt.js pour les règles).
 * Activation, maximum, intervalle et délai avant décision (défaut 3,5 s : laisse le temps aux
 * préférences serveur d’arriver) viennent du module Avatar de l’admin (useAvatarModule).
 * QA (dev uniquement) : ?avatarPromptReset=1 remet le compteur à zéro, ?avatarPromptForce=1 force l’affichage.
 */
export function AvatarPromptGate() {
  const dispatch = useDispatch()
  const location = useLocation()
  const user = useSelector((state) => state.auth.user)
  const prefs = useSelector((state) => (user?.id ? state.account.preferences?.[user.id] : null))
  const userId = user?.id || null
  const avatarModule = useAvatarModule()
  const [phase, setPhase] = useState({ userId: null, value: 'idle' })
  const current = phase.userId === userId ? phase.value : 'idle'
  const latest = useRef({})

  useEffect(() => {
    latest.current = { user, prefs, location, dispatch, avatarModule }
  })

  // Décision unique par connexion, après hydratation des préférences serveur.
  useEffect(() => {
    if (!userId) return undefined
    const settleMs = latest.current.avatarModule?.promptDelayMs ?? 3500
    const timer = setTimeout(() => {
      const { user: u, prefs: p, location: loc, dispatch: send, avatarModule: mod } = latest.current
      if (!u?.id || u.id !== userId) return
      const params = new URLSearchParams(loc?.search || '')
      const dev = Boolean(import.meta.env?.DEV)
      const persist = (next) => {
        writeLocalPromptState(userId, next)
        send(updateAccountPreferences({ userId, preferences: { avatarPrompt: next } }))
      }
      if (dev && params.has('avatarPromptReset')) {
        clearLocalPromptState(userId)
        persist({ shown: 0, lastShownAt: null, done: false })
        return
      }
      // Module coupé ou éditeur sans style disponible : aucune invitation, même forcée.
      if (!mod?.promptEnabled) return
      const force = dev && params.has('avatarPromptForce')
      const state = mergePromptStates(p?.avatarPrompt, readLocalPromptState(userId))
      const blocked =
        BLOCKED_PATH.test(loc?.pathname || '') ||
        (isWelcomePending() && !hasSeenWelcome(userId)) ||
        isTourPreview()
      const show =
        force ||
        shouldShowAvatarPrompt({
          user: u,
          prefs: p,
          state,
          shownThisSession: wasPromptShownThisSession(userId),
          blocked,
          maxShows: mod.promptMaxShows,
          intervalMs: mod.promptIntervalMs,
        })
      if (!show) return
      persist(recordPromptShown(state))
      markPromptShownThisSession(userId)
      setPhase({ userId, value: 'prompt' })
    }, settleMs)
    return () => clearTimeout(timer)
  }, [userId])

  if (!userId || current === 'idle' || current === 'closed') return null
  if (!avatarModule.promptEnabled && current === 'prompt') return null

  if (current === 'editor') {
    return <AvatarDicebearEditorLazy open onClose={() => setPhase({ userId, value: 'closed' })} />
  }

  return (
    <Suspense fallback={null}>
      <AvatarPromptSheet
        userId={userId}
        onCustomize={() => setPhase({ userId, value: 'editor' })}
        onLater={() => setPhase({ userId, value: 'closed' })}
      />
    </Suspense>
  )
}
