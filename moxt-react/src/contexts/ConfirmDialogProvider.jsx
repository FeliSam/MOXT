import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { setConfirmHandler } from './confirmBridge'

const ConfirmContext = createContext(null)

/**
 * Modale de confirmation globale.
 *
 * `useConfirm()` expose :
 * - `confirm(options)` → Promise<boolean> : `true` si l'utilisateur a confirmé (et que
 *   `options.onConfirm`, s'il est fourni, a réussi), `false` s'il a annulé (Échap, fond, Annuler).
 *   Si `onConfirm` lève une erreur, la modale reste ouverte et affiche le message.
 * - `requestConfirm(options)` : alias historique (même comportement, promesse ignorable).
 *
 * Options : title, description, subject, subjectLabel, confirmLabel, cancelLabel,
 * tone ('danger' | 'accent'), accent ('personal' | 'business'), onConfirm (sync ou async).
 * `confirmAction()` de confirmBridge reste disponible pour les helpers hors React.
 */
export function ConfirmDialogProvider({ children }) {
  const [state, setState] = useState(null)
  const onConfirmRef = useRef(null)
  const resolverRef = useRef(null)

  const requestConfirm = useCallback((options = {}) => {
    const { onConfirm, ...dialog } = options
    return new Promise((resolve) => {
      resolverRef.current?.(false)
      resolverRef.current = resolve
      onConfirmRef.current = typeof onConfirm === 'function' ? onConfirm : null
      setState(dialog)
    })
  }, [])

  useEffect(() => {
    setConfirmHandler(requestConfirm)
    return () => setConfirmHandler(null)
  }, [requestConfirm])

  const handleCancel = useCallback(() => {
    const resolve = resolverRef.current
    resolverRef.current = null
    onConfirmRef.current = null
    setState(null)
    resolve?.(false)
  }, [])

  const handleConfirm = useCallback(async () => {
    const resolve = resolverRef.current
    const fn = onConfirmRef.current
    if (fn) await fn()
    // Une nouvelle confirmation a pu être ouverte depuis onConfirm : ne pas la fermer.
    if (resolverRef.current !== resolve) {
      resolve?.(true)
      return
    }
    resolverRef.current = null
    onConfirmRef.current = null
    setState(null)
    resolve?.(true)
  }, [])

  const value = useMemo(() => ({ requestConfirm, confirm: requestConfirm }), [requestConfirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        {...(state || {})}
        open={Boolean(state)}
        title={state?.title || ''}
        description={state?.description || ''}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </ConfirmContext.Provider>
  )
}

async function confirmWithoutProvider({ onConfirm } = {}) {
  await onConfirm?.()
  return true
}

const FALLBACK = { requestConfirm: confirmWithoutProvider, confirm: confirmWithoutProvider }

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  return ctx || FALLBACK
}