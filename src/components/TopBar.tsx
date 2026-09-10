import { UserButton } from '@clerk/react'

export default function TopBar() {
  return (
    <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-6 shrink-0">
      <div className="text-sm text-neutral-500">BrandSheriff</div>
      <div className="flex items-center gap-3">
        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
          Auth-enabled prototype
        </span>
        <UserButton />
      </div>
    </header>
  )
}
