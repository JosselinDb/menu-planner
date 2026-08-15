interface RecipeImageProps {
  src?: string | null
  alt: string
  variant?: 'card' | 'hero' | 'form'
  className?: string
}

export function RecipeImage({ src, alt, variant = 'card', className = '' }: RecipeImageProps) {
  const classes = ['recipe-image', `recipe-image-${variant}`, className].filter(Boolean).join(' ')

  if (src) {
    return <img src={src} alt={alt} className={classes} loading="lazy" />
  }

  return (
    <div className={`recipe-image-placeholder ${classes}`} aria-hidden>
      <span>🍽️</span>
    </div>
  )
}
