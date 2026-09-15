import { useEffect, useState } from 'react'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Doc, Id } from '../../convex/_generated/dataModel'
import { useWorkspace } from '../lib/workspace'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import EnableProviderActions from '../components/EnableProviderActions'

export default function Patrols() {
  const { organization, providerActionsEnabled } = useWorkspace()
  const brands = useQuery(api.brands.list)
  const [selectedBrandId, setSelectedBrandId] = useState<Id<'brands'> | null>(null)

  useEffect(() => {
    if (!brands || brands.length === 0) return
    setSelectedBrandId((prev) =>
      prev && brands.some((b) => b._id === prev) ? prev : brands[0]._id,
    )
  }, [brands])

  const brand = brands?.find((b) => b._id === selectedBrandId) ?? brands?.[0]

  const runs = useQuery(
    api.patrolRuns.listByBrand,
    brand ? { brandId: brand._id } : 'skip',
  )
  const discoveries = useQuery(
    api.discoveries.listByBrandStatus,
    brand ? { brandId: brand._id, status: 'needs_review' } : 'skip',
  )
  const runPatrol = useMutation(api.patrolRuns.start)
  const search = useAction(api.patrol.runSearch)
  const investigate = useAction(api.forensics.investigateDiscovery)
  const createCase = useMutation(api.cases.createFromDiscovery)
  const [running, setRunning] = useState(false)
  const [working, setWorking] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  const start = async () => {
    if (!brand) return
    setError(null)
    setRunning(true)
    try {
      const runId = await runPatrol({ brandId: brand._id, type: 'brand_name' })
      const queries = [brand.name, `${brand.name} official`, `${brand.name} sale`]
      await search({ runId, brandId: brand._id, queries })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Patrol failed')
    } finally {
      setRunning(false)
    }
  }

  const handleInvestigate = async (discoveryId: Id<'discoveries'>) => {
    setError(null)
    setWorking((prev) => ({ ...prev, [discoveryId]: true }))
    try {
      await investigate({ discoveryId })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Investigation failed')
    } finally {
      setWorking((prev) => ({ ...prev, [discoveryId]: false }))
    }
  }

  const handleCreateCase = async (discoveryId: Id<'discoveries'>, title: string) => {
    setError(null)
    try {
      await createCase({ discoveryId, title: `Case: ${title}` })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case')
    }
  }

  if (brands === undefined || runs === undefined || discoveries === undefined) {
    return <Loading message="Loading patrol data…" />
  }

  const canRun = brand !== undefined && providerActionsEnabled && !running
  const disabledReason = !brand
    ? 'Add a brand first to run a patrol'
    : !providerActionsEnabled
    ? 'Provider actions are disabled for this workspace'
    : 'Search the web for copies and impersonators of this brand'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Threat Radar"
        subtitle={`Patrols and discoveries for ${organization?.name ?? 'this workspace'}`}
        actions={
          <div className="flex items-center gap-2">
            {brands.length > 1 && brand && (
              <select
                aria-label="Brand to patrol"
                value={brand._id}
                onChange={(e) => setSelectedBrandId(e.target.value as Id<'brands'>)}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
              >
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={start}
              disabled={!canRun}
              title={disabledReason}
              className="btn-primary"
            >
              {running ? 'Running…' : 'Run patrol'}
            </button>
          </div>
        }
      />

      <EnableProviderActions />

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-sm">{error}</div>
      )}

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
            <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 font-medium">
              Patrol runs{brand ? ` — ${brand.name}` : ''}
            </div>
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
                <DiscoveryRow
                  key={d._id}
                  discovery={d}
                  busy={!!working[d._id]}
                  providerActionsEnabled={providerActionsEnabled}
                  onInvestigate={() => handleInvestigate(d._id)}
                  onCreateCase={() => handleCreateCase(d._id, d.title ?? d.canonicalUrl)}
                />
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

function DiscoveryRow({
  discovery,
  busy,
  providerActionsEnabled,
  onInvestigate,
  onCreateCase,
}: {
  discovery: Doc<'discoveries'>
  busy: boolean
  providerActionsEnabled: boolean
  onInvestigate: () => void
  onCreateCase: () => void
}) {
  return (
    <li className="px-4 py-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium truncate">{discovery.title ?? discovery.canonicalUrl}</p>
          <a href={discovery.canonicalUrl} target="_blank" rel="noreferrer" className="text-xs text-violet-600 hover:underline truncate block">
            {discovery.canonicalUrl}
          </a>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {discovery.matchConfidence !== undefined && (
            <span className={`badge ${scoreStyle(discovery.matchConfidence)}`}>
              {Math.round(discovery.matchConfidence * 100)}%
            </span>
          )}
          {discovery.severity && <SeverityBadge severity={discovery.severity} />}
        </div>
      </div>
      {discovery.summary && <p className="text-sm text-neutral-600">{discovery.summary}</p>}
      <div className="flex items-center gap-2">
        <button
          onClick={onInvestigate}
          disabled={busy || !providerActionsEnabled}
          title={
            providerActionsEnabled
              ? 'Scrape the page and run AI-assisted forensic comparison'
              : 'Provider actions are disabled for this workspace'
          }
          className="btn-secondary"
        >
          {busy ? 'Investigating…' : 'Investigate'}
        </button>
        <button
          onClick={onCreateCase}
          title="Create a case from this discovery"
          className="btn-primary"
        >
          Create case
        </button>
      </div>
    </li>
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
