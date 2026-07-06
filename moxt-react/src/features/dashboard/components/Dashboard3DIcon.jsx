const sizeClasses = {
  sm: 'size-20 sm:size-[5.5rem]',
  md: 'size-24 sm:size-28',
  lg: 'size-28 sm:size-32',
  quick: 'size-32 sm:size-36 lg:size-28 xl:size-32',
}

export function Dashboard3DIcon({
  alt = '',
  className = '',
  imageLogo,
  size = 'md',
  src,
}) {
  const sizeClass = sizeClasses[size] || sizeClasses.md
  const logoSrc = imageLogo || src.replace('/assets/services/3d/', '/assets/services/')

  return (
    <span className={`relative inline-grid shrink-0 place-items-center ${className}`}>
      <span
        className="dashboard-icon-3d relative inline-grid place-items-center lg:hidden"
        aria-hidden={alt ? undefined : true}
      >
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
        aria-hidden={alt ? undefined : true}
      />
    </span>
  )
}
