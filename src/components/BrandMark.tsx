type BrandMarkProps = { className?: string }

export default function BrandMark({ className = 'w-7 h-7' }: BrandMarkProps) {
  return (
    <img
      src="/brand/brandsheriff-mark.svg"
      alt=""
      aria-hidden="true"
      className={`${className} shrink-0 rounded-lg object-contain`}
    />
  )
}
