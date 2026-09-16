import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useQuery } from 'convex/react'
import {
  LayoutDashboard,
  Fingerprint,
  Radar,
  Briefcase,
  BarChart3,
  FileText,
  Plus,
  Menu,
  X,
  Shield,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { api } from '../../convex/_generated/api'

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  badge?: number
}

function NavSection({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="pt-4 first:pt-1">
      {label && (
        <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
          {label}
        </div>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const counts = useQuery(api.discoveries.countsByStatus, {})
  const needsReview = counts?.needs_review ?? 0

  const mainItems: NavItem[] = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  ]
  const activityItems: NavItem[] = [
    { to: '/discoveries', label: 'Discoveries', icon: Radar, badge: needsReview },
    { to: '/cases', label: 'Cases', icon: Briefcase },
  ]
  const brandItems: NavItem[] = [
    { to: '/brand', label: 'Brand Profile', icon: Fingerprint },
  ]
  const dataItems: NavItem[] = [
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/reports', label: 'Reports', icon: FileText },
  ]

  const renderItem = (item: NavItem) => (
    <NavLink
      key={item.to}
      to={item.to}
      onClick={() => setMobileOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
          isActive
            ? 'bg-white/10 text-white'
            : 'text-neutral-400 hover:text-white hover:bg-white/5'
        }`
      }
    >
      <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-400/15 text-amber-300 min-w-[22px] text-center">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </NavLink>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-sidebar text-white rounded-md shadow-lg"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-60 bg-sidebar text-neutral-100 flex flex-col border-r border-neutral-800/60
          transform transition-transform duration-200 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        aria-label="Primary navigation"
      >
        <div className="px-5 h-14 border-b border-neutral-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
              <Shield className="w-4 h-4 text-neutral-900" />
            </div>
            <span className="font-semibold text-[15px] tracking-tight">BrandSheriff</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 text-neutral-400 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <NavSection>{mainItems.map(renderItem)}</NavSection>
          <NavSection label="Activity">{activityItems.map(renderItem)}</NavSection>
          <NavSection label="Brand">{brandItems.map(renderItem)}</NavSection>
          <NavSection label="Data">{dataItems.map(renderItem)}</NavSection>
        </nav>

        <div className="p-3 border-t border-neutral-800/60">
          <NavLink
            to="/onboarding"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add brand
          </NavLink>
        </div>
      </aside>
    </>
  )
}
