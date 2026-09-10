import { Link } from 'react-router-dom'

export default function PageHeader({
  title,
  subtitle,
  backTo,
  backLabel,
  actions,
}: {
  title: string
  subtitle?: string
  backTo?: string
  backLabel?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div className="min-w-0">
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 hover:underline mb-1"
          >
            ← {backLabel ?? 'Back'}
          </Link>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{title}</h1>
        {subtitle && <p className="text-neutral-600 mt-1 text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
