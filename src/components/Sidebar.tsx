import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', label: 'Command Center' },
  { to: '/brand', label: 'Brand DNA' },
  { to: '/patrols', label: 'Threat Radar' },
  { to: '/cases', label: 'Cases' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-neutral-950 text-neutral-100 flex flex-col border-r border-neutral-800">
      <div className="p-5 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-neutral-950 font-bold text-sm">
            BS
          </div>
          <span className="font-semibold text-lg tracking-tight">BrandSheriff</span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-neutral-800">
        <NavLink
          to="/onboarding"
          className="block px-3 py-2 rounded-md text-sm font-medium text-amber-400 hover:bg-neutral-900 transition-colors"
        >
          + Add brand
        </NavLink>
      </div>
    </aside>
  )
}
