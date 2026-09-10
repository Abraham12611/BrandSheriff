import { useState, useRef, useEffect } from 'react'
import { UserButton } from '@clerk/react'
import { ChevronDown } from 'lucide-react'
import { useWorkspace } from '../lib/workspace'

export default function TopBar() {
  const { organization, organizations, setOrganization } = useWorkspace()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [open])

  return (
    <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-neutral-900">
          {organization?.name ?? 'BrandSheriff'}
        </div>
        {organization && organizations.length > 1 && (
          <div className="relative" ref={containerRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900"
              aria-label="Switch workspace"
              aria-haspopup="listbox"
              aria-expanded={open}
            >
              <ChevronDown className="w-3 h-3" aria-hidden="true" />
            </button>
            {open && (
              <div
                className="absolute top-full left-0 mt-1 w-56 bg-white border border-neutral-200 rounded-lg shadow-lg z-50"
                role="listbox"
              >
                {organizations.map((org) => (
                  <button
                    key={org._id}
                    onClick={() => {
                      setOrganization(org)
                      setOpen(false)
                    }}
                    role="option"
                    aria-selected={org._id === organization._id}
                    className={`w-full text-left px-3 py-2 text-sm first:rounded-t-lg last:rounded-b-lg hover:bg-neutral-50 ${
                      org._id === organization._id ? 'font-medium text-neutral-900' : 'text-neutral-600'
                    }`}
                  >
                    <span className="block">{org.name}</span>
                    <span className="block text-xs text-neutral-400">{org.slug}</span>
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
