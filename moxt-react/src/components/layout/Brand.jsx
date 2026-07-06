export function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-serif text-[1.75rem] font-black tracking-[0.08em] text-[#073f35] dark:text-brand-200">
        MOXT
      </span>
      {!compact ? (
        <span className="hidden text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 2xl:block">
          Services sans frontières
        </span>
      ) : null}
    </div>
  )
}
