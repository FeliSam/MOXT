const sizeClasses = {
  sm: 'size-16 sm:size-20',
  md: 'size-20 sm:size-24',
  lg: 'size-24 sm:size-28',
  xl: 'size-28 sm:size-32',
  quick: 'size-32 sm:size-36 lg:size-28 xl:size-32',
  hero: 'size-[7.5rem] sm:size-36',
  featured: 'size-28 sm:size-32',
  compact: 'size-[4.5rem] sm:size-20',
}

/** Position absolue + léger débordement hors du cadre parent (overflow visible). */
const posClasses = {
  br: 'absolute -bottom-3 -right-2 sm:-bottom-4 sm:-right-3',
  bl: 'absolute -bottom-3 -left-2 sm:-bottom-4 sm:-left-3',
  tr: 'absolute -top-2 -right-2 sm:-top-3 sm:-right-3',
  tl: 'absolute -top-2 -left-2 sm:-top-3 sm:-left-3',
  end: 'relative self-end',
  center: 'relative mx-auto',
}

export function Dashboard3DIcon({
  alt = '',
  className = '',
  imageLogo,
  pos = 'end',
  size = 'md',
  src,
}) {
  const sizeClass = sizeClasses[size] || sizeClasses.md
  const posClass = posClasses[pos] || posClasses.end
  const logoSrc = imageLogo || src.replace('/assets/services/3d/', '/assets/services/')

  return (
    <span
      className={`pointer-events-none z-[2] inline-grid shrink-0 place-items-center ${posClass} ${className}`}
      aria-hidden={alt ? undefined : true}
    >
      <span className="dashboard-icon-3d relative inline-grid place-items-center lg:hidden">
        <span className="dashboard-icon-3d__shadow" />
        <img
          src={src}
          alt={alt}
          loading="lazy"
          draggable={false}
          className={`dashboard-icon-3d__img object-contain ${sizeClass}`}
        />
      </span>
      <img
        src={logoSrc}
        alt={alt}
        loading="lazy"
        draggable={false}
        className={`hidden object-contain lg:block ${sizeClass}`}
      />
    </span>
  )
}
