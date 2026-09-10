import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { useWorkspace } from '../lib/workspace'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import EnableProviderActions from '../components/EnableProviderActions'

export default function Patrols() {
  const { organization, providerActionsEnabled } = useWorkspace()
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

  if (brands === undefined || runs === undefined || discoveries === undefined) {
    return <Loading message="Loading patrol data…" />
  }

  const canRun = firstBrand !== undefined && providerActionsEnabled
  const disabledReason = !firstBrand
    ? 'Add a brand first to run a patrol'
    : !providerActionsEnabled
    ? 'Provider actions are disabled for this workspace'
    : 'Start a patrol for the active brand'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Threat Radar"
        subtitle={`Patrols and discoveries for ${organization?.name ?? 'this workspace'}`}
        actions={
          <button
            onClick={start}
            disabled={!canRun}
            title={disabledReason}
            className="btn-primary"
          >
            Run patrol
          </button>
        }
      />

      <EnableProviderActions />

      {brands.length === 0 ? (
        <EmptyState
          title="No brands to patrol"
          description="Patrols search for copies and impersonators of an official brand. Add a brand before running any patrols."
          actionTo="/onboarding"
          actionLabel="Add brand"
        />
      ) : (
        <>
          <section className="app-panel overflow-hidden">
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
                {runs.map((run) => (
                  <tr key={run._id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 font-medium capitalize">{run.type}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{new Date(run.startedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {runs.length === 0 && (
              <EmptyState
                title="No patrol runs yet"
                description="Click Run patrol to search the web for copies and impersonators of your brand."
              />
            )}
          </section>

          <section className="app-panel overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 font-medium">Discoveries needing review</div>
            <ul className="divide-y divide-neutral-100">
              {discoveries.map((d) => (
                <li key={d._id} className="px-4 py-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{d.title ?? d.canonicalUrl}</p>
                      <a href={d.canonicalUrl} target="_blank" rel="noreferrer" className="text-xs text-violet-600 hover:underline truncate block">
                        {d.canonicalUrl}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {d.matchConfidence !== undefined && (
                        <span className={`badge ${scoreStyle(d.matchConfidence)}`}>
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
                      title="AI-assisted investigation (prototype actions are still gated)"
                      className="btn-secondary"
                    >
                      Investigate
                    </button>
                    <button
                      onClick={() => handleCreateCase(d._id, d.title ?? d.canonicalUrl)}
                      title="Create a case from this discovery"
                      className="btn-primary"
                    >
                      Create case
                    </button>
                  </div>
                </li>
              ))}
              {discoveries.length === 0 && (
                <EmptyState
                  title="No discoveries yet"
                  description="Run a patrol to find suspected copies and impersonators."
                />
              )}
            </ul>
          </section>
        </>
      )}
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
    <span className={`badge ${styles[status] ?? styles.queued}`}>
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
    <span className={`badge ${styles[severity] ?? styles.low}`}>
      {severity}
    </span>
  )
}

function scoreStyle(score: number) {
  if (score >= 0.8) return 'bg-rose-100 text-rose-700'
  if (score >= 0.5) return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-100 text-emerald-700'
}
