import { useCallback, useEffect, useRef, useState } from 'react'
import { MobileID } from 'smsaero-mobileid-sdk/mobileid-sdk.esm.js'
import { getMobileIdTokenUrl, getMobileIdBaseUrl } from '../config/mobileId'

export function useMobileIdVerification() {
  const midRef = useRef(null)
  const [phase, setPhase] = useState('idle') // idle | ready | pending | otp | verified | error
  const [otpRequired, setOtpRequired] = useState(false)
  const [verifyToken, setVerifyToken] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      midRef.current?.destroy?.()
      midRef.current = null
    }
  }, [])

  const bindClient = useCallback((client) => {
    client.on('ready', () => setPhase('ready'))
    client.on('pending', () => {
      setPhase('pending')
      setOtpRequired(false)
    })
    client.on('otp_required', () => {
      setPhase('otp')
      setOtpRequired(true)
    })
    client.on('verified', (data) => {
      setPhase('verified')
      setVerifyToken(data?.verify_token || '')
      setSessionId(client.getSessionId?.() || '')
    })
    client.on('rejected', () => {
      setPhase('error')
      setError('Vérification refusée.')
    })
    client.on('expired', () => {
      setPhase('error')
      setError('La session MobileID a expiré.')
    })
    client.on('invalid_code', () => {
      setPhase('otp')
      setError('Code incorrect. Réessayez.')
    })
    client.on('error', (err) => {
      setPhase('error')
      setError(err?.message || 'Erreur MobileID.')
    })
  }, [])

  const start = useCallback(
    async (phone) => {
      const tokenUrl = getMobileIdTokenUrl()
      const baseUrl = getMobileIdBaseUrl()
      if (!tokenUrl) throw new Error('MobileID non configuré (VITE_SUPABASE_URL manquant).')

      setError('')
      setOtpRequired(false)
      setVerifyToken('')
      setSessionId('')
      setPhase('pending')

      midRef.current?.destroy?.()
      const client = new MobileID({ tokenUrl, baseUrl })
      bindClient(client)
      midRef.current = client

      await client.init()
      await client.start(phone)
    },
    [bindClient],
  )

  const submitOtp = useCallback(async (code) => {
    if (!midRef.current) throw new Error('Session MobileID inactive.')
    setError('')
    await midRef.current.submitOTP(String(code).trim())
  }, [])

  return {
    start,
    submitOtp,
    phase,
    otpRequired,
    verifyToken,
    sessionId,
    error,
    loading: phase === 'pending' || phase === 'ready',
  }
}
