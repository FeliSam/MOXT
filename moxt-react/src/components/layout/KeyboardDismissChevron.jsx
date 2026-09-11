import { LuChevronDown } from 'react-icons/lu'
import { useLanguage } from '../../contexts/useLanguage'
import { isNative, nativePlatform } from '../../platform/capacitor'
import { syncKeyboardInsetAfterBlur } from '../../hooks/useKeyboardInset'

export function KeyboardDismissChevron() {
  const { t } = useLanguage()
  if (!isNative || nativePlatform !== 'ios') return null

  async function dismiss() {
    const active = document.activeElement
    if (active instanceof HTMLElement) active.blur()
    try {
      const { Keyboard } = await import('@capacitor/keyboard')
      await Keyboard.hide()
    } catch {
      /* plugin indisponible */
    }
    syncKeyboardInsetAfterBlur()
  }

  return (
    <button
      type="button"
      className="keyboard-dismiss-chevron"
      aria-label={t('common.dismissKeyboard')}
      onMouseDown={(event) => event.preventDefault()}
      onClick={dismiss}
    >
      <LuChevronDown size={20} strokeWidth={2.25} aria-hidden />
    </button>
  )
}
