import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useLanguage } from '../../../contexts/useLanguage'
import { useHorizontalScrollState } from '../../../hooks/useHorizontalScrollState'

const ARROW_BTN =
  'absolute top-1/2 z-10 grid -translate-y-1/2 place-items-center rounded-full border border-[var(--app-border)] bg-white/95 p-2 shadow-lg backdrop-blur-sm transition hover:scale-110 hover:border-[var(--app-accent)] dark:bg-[var(--app-surface)]'

export function ScrollArrows({ scrollRef, showOnDesktop = false, showDots = true }) {
  const { t } = useLanguage()
  const { activePage, canScrollLeft, canScrollRight, overflow, pageCount } =
    useHorizontalScrollState(scrollRef)

  function scrollByPage(direction) {
    const el = scrollRef.current
    if (!el) return
    const amount = Math.max(240, Math.round(el.clientWidth * 0.82))
    el.scrollBy({ left: direction * amount, behavior: 'smooth' })
  }

  if (!overflow) return null

  const arrowVisibility = showOnDesktop ? 'grid' : 'hidden sm:grid lg:hidden'

  return (
    <>
      {canScrollLeft ? (
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          aria-label={t('dashboard.scroll.left')}
          className={`${ARROW_BTN} left-0 ${arrowVisibility}`}
        >
          <FiChevronLeft className="text-lg" />
        </button>
      ) : null}
      {canScrollRight ? (
        <button
          type="button"
          onClick={() => scrollByPage(1)}
          aria-label={t('dashboard.scroll.right')}
          className={`${ARROW_BTN} right-0 ${arrowVisibility}`}
        >
          <FiChevronRight className="text-lg" />
        </button>
      ) : null}
      {showDots && pageCount > 1 ? (
        <div
          className="pointer-events-none absolute inset-x-0 -bottom-1 flex justify-center gap-1.5 lg:hidden"
          aria-hidden="true"
        >
          {Array.from({ length: pageCount }, (_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activePage
                  ? 'w-4 bg-brand-600 dark:bg-brand-400'
                  : 'w-1.5 bg-[var(--app-border)]'
              }`}
            />
          ))}
        </div>
      ) : null}
    </>
  )
}
