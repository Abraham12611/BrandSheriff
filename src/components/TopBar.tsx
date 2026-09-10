import { useState } from 'react'
import { UserButton } from '@clerk/react'
import { useWorkspace } from '../lib/workspace'

export default function TopBar() {
  const { organization, organizations, setOrganization } = useWorkspace()
  const [open, setOpen] = useState(false)

  return (
    <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-neutral-900">
          {organization?.name ?? 'BrandSheriff'}
        </div>
        {organization && organizations.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="text-xs text-neutral-500 hover:text-neutral-900"
              aria-label="Switch workspace"
            >
              ▼
            </button>
            {open && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-neutral-200 rounded-md shadow-lg z-50">
                {organizations.map((org) => (
                  <button
                    key={org._id}
                    onClick={() => {
                      setOrganization(org)
                      setOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 ${
                      org._id === organization._id ? 'font-medium text-neutral-900' : 'text-neutral-600'
                    }`}
                  >
                    {org.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {organization && organizations.length === 1 && (
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
