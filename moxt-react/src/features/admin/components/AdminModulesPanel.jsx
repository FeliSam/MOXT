import { useEffect, useState } from 'react'
import { FiBriefcase, FiBox, FiCalendar, FiPlay, FiRss, FiStar } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { useLanguage } from '../../../contexts/useLanguage'
import { DEV_MODULE_IDS, DEV_MODULE_META } from '../../../config/devModules'
import { adminText } from '../adminI18n'
import { CARD } from '../adminConfig'
import { loadPlatformModules, savePlatformModules } from '../../platform/platformModulesSlice'
import { addToast } from '../../ui/uiSlice'

const MODULE_ICONS = {
  stars: FiStar,
  feed: FiRss,
  videos: FiPlay,
  events: FiCalendar,
  jobs: FiBriefcase,
  parcels: FiBox,
}

export function AdminModulesPanel() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const remoteFlags = useSelector((state) => state.platformModules.flags)
  const saveStatus = useSelector((state) => state.platformModules.saveStatus)
  const updatedAt = useSelector((state) => state.platformModules.updatedAt)
  const [draft, setDraft] = useState(remoteFlags)

  useEffect(() => {
    dispatch(loadPlatformModules())
  }, [dispatch])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync draft from remote module flags
    setDraft(remoteFlags)
  }, [remoteFlags])

  function toggle(moduleId) {
    setDraft((current) => ({ ...current, [moduleId]: !current[moduleId] }))
  }

  async function save() {
    try {
      await dispatch(savePlatformModules(draft)).unwrap()
      dispatch(
        addToast({
          title: adminText(t, 'admin.modules.saved'),
          tone: 'success',
        }),
      )
    } catch (error) {
      dispatch(
        addToast({
          title: adminText(t, 'admin.modules.saveFailed'),
          message: error?.message,
          tone: 'error',
        }),
      )
    }
  }

  const dirty = DEV_MODULE_IDS.some((id) => Boolean(draft[id]) !== Boolean(remoteFlags[id]))

  return (
    <div className="grid gap-4">
      <Card className={`${CARD} grid gap-3 p-5`}>
        <div>
          <h2 className="text-lg font-black">{adminText(t, 'admin.modules.title')}</h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">{adminText(t, 'admin.modules.description')}</p>
        </div>
        <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          {adminText(t, 'admin.modules.adminHint')}
        </p>
      </Card>

      <div className="grid gap-3">
        {DEV_MODULE_IDS.map((moduleId) => {
          const meta = DEV_MODULE_META[moduleId]
          const Icon = MODULE_ICONS[moduleId] || FiStar
          const enabled = Boolean(draft[moduleId])
          return (
            <Card key={moduleId} className={`${CARD} flex items-start gap-4 p-4`}>
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--app-surface-muted)] text-[var(--app-text)]">
                <Icon aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-black">{adminText(t, meta.labelKey)}</p>
                <p className="mt-0.5 text-sm text-[var(--app-text-muted)]">{adminText(t, meta.hintKey)}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={adminText(t, meta.labelKey)}
                onClick={() => toggle(moduleId)}
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
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button loading={saveStatus === 'saving'} disabled={!dirty} onClick={save}>
          {adminText(t, 'admin.modules.save')}
        </Button>
        {updatedAt ? (
          <p className="text-xs text-[var(--app-text-faint)]">
            {adminText(t, 'admin.modules.updatedAt', {
              date: new Date(updatedAt).toLocaleString(),
            })}
          </p>
        ) : null}
      </div>
    </div>
  )
}
