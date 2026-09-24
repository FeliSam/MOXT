import { useEffect, useState } from 'react'
import { FiPlay, FiVolume2 } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { useLanguage } from '../../../contexts/useLanguage'
import { loadFeedPlayback, saveFeedPlayback } from '../../platform/feedPlaybackSlice'
import { addToast } from '../../ui/uiSlice'
import { CARD } from '../adminConfig'
import { adminText } from '../adminI18n'

function ToggleRow({ icon: Icon, label, hint, enabled, onToggle }) {
  return (
    <Card className={`${CARD} flex items-start gap-4 p-4`}>
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--app-surface-muted)] text-[var(--app-text)]">
        <Icon className="text-lg" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-black">{label}</p>
        <p className="mt-0.5 text-sm text-[var(--app-text-muted)]">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={onToggle}
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${
          enabled ? 'bg-brand-600' : 'bg-[var(--app-border)]'
        }`}
      >
        <span
          className={`absolute top-1 size-6 rounded-full bg-white shadow transition ${
            enabled ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </Card>
  )
}

export function AdminFeedPlaybackPanel() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const remote = useSelector((state) => state.feedPlayback.config)
  const saveStatus = useSelector((state) => state.feedPlayback.saveStatus)
  const updatedAt = useSelector((state) => state.feedPlayback.updatedAt)
  const [draft, setDraft] = useState(remote)
  const remoteKey = `${remote.soundOnByDefault}|${remote.tapPausesVideo}`
  const [syncedRemoteKey, setSyncedRemoteKey] = useState(remoteKey)
  if (remoteKey !== syncedRemoteKey) {
    setSyncedRemoteKey(remoteKey)
    setDraft(remote)
  }

  useEffect(() => {
    dispatch(loadFeedPlayback())
  }, [dispatch])

  const dirty =
    draft.soundOnByDefault !== remote.soundOnByDefault || draft.tapPausesVideo !== remote.tapPausesVideo

  async function save() {
    try {
      await dispatch(saveFeedPlayback(draft)).unwrap()
      dispatch(addToast({ title: adminText(t, 'admin.feed.saved'), tone: 'success' }))
    } catch (error) {
      dispatch(
        addToast({
          title: adminText(t, 'admin.feed.saveFailed'),
          message: error?.message,
          tone: 'error',
        }),
      )
    }
  }

  return (
    <div className="grid gap-4">
      <Card className={`${CARD} grid gap-3 p-5`}>
        <div>
          <h2 className="text-lg font-black">{adminText(t, 'admin.feed.title')}</h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">{adminText(t, 'admin.feed.description')}</p>
        </div>
        <p className="rounded-xl border border-brand-200/70 bg-brand-50/80 px-3 py-2 text-xs text-brand-900 dark:border-brand-900/40 dark:bg-brand-950/30 dark:text-brand-100">
          {adminText(t, 'admin.feed.hint')}
        </p>
      </Card>

      <ToggleRow
        icon={FiVolume2}
        label={adminText(t, 'admin.feed.soundOnByDefault')}
        hint={adminText(t, 'admin.feed.soundOnByDefaultHint')}
        enabled={draft.soundOnByDefault}
        onToggle={() =>
          setDraft((current) => ({ ...current, soundOnByDefault: !current.soundOnByDefault }))
        }
      />

      <ToggleRow
        icon={FiPlay}
        label={adminText(t, 'admin.feed.tapPausesVideo')}
        hint={adminText(t, 'admin.feed.tapPausesVideoHint')}
        enabled={draft.tapPausesVideo}
        onToggle={() =>
          setDraft((current) => ({ ...current, tapPausesVideo: !current.tapPausesVideo }))
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={!dirty || saveStatus === 'saving'} loading={saveStatus === 'saving'} onClick={save}>
          {adminText(t, 'admin.feed.save')}
        </Button>
        {updatedAt ? (
          <p className="text-xs text-[var(--app-text-muted)]">
            {adminText(t, 'admin.feed.updatedAt', { date: new Date(updatedAt).toLocaleString() })}
          </p>
        ) : null}
      </div>
    </div>
  )
}
