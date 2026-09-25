import { useLanguage } from '../../../contexts/useLanguage'
import { isGeneratedAvatar } from './portraitLibrary'

/**
 * Pastille discrète « Avatar » (verre / teal) sur un avatar créé avec l’éditeur Moxt
 * (portrait de la bibliothèque ou illustré). Rien pour une photo perso.
 * Le parent doit être `relative` ; `className` règle la position verticale.
 */
export function AvatarBadge({ url, loreleiUrl, className = '-bottom-2' }) {
  const { t } = useLanguage()
  if (!isGeneratedAvatar(url, { loreleiUrl })) return null
  return (
    <span
      title={t('profile.avatarEditor.portraitBadgeTitle')}
      className={`pointer-events-none absolute left-1/2 z-[1] inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-white/70 bg-white/80 px-1.5 py-px text-[0.56rem] font-bold uppercase leading-[1.4] tracking-[0.14em] text-brand-800 shadow-[0_2px_10px_-3px_rgba(8,112,95,0.55)] backdrop-blur-md dark:border-teal-300/40 dark:bg-slate-950/70 dark:text-teal-300 dark:shadow-[0_0_12px_-2px_rgba(45,212,191,0.6)] ${className}`}
    >
      <span aria-hidden="true" className="size-1 rounded-full bg-brand-600 dark:bg-teal-300" />
      {t('profile.avatarEditor.portraitBadge')}
    </span>
  )
}
