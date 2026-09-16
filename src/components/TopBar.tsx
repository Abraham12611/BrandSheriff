import { useState, useRef, useEffect } from 'react'
import { UserButton } from '@clerk/react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { ChevronDown, Bell, CheckCheck } from 'lucide-react'
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
        {organization && <NotificationBell organizationId={organization._id} />}
        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
          Auth-enabled prototype
        </span>
        <UserButton />
      </div>
    </header>
  )
}

function NotificationBell({ organizationId }: { organizationId: string }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const unread = useQuery(api.notifications.unreadCount, { organizationId: organizationId as never })
  const items = useQuery(
    api.notifications.listRecent,
    open ? { organizationId: organizationId as never } : 'skip',
  )
  const markRead = useMutation(api.notifications.markRead)
  const markAllRead = useMutation(api.notifications.markAllRead)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell className="w-[18px] h-[18px]" />
        {(unread ?? 0) > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {unread! > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100">
            <span className="text-xs font-semibold text-neutral-800">Notifications</span>
            {(unread ?? 0) > 0 && (
              <button
                onClick={() => markAllRead({ organizationId: organizationId as never })}
                className="text-[11px] text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-50">
            {(items ?? []).length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-neutral-500">
                Nothing yet — replies and watch alerts will appear here.
              </p>
            ) : (
              items!.map((n) => (
                <button
                  key={n._id}
                  onClick={() => {
                    markRead({ notificationId: n._id })
                    setOpen(false)
                    if (n.href) navigate(n.href)
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    {!n.readAt && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    )}
                    <div className={`min-w-0 ${n.readAt ? 'pl-4' : ''}`}>
                      <p className={`text-xs truncate ${n.readAt ? 'text-neutral-500' : 'font-medium text-neutral-900'}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">{n.body}</p>
                      )}
                      <p className="text-[10px] text-neutral-400 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
