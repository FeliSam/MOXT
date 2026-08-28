import { useMemo, useState } from 'react'
import { FiArrowLeft, FiFilm, FiUpload } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { BusinessPublishNotice } from '../features/businesses/BusinessPublishNotice'
import {
  canPublishAsBusinessFor,
  resolveBusinessPublishContext,
} from '../features/businesses/businessPublishUtils'
import { createVideo } from '../features/videos/videosSlice'
import {
  VIDEO_MAX_DURATION_MS,
  captureVideoThumbnail,
  preparePublishableVideo,
  videoFeedPath,
} from '../features/videos/videoUtils'
import { addToast } from '../features/ui/uiSlice'
import { SecurityGatePanel } from '../features/security/SecurityGatePanel'
import { useSecurityGate } from '../features/security/useSecurityGate'
import { useLanguage } from '../contexts/useLanguage'
import { publishText } from '../features/publications/publishI18n'
import { useUploadProgress } from '../hooks/useUploadProgress'
import { storageService } from '../services/storageService'
import { phase3Text } from '../i18n/phase3I18n'
import { StarsInsufficientError, starsOwnerFromPublish } from '../features/stars/starsPublish'
import { StarsPublishGate } from '../features/stars/StarsPublishGate'
import { PublishFormulaSheet } from '../features/stars/PublishFormulaSheet'
import { DEFAULT_QUOTA_CONFIG } from '../features/stars/starsConfig'
import { useStarsPublishFlow } from '../features/stars/useStarsPublishFlow'

