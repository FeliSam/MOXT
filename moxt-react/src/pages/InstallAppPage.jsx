import { useEffect, useState } from 'react'
import { FiDownload, FiSmartphone, FiUpload } from 'react-icons/fi'
import { MdPhoneIphone } from 'react-icons/md'
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

const IPHONE_GUIDE_BY_LANG = {
  ru: '/assets/install/iphone-add-home-ru.png',
  fr: '/assets/install/iphone-add-home-fr.png',
  // Guides illustrés disponibles en FR / RU ; les autres langues utilisent le FR.
  en: '/assets/install/iphone-add-home-fr.png',
  es: '/assets/install/iphone-add-home-fr.png',
  pt: '/assets/install/iphone-add-home-fr.png',
}

function formatBytes(size) {
  const n = Number(size) || 0
  if (n < 1024) return `${n} o`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`
}

function iphoneGuideSrc(language) {
  const lang = String(language || 'fr').slice(0, 2).toLowerCase()
  return IPHONE_GUIDE_BY_LANG[lang] || IPHONE_GUIDE_BY_LANG.fr
}

export function InstallAppPage() {
  const { t, language } = useLanguage()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const isStaff = ['admin', 'superadmin', 'moderator'].includes(user?.role)
  const [tab, setTab] = useState('android')
  const [release, setRelease] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [versionDraft, setVersionDraft] = useState('')
  const guideSrc = iphoneGuideSrc(language)

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
            {item.id === 'android' ? <FiSmartphone /> : <MdPhoneIphone />}
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

          <Card className="overflow-hidden p-2 sm:p-3">
            <img
              src={guideSrc}
              alt={t('install.iphone.guideAlt')}
              className="mx-auto h-auto w-full max-w-3xl rounded-xl object-contain"
              loading="lazy"
            />
          </Card>

          <Card className="p-5 text-sm leading-6 text-[var(--app-text-muted)]">
            {t('install.iphone.note')}
          </Card>
        </div>
      )}
    </div>
  )
}
