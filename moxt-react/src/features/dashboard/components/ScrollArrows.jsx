import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export function ScrollArrows({ scrollRef }) {
  function scrollLeft() {
    scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })
  }
  function scrollRight() {
    scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })
  }

  return (
    <>
      <button
        type="button"
        onClick={scrollLeft}
        aria-label="Défiler à gauche"
        className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 place-items-center rounded-full border border-[var(--app-border)] bg-white/95 p-2 shadow-lg backdrop-blur-sm transition hover:scale-110 hover:border-[var(--app-accent)] sm:grid lg:hidden dark:bg-[var(--app-surface)]"
      >
        <FiChevronLeft className="text-lg" />
      </button>
      <button
        type="button"
        onClick={scrollRight}
        aria-label="Défiler à droite"
        className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 place-items-center rounded-full border border-[var(--app-border)] bg-white/95 p-2 shadow-lg backdrop-blur-sm transition hover:scale-110 hover:border-[var(--app-accent)] sm:grid lg:hidden dark:bg-[var(--app-surface)]"
      >
        <FiChevronRight className="text-lg" />
      </button>
    </>
  )
}
