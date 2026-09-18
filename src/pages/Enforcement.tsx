import { useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import { useWorkspace } from '../lib/workspace'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'

const COLUMNS = [
  { key: 'recommended', label: 'Recommended', style: 'border-neutral-200' },
  { key: 'prepared', label: 'Prepared', style: 'border-blue-200' },
  { key: 'submitted', label: 'Submitted', style: 'border-purple-200' },
  { key: 'platform_reviewing', label: 'Platform reviewing', style: 'border-indigo-200' },
  { key: 'actioned', label: 'Actioned', style: 'border-emerald-200' },
  { key: 'rejected', label: 'Rejected', style: 'border-rose-200' },
] as const

const STATUS_DOT: Record<string, string> = {
  recommended: 'bg-neutral-400',
  prepared: 'bg-blue-500',
  submitted: 'bg-purple-500',
  platform_reviewing: 'bg-indigo-500',
  actioned: 'bg-emerald-500',
  rejected: 'bg-rose-500',
  counter_notice: 'bg-orange-500',
  withdrawn: 'bg-neutral-300',
}

type Row = {
  _id: string
  caseId: string
  route: string
  routeLabel: string
  channel: string
  basis: string
  status: string
  confidence: string
  reason: string
  caseNumber?: string
  caseTitle?: string
  updatedAt: number
}

/**
 * Enforcement pipeline — every complaint channel across every case, grouped
 * by lifecycle stage. This is the "attack it from several directions" board:
 * platform, host, registrar, search, ads, social, marketplace, counsel.
 */
export default function Enforcement() {
  const { organization } = useWorkspace()
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const rows = useQuery(
    api.enforcementRoutes.listForOrganization,
    organization ? { organizationId: organization._id } : 'skip',
  ) as Row[] | undefined
  const stats = useQuery(
    api.enforcementStats.routeStats,
    organization ? { organizationId: organization._id } : 'skip',
  ) as
    | {
        channels: Array<{
          channel: string
          total: number
          submitted: number
          actioned: number
          rejected: number
          inFlight: number
          counterNotices: number
          actionedRate: number | null
          medianDaysToAction: number | null
        }>
        totals: {
          total: number
          actioned: number
          inFlight: number
          recommended: number
          counterNotices: number
        }
      }
    | undefined

  const filtered = useMemo(() => {
    const all = rows ?? []
    if (channelFilter === 'all') return all
    return all.filter((r) => r.channel === channelFilter)
  }, [rows, channelFilter])

  const byStatus = useMemo(() => {
    const map = new Map<string, Row[]>()
    for (const col of COLUMNS) map.set(col.key, [])
    for (const r of filtered) {
      if (!map.has(r.status)) map.set(r.status, [])
      map.get(r.status)!.push(r)
    }
    return map
  }, [filtered])

  if (rows === undefined) return <Loading message="Loading enforcement pipeline…" />

  const channels = [...new Set(rows.map((r) => r.channel))].sort()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enforcement"
        subtitle="Every complaint channel across all cases — platform, host, registrar, search, ads, social, marketplace, counsel."
        actions={
          channels.length > 0 ? (
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="input-field text-sm w-auto"
            >
              <option value="all">All channels</option>
              {channels.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          ) : undefined
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No enforcement actions yet"
          description="Open a case and hit 'Track all routes' in the Enforcement routes panel — BrandSheriff fans the case out into platform-native complaint channels."
          actionTo="/cases"
          actionLabel="Open cases"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {COLUMNS.map((col) => {
              const items = byStatus.get(col.key) ?? []
              return (
                <div
                  key={col.key}
                  className={`rounded-xl border ${col.style} bg-white overflow-hidden`}
                >
                  <div className="px-3 py-2.5 border-b border-neutral-100 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT[col.key]}`} />
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                      {col.label}
                    </h3>
                    <span className="ml-auto text-xs text-neutral-400">{items.length}</span>
                  </div>
                  <div className="divide-y divide-neutral-50 max-h-80 overflow-y-auto">
                    {items.length === 0 ? (
                      <p className="px-3 py-4 text-[11px] text-neutral-400">Nothing here</p>
                    ) : (
                      items.map((r) => (
                        <Link
                          key={r._id}
                          to={`/cases/${r.caseId}`}
                          className="block px-3 py-2.5 hover:bg-neutral-50"
                        >
                          <p className="text-xs font-medium text-neutral-800 truncate">
                            {r.routeLabel}
                          </p>
                          <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                            {r.caseNumber ? `${r.caseNumber} · ` : ''}
                            {r.caseTitle ?? 'Untitled case'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="badge bg-neutral-100 text-neutral-500 text-[10px]">
                              {r.basis}
                            </span>
                            <span className="badge bg-neutral-100 text-neutral-500 text-[10px]">
                              {r.channel.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {stats && stats.channels.length > 0 && (
            <section className="app-panel overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-100">
                <h2 className="font-medium text-sm">What works — outcome by channel</h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Learned from this workspace's filings. Rates count only decided actions
                  (actioned vs rejected).
                </p>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-neutral-500 border-b border-neutral-100">
                    <th className="px-4 py-2 font-medium">Channel</th>
                    <th className="px-4 py-2 font-medium text-right">Filed</th>
                    <th className="px-4 py-2 font-medium text-right">In flight</th>
                    <th className="px-4 py-2 font-medium text-right">Actioned</th>
                    <th className="px-4 py-2 font-medium text-right">Rejected</th>
                    <th className="px-4 py-2 font-medium text-right">Counter-notices</th>
                    <th className="px-4 py-2 font-medium text-right">Success rate</th>
                    <th className="px-4 py-2 font-medium text-right">Median days</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.channels.map((c) => (
                    <tr key={c.channel} className="border-b border-neutral-50 last:border-0">
                      <td className="px-4 py-2.5 capitalize font-medium text-neutral-800">
                        {c.channel.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-2.5 text-right text-neutral-600">{c.submitted}</td>
                      <td className="px-4 py-2.5 text-right text-neutral-600">{c.inFlight}</td>
                      <td className="px-4 py-2.5 text-right text-emerald-700 font-medium">
                        {c.actioned}
                      </td>
                      <td className="px-4 py-2.5 text-right text-rose-600">{c.rejected}</td>
                      <td className="px-4 py-2.5 text-right text-orange-600">{c.counterNotices}</td>
                      <td className="px-4 py-2.5 text-right text-neutral-700 font-medium">
                        {c.actionedRate !== null ? `${c.actionedRate}%` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-neutral-600">
                        {c.medianDaysToAction !== null ? c.medianDaysToAction : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <div className="app-panel p-4 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
            <p className="text-xs text-neutral-500 leading-relaxed">
              Routes are recommendations based on the discovery's signals — copied
              assets, text similarity, channel, and repeat-offender history. Legal
              attestations (sworn copyright statements, trademark claims) always stay
              behind human approval; AI prepares the packet, you decide whether it
              goes out.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
