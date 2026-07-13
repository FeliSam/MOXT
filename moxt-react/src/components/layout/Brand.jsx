export function Brand({ compact = false, iconOnly = false }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <img
        src="/assets/logos/X.png"
        alt="MOXT"
        className="h-9 w-9 shrink-0 rounded-xl object-cover sm:h-10 sm:w-10"
        width={40}
        height={40}
      />
      {!compact && !iconOnly ? (
        <div className="min-w-0">
          <span className="block font-serif text-xl font-black tracking-[0.06em] text-[#073f35] dark:text-brand-200">
            MOXT
          </span>
          <span className="hidden text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 xl:block">
            Services sans frontières
          </span>
        </div>
      ) : null}
    </div>
  )
}
