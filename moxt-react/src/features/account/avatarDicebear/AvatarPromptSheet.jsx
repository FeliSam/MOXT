import { LuSparkles } from 'react-icons/lu'
import { Modal } from '../../../components/ui/Modal'
import { useLanguage } from '../../../contexts/useLanguage'
import './avatarEditor.css'
import { MoxtMark } from './editorParts'
import { defaultPortraitChoice, findPortrait, hairstylesFor } from './portraitOptions'

/** Bottom sheet premium : invitation à personnaliser l’avatar (4 portraits du profil par défaut). */
export default function AvatarPromptSheet({ userId, onCustomize, onLater }) {
  const { t } = useLanguage()
  const tx = (key) => t(`profile.avatarEditor.prompt.${key}`)
  const { gender, tone } = defaultPortraitChoice(userId)
  const samples = hairstylesFor(gender)
    .slice(0, 4)
    .map((hair) => findPortrait({ gender, tone, hair: hair.id }))
    .filter(Boolean)

  return (
    <Modal
      open
      onClose={onLater}
      title={tx('title')}
      bare
      panelClassName="ave-root w-full self-end overflow-hidden rounded-t-[2rem] sm:max-w-md sm:self-center sm:rounded-[2rem]"
    >
      <div className="relative px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 text-center sm:pb-7 sm:pt-6">
        <span
          aria-hidden="true"
          className="mx-auto mb-4 block h-1 w-10 rounded-full bg-current opacity-15 sm:hidden"
        />
        <p className="ave-brand flex items-center justify-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.38em]">
          <MoxtMark className="size-4" />
          <span className="-mr-[0.38em]">{tx('eyebrow')}</span>
        </p>

        <div
          className="relative mx-auto mt-5 flex w-fit items-center justify-center"
          role="img"
          aria-label={tx('previewAlt')}
        >
          <div aria-hidden="true" className="ave-mesh" />
          {samples.map((item, index) => (
            <span
              key={item.id}
              className={`ave-ring relative block size-[4.6rem] shrink-0 !p-1 ${index ? '-ml-4' : ''}`}
              style={{
                zIndex: index === 1 || index === 2 ? 3 : 2,
                transform: `translateY(${index === 1 || index === 2 ? -6 : 4}px)`,
              }}
            >
              <img
                src={item.thumbUrl}
                alt=""
                className="relative size-full rounded-full object-cover"
                draggable="false"
                decoding="async"
              />
            </span>
          ))}
        </div>

        <h2 className="ave-serif ave-title mt-6 text-[1.7rem] leading-tight">{tx('title')}</h2>
        <div aria-hidden="true" className="ave-rule mx-auto mt-3" />
        <p className="ave-muted mx-auto mt-3 max-w-xs text-sm leading-relaxed">{tx('body')}</p>

        <div className="mt-6 grid gap-2">
          <button
            type="button"
            onClick={onCustomize}
            className="ave-btn ave-btn-primary inline-flex h-[3.25rem] items-center justify-center gap-2 rounded-2xl px-4 text-[0.95rem] font-semibold"
          >
            <LuSparkles aria-hidden="true" className="size-[1.1rem]" />
            {tx('cta')}
          </button>
          <button
            type="button"
            onClick={onLater}
            className="ave-btn ave-link inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold"
          >
            {tx('later')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
