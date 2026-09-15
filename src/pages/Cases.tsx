import { useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import { useWorkspace } from '../lib/workspace'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'reviewing', label: 'Reviewing' },
  { key: 'watching', label: 'Watching' },
  { key: 'resolved', label: 'Resolved' },
] as const

type TabKey = (typeof TABS)[number]['key']

const STATE_STYLE: Record<string, string> = {
  active: 'bg-amber-50 text-amber-700',
  reviewing: 'bg-blue-50 text-blue-700',
  awaiting_approval: 'bg-purple-50 text-purple-700',
  watching: 'bg-sky-50 text-sky-700',
  resolved: 'bg-emerald-50 text-emerald-700',
}

const SEVERITY_STYLE: Record<string, string> = {
  low: 'bg-neutral-100 text-neutral-600',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-orange-50 text-orange-700',
  critical: 'bg-rose-50 text-rose-700',
}

export default function Cases() {
  const { organization } = useWorkspace()
  const [tab, setTab] = useState<TabKey>('all')
  const [query, setQuery] = useState('')
  const counts = useQuery(api.cases.countsByState)
  const cases = useQuery(api.cases.listForOrg, {
    state: tab === 'all' ? undefined : tab,
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cases ?? []
    return (cases ?? []).filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.caseNumber.toLowerCase().includes(q) ||
        (c.summary ?? '').toLowerCase().includes(q),
    )
  }, [cases, query])

  if (cases === undefined || counts === undefined) {
    return <Loading message="Loading cases…" />
  }

  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cases"
        subtitle={`Enforcement cases for ${organization?.name ?? 'this workspace'}`}
        actions={
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cases…"
              className="input-field !pl-9 !w-56"
              aria-label="Search cases"
            />
          </div>
        }
      />

      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const n = t.key === 'all' ? totalAll : (counts[t.key] ?? 0)
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="status-pill"
              data-active={active}
              aria-pressed={active}
            >
              {t.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                  active ? 'bg-white/20 text-white' : 'bg-neutral-200/70 text-neutral-600'
                }`}
              >
                {n}
              </span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={query ? 'No cases match' : `No ${tab === 'all' ? '' : `${tab} `}cases`}
          description={
            query
              ? 'Try a different search term.'
              : 'Cases are created from approved discoveries on the Threat Radar.'
          }
          actionTo="/discoveries"
          actionLabel="Go to Threat Radar"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <Link
              key={c._id}
              to={`/cases/${c._id}`}
              className="app-panel card-lift p-4 block group"
            >
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-[11px] font-mono text-neutral-400">{c.caseNumber}</span>
                <span className={`badge capitalize ${STATE_STYLE[c.state] ?? 'bg-neutral-100 text-neutral-700'}`}>
                  {c.state.replace(/_/g, ' ')}
                </span>
                {c.severity && (
                  <span className={`badge capitalize ${SEVERITY_STYLE[c.severity] ?? SEVERITY_STYLE.low}`}>
                    {c.severity}
                  </span>
                )}
              </div>
              <div className="text-sm font-medium group-hover:underline line-clamp-1">
                {c.title}
              </div>
              {c.summary && (
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{c.summary}</p>
              )}
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-neutral-50">
                <span className="text-[11px] text-neutral-400">
                  {new Date(c._creationTime).toLocaleDateString()}
                  {c.resolvedAt && ` · resolved ${new Date(c.resolvedAt).toLocaleDateString()}`}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
