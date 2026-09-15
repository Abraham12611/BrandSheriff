import { useEffect, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useWorkspace } from '../lib/workspace'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import type { Id } from '../../convex/_generated/dataModel'

const PLATFORM_COLORS: Record<string, string> = {
  amazon: '#f59e0b',
  ebay: '#3b82f6',
  etsy: '#f97316',
  walmart: '#0ea5e9',
  alibaba: '#ea580c',
  dhgate: '#ef4444',
  temu: '#fb923c',
  shein: '#404040',
  tiktok: '#171717',
  meta: '#2563eb',
  shopify: '#059669',
  demo: '#8b5cf6',
  web: '#a3a3a3',
}

const STATUS_COLORS: Record<string, string> = {
  needs_review: '#f59e0b',
  approved: '#3b82f6',
  watchlisted: '#0ea5e9',
  dismissed: '#a3a3a3',
  allowed: '#34d399',
  case_created: '#8b5cf6',
}

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'unrated']
const SEVERITY_COLORS: Record<string, string> = {
  critical: '#e11d48',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#a3a3a3',
  unrated: '#d4d4d4',
}

function label(s: string) {
  return s.replace(/_/g, ' ')
}

export default function Analytics() {
  const { organization } = useWorkspace()
  const brands = useQuery(api.brands.list)
  const [brandId, setBrandId] = useState<Id<'brands'> | 'all'>('all')
  const summary = useQuery(api.analytics.summary, {
    brandId: brandId === 'all' ? undefined : brandId,
  })

  useEffect(() => {
    // keep 'all' default; no-op but keeps brand select controlled
  }, [])

  if (summary === undefined || brands === undefined) {
    return <Loading message="Loading analytics…" />
  }

  const openCases =
    (summary.casesByState['active'] ?? 0) +
    (summary.casesByState['watching'] ?? 0) +
    (summary.casesByState['reviewing'] ?? 0)
  const resolved = summary.casesByState['resolved'] ?? 0
  const totalCases = Object.values(summary.casesByState).reduce((a, b) => a + b, 0)
  const resolutionRate = totalCases > 0 ? Math.round((resolved / totalCases) * 100) : null

  const platformEntries = Object.entries(summary.byPlatform).sort((a, b) => b[1] - a[1])
  const statusEntries = Object.entries(summary.byStatus)
  const severityEntries = SEVERITY_ORDER.filter((s) => summary.bySeverity[s]).map(
    (s) => [s, summary.bySeverity[s]] as [string, number],
  )
  const sourceEntries = Object.entries(summary.bySource).sort((a, b) => b[1] - a[1])

  const days = lastNDays(14)
  const dayMax = Math.max(1, ...days.map((d) => summary.byDay[d] ?? 0))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle={`Enforcement analytics — ${organization?.name ?? 'workspace'}`}
        actions={
          brands.length > 1 ? (
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value as Id<'brands'> | 'all')}
              className="input-field !w-auto"
              aria-label="Filter by brand"
            >
              <option value="all">All brands</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Total discoveries" value={summary.total} />
        <Kpi
          label="Avg similarity"
          value={summary.avgSimilarity !== null ? `${Math.round(summary.avgSimilarity * 100)}%` : '—'}
          hint={summary.scoredCount > 0 ? `${summary.scoredCount} scored` : 'no scored pages yet'}
        />
        <Kpi label="Open cases" value={openCases} />
        <Kpi
          label="Resolution rate"
          value={resolutionRate !== null ? `${resolutionRate}%` : '—'}
          hint={totalCases > 0 ? `${resolved} of ${totalCases} cases` : 'no cases yet'}
        />
      </div>

      {summary.total === 0 ? (
        <EmptyState
          title="No data to analyze yet"
          description="Run a patrol or add discoveries — charts fill in as evidence accumulates."
          actionTo="/discoveries"
          actionLabel="Go to Threat Radar"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="app-panel p-5">
            <h3 className="font-semibold text-sm mb-4">Discoveries — last 14 days</h3>
            <div className="flex items-end gap-1 h-32">
              {days.map((d) => {
                const n = summary.byDay[d] ?? 0
                const h = Math.max(n > 0 ? 8 : 2, (n / dayMax) * 100)
                return (
                  <div key={d} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[10px] text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {n}
                    </span>
                    <div
                      className={`w-full rounded-t transition-all ${n > 0 ? 'bg-neutral-900' : 'bg-neutral-200'}`}
                      style={{ height: `${h}%` }}
                      title={`${d}: ${n} discoveries`}
                    />
                    <span className="text-[9px] text-neutral-400">
                      {d.slice(8)}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="app-panel p-5">
            <h3 className="font-semibold text-sm mb-4">Review status</h3>
            <div className="flex items-center gap-6">
              <Donut
                entries={statusEntries.map(([k, v]) => ({
                  label: label(k),
                  value: v,
                  color: STATUS_COLORS[k] ?? '#d4d4d4',
                }))}
                total={summary.total}
              />
              <ul className="space-y-1.5 flex-1">
                {statusEntries.map(([k, v]) => (
                  <li key={k} className="flex items-center gap-2 text-sm">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: STATUS_COLORS[k] ?? '#d4d4d4' }}
                    />
                    <span className="flex-1 capitalize text-neutral-600">{label(k)}</span>
                    <span className="font-medium">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="app-panel p-5">
            <h3 className="font-semibold text-sm mb-4">Top infringing channels</h3>
            <div className="space-y-2.5">
              {platformEntries.map(([platform, n]) => {
                const pct = Math.round((n / summary.total) * 100)
                return (
                  <div key={platform}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="capitalize font-medium">{platform}</span>
                      <span className="text-neutral-500 text-xs">
                        {n} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: PLATFORM_COLORS[platform] ?? '#a3a3a3',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="app-panel p-5">
            <h3 className="font-semibold text-sm mb-4">Severity mix</h3>
            <div className="space-y-2.5">
              {severityEntries.map(([sev, n]) => {
                const pct = Math.round((n / summary.total) * 100)
                return (
                  <div key={sev}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="capitalize font-medium">{sev}</span>
                      <span className="text-neutral-500 text-xs">
                        {n} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: SEVERITY_COLORS[sev] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            {sourceEntries.length > 0 && (
              <div className="mt-5 pt-4 border-t border-neutral-100">
                <div className="text-xs text-neutral-500 mb-2">Discovery sources</div>
                <div className="flex flex-wrap gap-1.5">
                  {sourceEntries.map(([src, n]) => (
                    <span key={src} className="badge bg-neutral-100 text-neutral-700 capitalize">
                      {src}: {n}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function lastNDays(n: number): string[] {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10))
  }
  return out
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string
  value: number | string
  hint?: string
}) {
  return (
    <div className="app-panel px-4 py-4">
      <div className="text-xs text-neutral-500 font-medium">{label}</div>
      <div className="text-3xl font-semibold tracking-tight mt-1">{value}</div>
      {hint && <div className="text-[11px] text-neutral-400 mt-1">{hint}</div>}
    </div>
  )
}

function Donut({
  entries,
  total,
}: {
  entries: Array<{ label: string; value: number; color: string }>
  total: number
}) {
  const R = 42
  const C = 2 * Math.PI * R
  let offset = 0
  const segments = entries
    .filter((e) => e.value > 0)
    .map((e) => {
      const frac = e.value / Math.max(1, total)
      const seg = { ...e, dash: frac * C, offset: -offset }
      offset += frac * C
      return seg
    })

  return (
    <div className="relative w-32 h-32 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#f4f4f5" strokeWidth="14" />
        {segments.map((s) => (
          <circle
            key={s.label}
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={`${s.dash} ${C - s.dash}`}
            strokeDashoffset={s.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold">{total}</span>
        <span className="text-[10px] text-neutral-400">total</span>
      </div>
    </div>
  )
}
