import { useCallback, useState } from 'react'

export function useStarsBoostFlow() {
  const [target, setTarget] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pendingQuote, setPendingQuote] = useState(null)
  const [resolver, setResolver] = useState(null)

  const confirmPaid = useCallback(
    (quote) =>
      new Promise((resolve) => {
        setPendingQuote(quote)
        setResolver(() => resolve)
      }),
    [],
  )

  function acceptSpend() {
    resolver?.(true)
    setPendingQuote(null)
    setResolver(null)
  }

  function cancelSpend() {
    resolver?.(false)
    setPendingQuote(null)
    setResolver(null)
  }

  function openBoost(nextTarget) {
    setTarget(nextTarget)
  }

  function closeBoost() {
    if (loading) return
    setTarget(null)
  }

  return {
    target,
    loading,
    setLoading,
    openBoost,
    closeBoost,
    pendingQuote,
    confirmPaid,
    acceptSpend,
    cancelSpend,
  }
}
