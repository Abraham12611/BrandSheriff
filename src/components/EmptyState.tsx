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
          className="inline-flex mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