export function PublishVideoPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const { requirePublish } = useSecurityGate()
  const user = useSelector((state) => state.auth.user)
  const business = useSelector((state) =>
    state.businesses.items.find((item) => item.ownerId === user.id),
  )
  const canPublish = canPublishAsBusinessFor(business, 'video')
  const { progress: uploadProgress, track: trackUpload } = useUploadProgress()

  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [durationMs, setDurationMs] = useState(0)
  const [errors, setErrors] = useState({})
  const [publishing, setPublishing] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [preparePercent, setPreparePercent] = useState(0)
  const { pendingQuote, confirmPaid, acceptSpend, cancelSpend, withStarsConsume } = useStarsPublishFlow()
  const starsBalance = useSelector((state) => state.stars.balance)
  const [formulaKey, setFormulaKey] = useState('standard')

  const durationLabel = useMemo(() => {
    if (!durationMs) return ''
    const seconds = Math.round(durationMs / 1000)
    return `${seconds}s`
  }, [durationMs])

  async function onPickFile(event) {
    const next = event.target.files?.[0]
    event.target.value = ''
    if (!next) return
    setPreparing(true)
    setPreparePercent(0)
    setErrors({})
    try {
      const prepared = await preparePublishableVideo(next, {
        onProgress: (ratio) => setPreparePercent(Math.round((ratio || 0) * 100)),
      })
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setFile(prepared.file)
      setDurationMs(prepared.durationMs)
      setPreviewUrl(URL.createObjectURL(prepared.file))
      if (prepared.transcoded) {
        dispatch(
          addToast({
            title: p3('videos.publish.transcodedTitle'),
            message: p3('videos.publish.transcodedMessage'),
            tone: 'success',
          }),
        )
      }
    } catch (error) {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setFile(null)
      setPreviewUrl('')
      setDurationMs(0)
      const code = error?.code
      if (code === 'TYPE') setErrors({ file: p3('videos.publish.errors.fileType') })
      else if (code === 'TOO_LARGE') setErrors({ file: p3('videos.publish.errors.tooLarge') })
      else if (code === 'TOO_LONG') {
        setErrors({
          file: p3('videos.publish.errors.tooLong', {
            max: error.maxSeconds || Math.round(VIDEO_MAX_DURATION_MS / 1000),
          }),
        })
      } else if (code === 'CONVERT_FAILED' || code === 'NEED_COMPAT' || code === 'UNREADABLE') {
        const detail = error?.detail || error?.message
        setErrors({
          file: detail && detail !== 'CONVERT_FAILED' && detail !== 'UNREADABLE'
            ? `${p3('videos.publish.errors.convertFailed')} (${detail})`
            : p3('videos.publish.errors.convertFailed'),
        })
      } else {
        setErrors({ file: p3('videos.publish.errors.readFailed') })
      }
    } finally {
      setPreparing(false)
      setPreparePercent(0)
    }
  }

  async function publish() {
    if (!requirePublish()) return
    const nextErrors = {}
    if (!title.trim()) nextErrors.title = p3('videos.publish.errors.titleRequired')
    if (!file) nextErrors.file = p3('videos.publish.errors.fileRequired')
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const publishContext = resolveBusinessPublishContext({
      business,
      publishAsBusiness: true,
      contentType: 'video',
    })
    if (publishContext.blocked || !business?.id) {
      dispatch(
        addToast({
          title: publishText(t, 'publish.common.toasts.businessBlockedTitle'),
          message: p3('videos.publish.errors.businessBlocked'),
          tone: 'error',
        }),
      )
      return
    }

    setPublishing(true)
    try {
      const videoId = `VID-${Date.now().toString(36).toUpperCase()}`
      let thumbnailFile = null
      try {
        thumbnailFile = await captureVideoThumbnail(file)
      } catch {
        thumbnailFile = null
      }

      const uploaded = await trackUpload((onProgress) =>
        storageService.uploadBusinessVideo(user.id, business.id, videoId, file, thumbnailFile, {
          onProgress,
        }),
      )

      const outcome = await withStarsConsume({
        category: 'video',
        formulaKey,
        ...starsOwnerFromPublish({ useBusiness: true, business, user }),
        entityId: videoId,
        confirmPaid,
        publish: async () => {
          dispatch(
            createVideo({
              id: videoId,
              businessId: business.id,
              ownerId: user.id,
              title: title.trim(),
              caption: caption.trim(),
              videoUrl: uploaded.videoUrl,
              thumbnailUrl: uploaded.thumbnailUrl || '',
              objectKey: uploaded.objectKey,
              mimeType: file.type || '',
              durationMs,
              status: 'active',
              businessName: business.name || '',
            }),
          )
        },
      })
      if (outcome?.cancelled) return

      dispatch(
        addToast({
          title: p3('videos.publish.successTitle'),
          message: p3('videos.publish.successMessage'),
          tone: 'success',
        }),
      )
      navigate(videoFeedPath(videoId))
    } catch (error) {
      dispatch(
        addToast({
          title:
            error instanceof StarsInsufficientError
              ? t('stars.insufficientTitle')
              : p3('videos.publish.errors.uploadFailed'),
          message:
            error instanceof StarsInsufficientError
              ? t('stars.insufficientBody')
              : error?.message || p3('videos.publish.errors.uploadFailed'),
          tone: 'error',
        }),
      )
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <PageHeader
        eyebrow={p3('videos.publish.eyebrow')}
        title={p3('videos.publish.title')}
        description={p3('videos.publish.description')}
        actions={
          <Link to="/publications/mine?scope=business&type=video">
            <Button variant="secondary" icon={FiArrowLeft}>
              {p3('videos.publish.back')}
            </Button>
          </Link>
        }
      />

      <SecurityGatePanel />
      <BusinessPublishNotice business={business} contentType="video" />
      {canPublish ? (
        <StarsPublishGate
          category="video"
          ownerType="business"
          ownerId={business?.id}
          pendingQuote={pendingQuote}
          onCancel={cancelSpend}
          onConfirm={acceptSpend}
        />
      ) : null}

      {!canPublish ? (
        <Card className="grid gap-3 p-5">
          <p className="text-sm text-[var(--app-text-muted)]">{p3('videos.publish.gateHint')}</p>
          <Link to="/professional">
            <Button>{p3('videos.publish.setupBusiness')}</Button>
          </Link>
        </Card>
      ) : (
        <Card className="grid gap-5 p-5">
          <label className="grid gap-2">
            <span className="text-sm font-semibold">{p3('videos.publish.fields.file')}</span>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-2 text-sm font-semibold">
                <FiUpload />
                {preparing
                  ? p3('videos.publish.preparingProgress', { percent: preparePercent })
                  : p3('videos.publish.pickFile')}
                <input
                  type="file"
                  accept="video/*,.mp4,.webm,.mov,.m4v,.3gp,.3g2,.mkv"
                  className="hidden"
                  disabled={preparing || publishing}
                  onChange={onPickFile}
                />
              </label>
              {file ? (
                <span className="text-sm text-[var(--app-text-muted)]">
                  {file.name}
                  {durationLabel ? ` · ${durationLabel}` : ''}
                </span>
              ) : null}
            </div>
            {preparing ? (
              <div className="h-2 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                <div
                  className="h-full bg-brand-600 transition-all duration-300"
                  style={{ width: `${Math.max(4, preparePercent)}%` }}
                />
              </div>
            ) : null}
            {errors.file ? <span className="text-sm text-rose-600">{errors.file}</span> : null}
          </label>

          {previewUrl ? (
            <div className="overflow-hidden rounded-2xl bg-black">
              <video src={previewUrl} controls className="max-h-80 w-full object-contain" />
            </div>
          ) : (
            <div className="grid h-40 place-items-center rounded-2xl border border-dashed border-[var(--app-border)] text-[var(--app-text-muted)]">
              <FiFilm className="mb-2 text-2xl" />
              <span className="text-sm">{p3('videos.publish.previewEmpty')}</span>
            </div>
          )}

          <Input
            label={p3('videos.publish.fields.title')}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            error={errors.title}
            maxLength={120}
          />

          <label className="grid gap-2">
            <span className="text-sm font-semibold">{p3('videos.publish.fields.caption')}</span>
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              rows={4}
              maxLength={500}
              className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm"
            />
          </label>

          {uploadProgress?.percent != null ? (
            <p className="text-sm text-[var(--app-text-muted)]">
              {p3('videos.publish.uploading', { percent: uploadProgress.percent })}
            </p>
          ) : null}

          <PublishFormulaSheet
            category="video"
            value={formulaKey}
            onChange={setFormulaKey}
            enforced={Boolean(starsBalance?.enforced)}
            config={starsBalance?.config || DEFAULT_QUOTA_CONFIG}
          />

          <Button icon={FiUpload} loading={publishing || preparing} disabled={!file || preparing} onClick={publish}>
            {p3('videos.publish.submit')}
          </Button>
        </Card>
      )}
    </div>
  )
}
