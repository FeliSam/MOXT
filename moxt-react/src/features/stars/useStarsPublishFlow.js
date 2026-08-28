import { useCallback, useState } from 'react'
import { StarsInsufficientError, withStarsConsume as withStarsConsumeBase } from './starsPublish'
import { useStarsModuleEnabled } from './useStarsModuleEnabled'

export function useStarsPublishFlow() {
  const starsEnabled = useStarsModuleEnabled()
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

  const withStarsConsume = useCallback(
    async (args) => {
      if (!starsEnabled) {
        const result = await args.publish()
        return { result, consumed: { skipped: true }, quote: { skipped: true } }
      }
      return withStarsConsumeBase({ ...args, confirmPaid: args.confirmPaid ?? confirmPaid })
    },
    [confirmPaid, starsEnabled],
  )

  return {
    starsEnabled,
    pendingQuote: starsEnabled ? pendingQuote : null,
    confirmPaid,
    acceptSpend,
    cancelSpend,
    withStarsConsume,
    StarsInsufficientError,
  }
}
