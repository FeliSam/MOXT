import { useEffect, useState } from 'react'

function remainingMilliseconds(deadline) {
  return deadline ? Math.max(0, new Date(deadline).getTime() - Date.now()) : 0
}

export function usePaymentCountdown(deadline) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((value) => value + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const remaining = remainingMilliseconds(deadline)
  const totalSeconds = Math.floor(remaining / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return {
    expired: remaining === 0,
    label: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    remaining,
  }
}
