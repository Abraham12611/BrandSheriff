import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export default function Patrols() {
  const brands = useQuery(api.brands.list)
  const firstBrand = brands?.[0]
  const runs = useQuery(
    api.patrolRuns.listByBrand,
    firstBrand ? { brandId: firstBrand._id } : 'skip',
  )
  const discoveries = useQuery(
    api.discoveries.listByBrandStatus,
    firstBrand ? { brandId: firstBrand._id, status: 'needs_review' } : 'skip',
  )
  const runPatrol = useMutation(api.patrolRuns.start)
  const search = useAction(api.patrol.runSearch)
  const investigate = useAction(api.forensics.investigateDiscovery)
  const createCase = useMutation(api.cases.createFromDiscovery)

  const start = async () => {
    if (!firstBrand) return
    const runId = await runPatrol({ brandId: firstBrand._id, type: 'brand_name' })
    const queries = [firstBrand.name, `${firstBrand.name} official`, `${firstBrand.name} sale`]
    await search({ runId, brandId: firstBrand._id, queries })
  }

  const handleInvestigate = async (discoveryId: Id<'discoveries'>) => {
    await investigate({ discoveryId })
  }

  const handleCreateCase = async (discoveryId: Id<'discoveries'>, title: string) => {
    await createCase({ discoveryId, title: `Case: ${title}` })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Threat Radar</h1>
        <button
          onClick={start}
          disabled={!firstBrand}
          className="px-4 py-2 bg-neutral-900 text-white rounded-md text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
        >
          Run patrol
        </button>
      </div>

      <section className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 font-medium">Patrol runs</div>
        <table className="min-w-full text-sm text-left">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 font-medium text-neutral-600">Patrol</th>
              <th className="px-4 py-3 font-medium text-neutral-600">Status</th>
              <th className="px-4 py-3 font-medium text-neutral-600">Started</th>
            </tr>
          </thead>
          <tbody>
            {runs?.map((run) => (
              <tr key={run._id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 font-medium">{run.type}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={run.status} />
                </td>
                <td className="px-4 py-3 text-neutral-600">{new Date(run.startedAt).toLocaleString()}</td>
              </tr>
            ))}
            {runs?.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-neutral-500">
                  No patrol runs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 font-medium">Discoveries needing review</div>
        <ul className="divide-y divide-neutral-100">
          {discoveries?.map((d) => (
            <li key={d._id} className="px-4 py-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{d.title ?? d.canonicalUrl}</p>
                  <a href={d.canonicalUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline truncate block">
                    {d.canonicalUrl}
                  </a>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {d.matchConfidence !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${scoreStyle(d.matchConfidence)}`}>
                      {Math.round(d.matchConfidence * 100)}%
                    </span>
                  )}
                  {d.severity && <SeverityBadge severity={d.severity} />}
                </div>
              </div>
              {d.summary && <p className="text-sm text-neutral-600">{d.summary}</p>}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleInvestigate(d._id)}
                  className="px-3 py-1.5 bg-white border border-neutral-300 rounded-md text-xs font-medium hover:bg-neutral-50"
                >
                  Investigate
                </button>
                <button
                  onClick={() => handleCreateCase(d._id, d.title ?? d.canonicalUrl)}
                  className="px-3 py-1.5 bg-neutral-900 text-white rounded-md text-xs font-medium hover:bg-neutral-800"
                >
                  Create case
                </button>
              </div>
            </li>
          ))}
          {discoveries?.length === 0 && (
            <li className="px-4 py-8 text-center text-neutral-500">No discoveries yet. Run a patrol first.</li>
          )}
        </ul>
      </section>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    queued: 'bg-neutral-100 text-neutral-700',
    running: 'bg-blue-50 text-blue-700',
    completed: 'bg-emerald-50 text-emerald-700',
    failed: 'bg-rose-50 text-rose-700',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? styles.queued}`}>
      {status}
    </span>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    low: 'bg-neutral-100 text-neutral-700',
    medium: 'bg-amber-50 text-amber-700',
    high: 'bg-orange-50 text-orange-700',
    critical: 'bg-rose-50 text-rose-700',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[severity] ?? styles.low}`}>
      {severity}
    </span>
  )
}

function scoreStyle(score: number) {
  if (score >= 0.8) return 'bg-rose-100 text-rose-700'
  if (score >= 0.5) return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-100 text-emerald-700'
}
