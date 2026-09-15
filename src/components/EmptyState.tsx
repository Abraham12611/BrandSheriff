import { Link } from 'react-router-dom'

export default function EmptyState({
  title,
  description,
  actionTo,
  actionLabel,
}: {
  title: string
  description: string
  actionTo?: string
  actionLabel?: string
}) {
  return (
    <div className="text-center py-12 px-4">
      <h3 className="text-base font-medium text-neutral-900">{title}</h3>
      <p className="text-sm text-neutral-600 mt-1 max-w-md mx-auto">{description}</p>
      {actionTo && actionLabel && (
        <Link
          to={actionTo}
          className="btn-primary mt-4"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
