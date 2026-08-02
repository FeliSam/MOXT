import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { setConfirmHandler } from './confirmBridge'

const ConfirmContext = createContext(null)

/**
 * Global confirm dialog for admin / detail actions.
 * Use `useConfirm()` in components, or `confirmAction()` from confirmBridge in plain helpers.
 */
export function ConfirmDialogProvider({ children }) {
  const [state, setState] = useState(null)
  const onConfirmRef = useRef(null)

  const requestConfirm = useCallback(({ title, description, onConfirm }) => {
    onConfirmRef.current = onConfirm
    setState({ title, description })
  }, [])

  useEffect(() => {
    setConfirmHandler(requestConfirm)
    return () => setConfirmHandler(null)
  }, [requestConfirm])

  const value = useMemo(() => ({ requestConfirm }), [requestConfirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={Boolean(state)}
        title={state?.title || ''}
        description={state?.description || ''}
        onCancel={() => {
          onConfirmRef.current = null
          setState(null)
        }}
        onConfirm={() => {
          const fn = onConfirmRef.current
          onConfirmRef.current = null
          setState(null)
          fn?.()
        }}
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    return {
      requestConfirm: ({ onConfirm }) => onConfirm?.(),
    }
  }
  return ctx
}
