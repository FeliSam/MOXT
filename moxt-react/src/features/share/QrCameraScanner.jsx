import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FiAlertCircle,
  FiArrowRight,
  FiBriefcase,
  FiCamera,
  FiGift,
  FiRefreshCw,
  FiShield,
  FiUser,
} from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { useLanguage } from '../../contexts/useLanguage'
import { resolveScanNavigation, storePendingInviteCode } from '../guest/guestNavigation'
import { applyPendingReferral } from '../referral/referralService'
import { queryCameraPermission, requestCameraAccess } from './cameraPermission'
import { parseMoxtScanTarget } from './parseMoxtScanTarget'
import { useQrCameraScanner } from './useQrCameraScanner'

const TARGET_ICONS = {
  user: FiUser,
  business: FiBriefcase,
  invite: FiGift,
}

export function QrCameraScanner({ active = true }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const authStatus = useSelector((state) => state.auth.status)
  const videoRef = useRef(null)
  const [capture, setCapture] = useState(null)
  const [permission, setPermission] = useState('checking')

  useEffect(() => {
    if (!active) return undefined

    let cancelled = false
    setPermission('checking')
    queryCameraPermission().then((state) => {
      if (!cancelled) setPermission(state)
    })

    return () => {
      cancelled = true
    }
  }, [active])

  const handleDecode = useCallback((text) => {
    const target = parseMoxtScanTarget(text)
    setCapture(
      target
        ? { kind: 'known', target, raw: text }
        : { kind: 'unknown', raw: text },
    )
  }, [])

  const cameraAllowed = permission === 'granted'
  const scanning = active && !capture && cameraAllowed
  const { status, restart } = useQrCameraScanner({
    enabled: scanning,
    videoRef,
    onDecode: handleDecode,
  })

  async function askCameraPermission() {
    setPermission('requesting')
    const result = await requestCameraAccess()
    if (result.granted) {
      setPermission('granted')
      restart()
      return
    }
    setPermission(result.reason === 'denied' ? 'denied' : result.reason || 'error')
  }

  useEffect(() => {
    if (permission === 'granted' && active && !capture) {
      restart()
    }
  }, [active, capture, permission, restart])

  function scanAgain() {
    setCapture(null)
    restart()
  }

  async function retryPermission() {
    await askCameraPermission()
  }

  function openTarget() {
    if (capture?.kind !== 'known') return
    if (authStatus === 'loading') return

    const destination = resolveScanNavigation(capture.target, user)
    if (capture.target.type === 'invite' && capture.target.code) {
      storePendingInviteCode(capture.target.code)
    }

    if (user && capture.target.type === 'invite') {
      void applyPendingReferral().then(() => {
        navigate(destination, { replace: true })
      })
      return
    }

    navigate(destination)
  }

  const TargetIcon = capture?.kind === 'known' ? TARGET_ICONS[capture.target.type] : FiAlertCircle

  return (
    <div className="grid gap-4">
      <div
        className="relative overflow-hidden rounded-[2rem] text-white shadow-[0_24px_60px_-20px_rgba(15,118,110,0.55)]"
        style={{
          background:
            'linear-gradient(165deg, #0f172a 0%, #134e4a 36%, #0d9488 68%, #0f766e 100%)',
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-12 -left-12 size-40 rounded-full bg-cyan-300/10 blur-3xl"
        />

        <div className="relative p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
                {t('share.scanner.eyebrow')}
              </p>
              <h2 className="mt-1 font-display text-xl font-extrabold tracking-[-0.02em]">
                {t('share.scanner.title')}
              </h2>
              <p className="mt-1 max-w-md text-sm text-white/70">{t('share.scanner.description')}</p>
            </div>
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10">
              <FiCamera className="text-lg" />
            </span>
          </div>

          {!capture ? (
            <div className="relative mt-5 overflow-hidden rounded-[1.35rem] border border-white/15 bg-black/35">
              {permission === 'checking' || permission === 'requesting' ? (
                <PermissionGate
                  title={
                    permission === 'requesting'
                      ? t('share.scanner.permission.requesting')
                      : t('share.scanner.permission.title')
                  }
                  description={t('share.scanner.permission.description')}
                  loading={permission === 'checking' || permission === 'requesting'}
                />
              ) : permission === 'prompt' ? (
                <PermissionGate
                  title={t('share.scanner.permission.title')}
                  description={t('share.scanner.permission.description')}
                  actionLabel={t('share.scanner.permission.allow')}
                  onAction={askCameraPermission}
                />
              ) : permission === 'denied' || permission === 'error' || permission === 'unsupported' ? (
                <PermissionGate
                  title={
                    permission === 'denied'
                      ? t('share.scanner.deniedTitle')
                      : permission === 'unsupported'
                        ? t('share.scanner.unsupportedTitle')
                        : t('share.scanner.errorTitle')
                  }
                  description={
                    permission === 'denied'
                      ? t('share.scanner.permission.deniedHint')
                      : permission === 'unsupported'
                        ? t('share.scanner.unsupportedDescription')
                        : t('share.scanner.errorDescription')
                  }
                  actionLabel={t('share.scanner.permission.retry')}
                  onAction={retryPermission}
                />
              ) : (
                <>
              <video
                ref={videoRef}
                className="aspect-[4/5] w-full object-cover sm:aspect-video"
                muted
                playsInline
                autoPlay
              />

              {status === 'scanning' || status === 'starting' ? (
                <div className="pointer-events-none absolute inset-0">
                  <span className="absolute inset-5 rounded-[1.1rem] border-2 border-white/25" />
                  <span className="absolute left-5 top-5 size-8 rounded-tl-xl border-l-[3px] border-t-[3px] border-emerald-300" />
                  <span className="absolute right-5 top-5 size-8 rounded-tr-xl border-r-[3px] border-t-[3px] border-emerald-300" />
                  <span className="absolute bottom-5 left-5 size-8 rounded-bl-xl border-b-[3px] border-l-[3px] border-emerald-300" />
                  <span className="absolute bottom-5 right-5 size-8 rounded-br-xl border-b-[3px] border-r-[3px] border-emerald-300" />
                  <span className="qr-scan-line absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
                </div>
              ) : null}

              {status === 'starting' ? (
                <div className="absolute inset-0 grid place-items-center bg-slate-950/45 backdrop-blur-[1px]">
                  <p className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold">
                    {t('share.scanner.starting')}
                  </p>
                </div>
              ) : null}

              {status === 'denied' ? (
                <ScannerMessage
                  title={t('share.scanner.deniedTitle')}
                  actionLabel={t('share.scanner.permission.retry')}
                  onAction={retryPermission}
                >
                  {t('share.scanner.permission.deniedHint')}
                </ScannerMessage>
              ) : null}

              {status === 'unsupported' ? (
                <ScannerMessage title={t('share.scanner.unsupportedTitle')}>
                  {t('share.scanner.unsupportedDescription')}
                </ScannerMessage>
              ) : null}

              {status === 'error' ? (
                <ScannerMessage
                  title={t('share.scanner.errorTitle')}
                  actionLabel={t('share.scanner.scanAgain')}
                  onAction={restart}
                >
                  {t('share.scanner.errorDescription')}
                </ScannerMessage>
              ) : null}
                </>
              )}
            </div>
          ) : (
            <div className="mt-5 rounded-[1.35rem] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/12">
                  <TargetIcon className="text-xl" />
                </span>
                <div className="min-w-0 text-left">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
                    {capture.kind === 'known'
                      ? t(capture.target.labelKey)
                      : t('share.scanner.unknownTitle')}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-white/85">
                    {capture.kind === 'known'
                      ? t(`share.scanner.descriptions.${capture.target.type}`, {
                          id:
                            capture.target.userId ||
                            capture.target.businessId ||
                            capture.target.code ||
                            '',
                        })
                      : t('share.scanner.unknownDescription')}
                  </p>
                  {capture.kind === 'known' ? (
                    <p className="mt-2 truncate font-mono text-xs text-white/55">{capture.target.path}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {capture.kind === 'known' ? (
                  <Button
                    className="!border-transparent !bg-white !text-slate-950 hover:!bg-slate-100"
                    icon={FiArrowRight}
                    onClick={openTarget}
                    disabled={authStatus === 'loading'}
                  >
                    {authStatus === 'loading'
                      ? t('share.scanner.sessionLoading')
                      : t(`share.scanner.actions.${capture.target.type}`)}
                  </Button>
                ) : null}
                <Button
                  className="border border-white/20 bg-white/10 text-white shadow-none hover:bg-white/20"
                  icon={FiRefreshCw}
                  onClick={scanAgain}
                >
                  {t('share.scanner.scanAgain')}
                </Button>
              </div>
            </div>
          )}

          {!capture && cameraAllowed && (status === 'scanning' || status === 'starting') ? (
            <p className="mt-4 text-center text-xs text-white/55">{t('share.scanner.hint')}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function PermissionGate({ actionLabel, description, loading = false, onAction, title }) {
  return (
    <div className="grid min-h-[18rem] place-items-center p-6 text-center sm:min-h-[14rem]">
      <div className="max-w-sm">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/15 bg-white/10">
          {loading ? (
            <span className="size-6 animate-spin rounded-full border-2 border-white/25 border-t-emerald-300" />
          ) : (
            <FiShield className="text-2xl text-emerald-200" />
          )}
        </span>
        <p className="mt-4 text-base font-black">{title}</p>
        <p className="mt-2 text-sm leading-6 text-white/75">{description}</p>
        {onAction && actionLabel ? (
          <button
            type="button"
            className="mt-5 rounded-full border border-white/20 bg-white px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-slate-100 disabled:opacity-60"
            onClick={onAction}
            disabled={loading}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function ScannerMessage({ actionLabel, children, onAction, title }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-slate-950/70 p-6 text-center backdrop-blur-sm">
      <div className="max-w-sm">
        <p className="text-base font-black">{title}</p>
        <p className="mt-2 text-sm leading-6 text-white/75">{children}</p>
        {onAction && actionLabel ? (
          <button
            type="button"
            className="mt-4 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}
