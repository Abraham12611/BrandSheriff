import { UserButton } from '@clerk/react'
import { useWorkspace } from '../lib/workspace'

export default function TopBar() {
  const { organization } = useWorkspace()

  return (
    <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-neutral-900">{organization?.name ?? 'BrandSheriff'}</div>
        {organization && (
          <span className="text-xs text-neutral-500">{organization.slug}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
          Auth-enabled prototype
        </span>
        <UserButton />
      </div>
    </header>
  )
}
