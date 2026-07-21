import { useEffect, useState } from 'react'
import {
  FiCheckCircle,
  FiDownload,
  FiHome,
  FiShare2,
  FiSmartphone,
  FiUpload,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { BackButton } from '../components/ui/BackButton'
import { useLanguage } from '../contexts/useLanguage'
import { appReleaseService } from '../services/appReleaseService'
import { addToast } from '../features/ui/uiSlice'

const TABS = [
  { id: 'android', labelKey: 'install.tabs.android' },
  { id: 'iphone', labelKey: 'install.tabs.iphone' },
]

function formatBytes(size) {
  const n = Number(size) || 0
  if (n < 1024) return `${n} o`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`
}

function StepVisual({ icon: Icon, title, body, step }) {
  return (
    <Card className="grid gap-4 p-5 sm:grid-cols-[7.5rem_1fr] sm:items-center">
      <div className="relative mx-auto flex h-36 w-24 items-end justify-center overflow-hidden rounded-[1.4rem] border-2 border-[var(--app-border)] bg-[linear-gradient(160deg,#0b3d36_0%,#1a5cff_100%)] p-2 shadow-lg">
        <div className="absolute top-2 h-1.5 w-10 rounded-full bg-white/30" />
        <div className="mb-3 grid size-14 place-items-center rounded-2xl bg-white/95 text-[var(--app-accent)] shadow">
          <Icon className="text-2xl" aria-hidden />
        </div>
        <span className="absolute left-2 top-2 grid size-6 place-items-center rounded-full bg-white text-[10px] font-black text-emerald-900">
          {step}
        </span>
      </div>
      <div className="min-w-0">
        <h3 className="font-black">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{body}</p>
      </div>
    </Card>
  )
}

export function InstallAppPage() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const isStaff = ['admin', 'superadmin', 'moderator'].includes(user?.role)
  const [tab, setTab] = useState('android')
  const [release, setRelease] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [versionDraft, setVersionDraft] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const active = await appReleaseService.getActiveRelease('android')
        if (!cancelled) setRelease(active)
      } catch (error) {
        if (!cancelled) {
          dispatch(
            addToast({
              title: t('common.error'),
              message: error?.message || t('install.android.loadError'),
              tone: 'error',
            }),
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dispatch, t])

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const next = await appReleaseService.uploadAndroidApk(file, {
        version: versionDraft,
        uploadedBy: user?.id,
      })
      setRelease(next)
      dispatch(
        addToast({
          title: t('install.android.uploadOkTitle'),
          message: t('install.android.uploadOkBody', { name: next.fileName }),
          tone: 'success',
        }),
      )
    } catch (error) {
      dispatch(
        addToast({
          title: t('common.error'),
          message: error?.message || t('install.android.uploadError'),
          tone: 'error',
        }),
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t('install.eyebrow')}
        title={t('install.title')}
        description={t('install.description')}
        actions={<BackButton fallback="/dashboard" />}
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold transition ${
              tab === item.id
                ? 'bg-brand-700 text-white shadow-sm'
                : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface)]'
            }`}
          >
            {item.id === 'android' ? <FiSmartphone /> : <FiShare2 />}
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      {tab === 'android' ? (
        <div className="grid gap-5">
          <Card className="grid gap-4 p-5">
            <div className="flex flex-wrap items-start gap-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-emerald-600 text-white">
                <FiDownload className="text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-black">{t('install.android.title')}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
                  {t('install.android.body')}
                </p>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-[var(--app-text-muted)]">{t('install.android.loading')}</p>
            ) : release?.downloadUrl ? (
              <div className="grid gap-3 rounded-2xl bg-[var(--app-surface-muted)] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="success">{t('install.android.available')}</Badge>
                  {release.version ? (
                    <span className="text-xs font-bold text-[var(--app-text-muted)]">
                      v{release.version}
                    </span>
                  ) : null}
                  {release.fileSize ? (
                    <span className="text-xs text-[var(--app-text-muted)]">
                      {formatBytes(release.fileSize)}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-medium">{release.fileName}</p>
                <a href={release.downloadUrl} download={release.fileName || 'moxt.apk'}>
                  <Button icon={FiDownload}>{t('install.android.download')}</Button>
                </a>
                <p className="text-xs text-[var(--app-text-muted)]">{t('install.android.hint')}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--app-border)] p-4 text-sm text-[var(--app-text-muted)]">
                {t('install.android.unavailable')}
              </div>
            )}

            <p className="text-xs text-[var(--app-text-muted)]">{t('install.android.rustoreLater')}</p>
          </Card>

          {isStaff ? (
            <Card className="grid gap-3 p-5">
              <h3 className="font-black">{t('install.android.staffTitle')}</h3>
              <p className="text-sm text-[var(--app-text-muted)]">{t('install.android.staffBody')}</p>
              <input
                className="min-h-11 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 text-sm"
                placeholder={t('install.android.versionPlaceholder')}
                value={versionDraft}
                onChange={(e) => setVersionDraft(e.target.value)}
              />
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 self-start rounded-xl border border-[var(--app-border)] px-4 text-sm font-bold">
                <FiUpload />
                {uploading ? t('install.android.uploading') : t('install.android.upload')}
                <input
                  className="sr-only"
                  type="file"
                  accept=".apk,application/vnd.android.package-archive"
                  disabled={uploading}
                  onChange={handleUpload}
                />
              </label>
            </Card>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-5">
          <Card className="grid gap-3 p-5">
            <div className="flex items-start gap-3">
              <img
                src="/assets/brand/mark.png"
                alt=""
                className="size-12 rounded-2xl object-cover shadow"
              />
              <div>
                <h2 className="font-black">{t('install.iphone.title')}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
                  {t('install.iphone.body')}
                </p>
              </div>
            </div>
          </Card>

          <StepVisual
            step={1}
            icon={FiShare2}
            title={t('install.iphone.step1Title')}
            body={t('install.iphone.step1Body')}
          />
          <StepVisual
            step={2}
            icon={FiHome}
            title={t('install.iphone.step2Title')}
            body={t('install.iphone.step2Body')}
          />
          <StepVisual
            step={3}
            icon={FiCheckCircle}
            title={t('install.iphone.step3Title')}
            body={t('install.iphone.step3Body')}
          />

          <Card className="p-5 text-sm leading-6 text-[var(--app-text-muted)]">
            {t('install.iphone.note')}
          </Card>
        </div>
      )}
    </div>
  )
}
