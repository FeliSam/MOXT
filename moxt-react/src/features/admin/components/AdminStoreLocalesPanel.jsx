import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { LanguageSegment } from '../../../components/ui/LanguageSegment'
import { useLanguage } from '../../../contexts/useLanguage'
import { STORE_CHANNELS } from '../../../config/storeLocales'
import { adminText } from '../adminI18n'
import { CARD } from '../adminConfig'
import { loadStoreLocales, saveStoreLocales } from '../../platform/storeLocalesSlice'
import { addToast } from '../../ui/uiSlice'

const CHANNEL_KEYS = {
  ios: 'admin.stores.ios',
  play: 'admin.stores.play',
  rustore: 'admin.stores.rustore',
  web: 'admin.stores.web',
}

const CHANNEL_HINTS = {
  ios: 'admin.stores.iosHint',
  play: 'admin.stores.playHint',
  rustore: 'admin.stores.rustoreHint',
  web: 'admin.stores.webHint',
}

export function AdminStoreLocalesPanel() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const remote = useSelector((state) => state.storeLocales.locales)
  const saveStatus = useSelector((state) => state.storeLocales.saveStatus)
  const updatedAt = useSelector((state) => state.storeLocales.updatedAt)
  const [draft, setDraft] = useState(remote)

  useEffect(() => {
    dispatch(loadStoreLocales())
  }, [dispatch])

  useEffect(() => {
    setDraft(remote)
  }, [remote])

  const dirty = STORE_CHANNELS.some((id) => draft[id] !== remote[id])

  async function save() {
    try {
      await dispatch(saveStoreLocales(draft)).unwrap()
      dispatch(addToast({ title: adminText(t, 'admin.stores.saved'), tone: 'success' }))
    } catch (error) {
      dispatch(
        addToast({
          title: adminText(t, 'admin.stores.saveFailed'),
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
          <h2 className="text-lg font-black">{adminText(t, 'admin.stores.title')}</h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">{adminText(t, 'admin.stores.description')}</p>
        </div>
        <p className="rounded-xl border border-brand-200/70 bg-brand-50/80 px-3 py-2 text-xs text-brand-900 dark:border-brand-900/40 dark:bg-brand-950/30 dark:text-brand-100">
          {adminText(t, 'admin.stores.hint')}
        </p>
      </Card>

      {STORE_CHANNELS.map((channel) => (
        <Card key={channel} className={`${CARD} grid gap-3 p-4`}>
          <div>
            <h3 className="font-black">{adminText(t, CHANNEL_KEYS[channel])}</h3>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">{adminText(t, CHANNEL_HINTS[channel])}</p>
          </div>
          <LanguageSegment
            size="sm"
            value={draft[channel]}
            ariaLabel={adminText(t, CHANNEL_KEYS[channel])}
            onChange={(code) => setDraft((current) => ({ ...current, [channel]: code }))}
          />
        </Card>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={!dirty || saveStatus === 'saving'} loading={saveStatus === 'saving'} onClick={save}>
          {adminText(t, 'admin.stores.save')}
        </Button>
        {updatedAt ? (
          <p className="text-xs text-[var(--app-text-muted)]">
            {adminText(t, 'admin.stores.updatedAt', { date: new Date(updatedAt).toLocaleString() })}
          </p>
        ) : null}
      </div>
    </div>
  )
}
