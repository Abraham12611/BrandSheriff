import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Fingerprint, Radar, Briefcase, Plus, Menu, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
  { to: '/brand', label: 'Brand DNA', icon: Fingerprint },
  { to: '/patrols', label: 'Threat Radar', icon: Radar },
  { to: '/cases', label: 'Cases', icon: Briefcase },
]

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

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
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar text-neutral-100 flex flex-col border-r border-neutral-800
          transform transition-transform duration-200 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        aria-label="Primary navigation"
      >
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm">
              BS
            </div>
            <span className="font-semibold text-lg tracking-tight">BrandSheriff</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 text-neutral-400 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-violet-600 text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`
              }
            >
              <item.icon className="w-4 h-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <NavLink
            to="/onboarding"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-violet-400 hover:bg-neutral-900'
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
