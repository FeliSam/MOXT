import { useId } from 'react'
import { FiChevronDown } from 'react-icons/fi'
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../../config/uiTranslations'
import { useLanguage } from '../../contexts/useLanguage'
import { updateAccountPreferences } from '../../features/account/accountSlice'
import { useDispatch, useSelector } from 'react-redux'

export function LanguageSwitcher({ className = '' }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const { language, setLanguage } = useLanguage()
  const selectId = useId()

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
    <div className={`relative shrink-0 ${className}`}>
      <label htmlFor={selectId} className="sr-only">
        Langue de l&apos;application
      </label>
      <select
        id={selectId}
        value={language}
        onChange={(event) => selectLanguage(event.target.value)}
        aria-label="Langue de l'application"
        className="h-10 min-w-[4.75rem] max-w-[7.5rem] cursor-pointer appearance-none rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] py-2 pl-3 pr-8 text-[11px] font-black uppercase tracking-wide text-[var(--app-text)] outline-none transition-colors hover:bg-[var(--app-surface-muted)] focus:border-[var(--app-teal)] focus:shadow-[0_0_0_3px_rgba(18,191,163,0.14)]"
      >
        {SUPPORTED_LANGUAGES.map((code) => (
          <option key={code} value={code}>
            {LANGUAGE_LABELS[code]?.label || code.toUpperCase()}
          </option>
        ))}
      </select>
      <FiChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-[var(--app-text-muted)]"
        aria-hidden="true"
      />
    </div>
  )
}
