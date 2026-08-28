import { useMemo, useState } from 'react'
import { FiArrowLeft, FiFilm, FiSave, FiUpload } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { useLanguage } from '../contexts/useLanguage'
import { addToast } from '../features/ui/uiSlice'
import { updateVideo } from '../features/videos/videosSlice'
import {
  VIDEO_MAX_DURATION_MS,
  captureVideoThumbnail,
  preparePublishableVideo,
  videoFeedPath,
} from '../features/videos/videoUtils'
import { useUploadProgress } from '../hooks/useUploadProgress'
import { phase3Text } from '../i18n/phase3I18n'
import { storageService } from '../services/storageService'

export function EditVideoPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { videoId } = useParams()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const video = useSelector((state) => state.videos.items.find((item) => item.id === videoId))
  const { progress: uploadProgress, track: trackUpload } = useUploadProgress()

  const [title, setTitle] = useState(null)
  const [caption, setCaption] = useState(null)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [durationMs, setDurationMs] = useState(0)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [preparePercent, setPreparePercent] = useState(0)

  const titleValue = title ?? video?.title ?? ''
  const captionValue = caption ?? video?.caption ?? ''
  const currentPreview = previewUrl || video?.videoUrl || ''

  const durationLabel = useMemo(() => {
    const ms = durationMs || Number(video?.durationMs) || 0
    if (!ms) return ''
    return `${Math.round(ms / 1000)}s`
  }, [durationMs, video?.durationMs])

  if (!video) return <Card className="p-5">{p3('videos.edit.notFound')}</Card>
  if (video.ownerId !== user?.id) return <Navigate to={videoFeedPath(videoId)} replace />

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
          file:
            detail && detail !== 'CONVERT_FAILED' && detail !== 'UNREADABLE'
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

  async function save() {
    const nextErrors = {}
    if (!titleValue.trim()) nextErrors.title = p3('videos.publish.errors.titleRequired')
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSaving(true)
    try {
      const changes = {
        id: video.id,
        ownerId: user.id,
        title: titleValue.trim(),
        caption: captionValue.trim(),
      }

      if (file && video.businessId) {
        let thumbnailFile = null
        try {
          thumbnailFile = await captureVideoThumbnail(file)
        } catch {
          thumbnailFile = null
        }
        const uploaded = await trackUpload((onProgress) =>
          storageService.uploadBusinessVideo(
            user.id,
            video.businessId,
            video.id,
            file,
            thumbnailFile,
            { onProgress },
          ),
        )
        changes.videoUrl = uploaded.videoUrl
        changes.thumbnailUrl = uploaded.thumbnailUrl || video.thumbnailUrl || ''
        changes.objectKey = uploaded.objectKey || video.objectKey || ''
        changes.mimeType = file.type || ''
        changes.durationMs = durationMs || video.durationMs || 0
      }

      dispatch(updateVideo(changes))
      dispatch(
        addToast({
          title: p3('videos.edit.successTitle'),
          message: p3('videos.edit.successMessage'),
          tone: 'success',
        }),
      )
      navigate(videoFeedPath(video.id))
    } catch (error) {
      dispatch(
        addToast({
          title: p3('videos.publish.errors.uploadFailed'),
          message: error?.message || p3('videos.publish.errors.uploadFailed'),
          tone: 'error',
        }),
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <PageHeader
        eyebrow={p3('videos.edit.eyebrow')}
        title={p3('videos.edit.title')}
        description={p3('videos.edit.description')}
        actions={
          <Link to="/publications/mine?scope=business&type=video">
            <Button variant="secondary" icon={FiArrowLeft}>
              {p3('videos.publish.back')}
            </Button>
          </Link>
        }
      />

      <Card className="grid gap-5 p-5">
        <label className="grid gap-2">
          <span className="text-sm font-semibold">{p3('videos.edit.fields.file')}</span>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-2 text-sm font-semibold">
              <FiUpload />
              {preparing
                ? p3('videos.publish.preparingProgress', { percent: preparePercent })
                : p3('videos.edit.replaceFile')}
              <input
                type="file"
                accept="video/*,.mp4,.webm,.mov,.m4v,.3gp,.3g2,.mkv"
                className="hidden"
                disabled={preparing || saving}
                onChange={onPickFile}
              />
            </label>
            {file ? (
              <span className="text-sm text-[var(--app-text-muted)]">
                {file.name}
                {durationLabel ? ` · ${durationLabel}` : ''}
              </span>
            ) : durationLabel ? (
              <span className="text-sm text-[var(--app-text-muted)]">{durationLabel}</span>
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

        {currentPreview ? (
          <div className="overflow-hidden rounded-2xl bg-black">
            <video
              src={currentPreview}
              poster={file ? undefined : video.thumbnailUrl || undefined}
              controls
              className="max-h-80 w-full object-contain"
            />
          </div>
        ) : (
          <div className="grid h-40 place-items-center rounded-2xl border border-dashed border-[var(--app-border)] text-[var(--app-text-muted)]">
            <FiFilm className="mb-2 text-2xl" />
            <span className="text-sm">{p3('videos.publish.previewEmpty')}</span>
          </div>
        )}

        <Input
          label={p3('videos.publish.fields.title')}
          value={titleValue}
          onChange={(event) => setTitle(event.target.value)}
          error={errors.title}
          maxLength={120}
        />

        <label className="grid gap-2">
          <span className="text-sm font-semibold">{p3('videos.publish.fields.caption')}</span>
          <textarea
            value={captionValue}
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

        <Button icon={FiSave} loading={saving || preparing} disabled={preparing} onClick={save}>
          {p3('videos.edit.submit')}
        </Button>
      </Card>
    </div>
  )
}
