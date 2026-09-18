import { useState } from 'react'
import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, Network } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { useWorkspace } from '../lib/workspace'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'

type OffenderRow = {
  _id: Id<'offenders'>
  label: string
  status: string
  firstSeenAt: number
  lastSeenAt: number
  maxCloneScore?: number
  discoveryCount: number
  hosts: string[]
  matchTypes: string[]
}

const STATUS_STYLE: Record<string, string> = {
  suspected: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-rose-50 text-rose-700',
  resolved: 'bg-emerald-50 text-emerald-700',
}

function OffenderCard({ row, orgId }: { row: OffenderRow; orgId: Id<'organizations'> }) {
  const [open, setOpen] = useState(false)
  const detail = useQuery(
    api.offenders.get,
    open ? { offenderId: row._id, organizationId: orgId } : 'skip',
  )

  return (
    <div className="app-panel overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-neutral-50"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-neutral-900 font-mono">{row.label}</p>
            <span className={`badge ${STATUS_STYLE[row.status] ?? ''}`}>{row.status}</span>
            {row.maxCloneScore !== undefined && (
              <span
                className={`badge font-semibold ${
                  row.maxCloneScore >= 70
                    ? 'bg-rose-50 text-rose-700'
                    : row.maxCloneScore >= 40
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {row.maxCloneScore}/100
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            {row.discoveryCount} linked discover{row.discoveryCount === 1 ? 'y' : 'ies'}
            {row.hosts.length > 1 && ` across ${row.hosts.length} hosts`}
            {' · '}first seen {new Date(row.firstSeenAt).toLocaleDateString()}
            {' · '}last seen {new Date(row.lastSeenAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          {row.matchTypes.map((t) => (
            <span key={t} className="badge bg-neutral-100 text-neutral-500 text-[10px]">
              {t.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </button>
      {open && (
        <div className="border-t border-neutral-100 divide-y divide-neutral-50">
          {detail === undefined ? (
            <p className="px-4 py-3 text-xs text-neutral-400">Loading linked discoveries…</p>
          ) : (
            <>
              {detail.discoveries.map((d) => (
                <div key={d._id} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-neutral-800 truncate">
                      {d.canonicalUrl}
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      linked via {d.matchType.replace(/_/g, ' ')}
                      {d.cloneScore !== undefined && ` · clone score ${d.cloneScore}`}
                    </p>
                  </div>
                  <span className="badge bg-neutral-100 text-neutral-500 text-[10px] capitalize">
                    {d.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
              {(detail.relatedCases?.length ?? 0) > 0 && (
                <div className="px-4 py-2.5 bg-neutral-50/50">
                  <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-1.5">
                    Related cases
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.relatedCases.map((c: any) => (
                      <Link
                        key={c._id}
                        to={`/cases/${c._id}`}
                        className="badge bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-400 text-[10px]"
                      >
                        {c.caseNumber} · {c.state}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/** Networks — the offender graph: which discoveries belong to the same
 * operation, so a takedown targets the network not just the URL. */
export default function Networks() {
  const { organization } = useWorkspace()
  const rows = useQuery(
    api.offenders.listForOrg,
    organization ? { organizationId: organization._id } : 'skip',
  ) as OffenderRow[] | undefined

  if (!organization || rows === undefined) {
    return <Loading message="Loading offender networks…" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Networks"
        subtitle="Offender graph — discoveries grouped by the operation behind them, so enforcement targets the network, not one URL at a time."
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No offender networks yet"
          description="As patrols find suspect pages, BrandSheriff groups them by host and shared stolen assets into offender operations."
          actionTo="/discoveries"
          actionLabel="Open discoveries"
        />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <OffenderCard key={r._id} row={r} orgId={organization._id} />
          ))}
        </div>
      )}

      <div className="app-panel p-4 flex items-start gap-3">
        <Network className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
        <p className="text-xs text-neutral-500 leading-relaxed">
          Networks are built from observable links — same host, same stolen
          asset fingerprints. Cross-channel identity resolution (shared contact
          info, seller handles, payment patterns) is on the roadmap; today a
          network means "these discoveries are probably the same operation."
        </p>
      </div>
    </div>
  )
}
