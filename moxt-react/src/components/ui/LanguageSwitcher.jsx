import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../../config/uiTranslations'
import { useLanguage } from '../../contexts/useLanguage'
import { updateAccountPreferences } from '../../features/account/accountSlice'
import { useDispatch, useSelector } from 'react-redux'

export function LanguageSwitcher({ className = '', compact = false }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const { language, setLanguage } = useLanguage()

  function selectLanguage(code) {
    if (code === language) return
    setLanguage(code)
    if (user?.id) {
      dispatch(
        updateAccountPreferences({
          userId: user.id,
          preferences: { language: code },
        }),
      )
    }
  }

  return (
    <div
      className={`inline-flex max-w-full items-center gap-0.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-0.5 ${className}`}
      role="group"
      aria-label="Langue de l'application"
    >
      {SUPPORTED_LANGUAGES.map((code) => {
        const active = language === code
        return (
          <button
            key={code}
            type="button"
            onClick={() => selectLanguage(code)}
            aria-pressed={active}
            className={`rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-wide transition-all duration-200 sm:px-2.5 sm:text-[11px] ${
              active
                ? 'bg-brand-700 text-white shadow-sm dark:bg-brand-600'
                : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]'
            }`}
            title={LANGUAGE_LABELS[code] || code}
          >
            {compact ? code.toUpperCase() : code.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
