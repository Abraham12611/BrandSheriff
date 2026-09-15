import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useAction } from 'convex/react'
import {
  ArrowDownWideNarrow,
  CheckCheck,
  ChevronDown,
  History,
  Plus,
  Radar,
  X,
} from 'lucide-react'
import { api } from '../../convex/_generated/api'
import type { Doc, Id } from '../../convex/_generated/dataModel'
import { useWorkspace } from '../lib/workspace'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import EnableProviderActions from '../components/EnableProviderActions'
import CompareCard, { type DiscoveryAction } from '../components/discoveries/CompareCard'
import AddDiscoveryModal from '../components/discoveries/AddDiscoveryModal'
import Modal from '../components/Modal'

const TABS = [
  { key: 'needs_review', label: 'Needs Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'watchlisted', label: 'Watchlist' },
  { key: 'dismissed', label: 'Dismissed' },
  { key: 'allowed', label: 'Allowed' },
] as const

type TabKey = (typeof TABS)[number]['key']

type SortKey = 'newest' | 'similarity'

function sortDiscoveries(list: Doc<'discoveries'>[], sort: SortKey) {
  const copy = [...list]
  if (sort === 'similarity') {
    copy.sort(
      (a, b) =>
        (b.similarityScore ?? b.matchConfidence ?? -1) -
        (a.similarityScore ?? a.matchConfidence ?? -1),
    )
  } else {
    copy.sort((a, b) => b._creationTime - a._creationTime)
  }
  return copy
}

export default function Discoveries() {
  const { organization, providerActionsEnabled } = useWorkspace()
  const navigate = useNavigate()
  const brands = useQuery(api.brands.list)
  const [selectedBrandId, setSelectedBrandId] = useState<Id<'brands'> | 'all'>('all')
  const [tab, setTab] = useState<TabKey>('needs_review')
  const [sort, setSort] = useState<SortKey>('newest')
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRuns, setShowRuns] = useState(false)
  const [confirmApproveAll, setConfirmApproveAll] = useState(false)
  const [denyReason, setDenyReason] = useState('Wrong match')
  const [running, setRunning] = useState(false)
  const [working, setWorking] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSelection(new Set())
  }, [tab, selectedBrandId])

  const brandIdArg = selectedBrandId === 'all' ? undefined : selectedBrandId
  const counts = useQuery(api.discoveries.countsByStatus, { brandId: brandIdArg })
  const discoveries = useQuery(api.discoveries.listForInbox, {
    status: tab,
    brandId: brandIdArg,
  })
  const runs = useQuery(
    api.patrolRuns.listByBrand,
    brandIdArg ? { brandId: brandIdArg } : 'skip',
  )

  const review = useMutation(api.discoveries.review)
  const bulkReview = useMutation(api.discoveries.bulkReview)
  const runPatrol = useMutation(api.patrolRuns.start)
  const search = useAction(api.patrol.runSearch)
  const investigate = useAction(api.forensics.investigateDiscovery)
  const createCase = useMutation(api.cases.createFromDiscovery)

  const firstBrand = selectedBrandId === 'all' ? brands?.[0] : brands?.find((b) => b._id === selectedBrandId)

  const sorted = useMemo(
    () => sortDiscoveries(discoveries ?? [], sort),
    [discoveries, sort],
  )

  const allSelected = sorted.length > 0 && sorted.every((d) => selection.has(d._id))

  const toggleAll = () => {
    if (allSelected) {
      setSelection(new Set())
    } else {
      setSelection(new Set(sorted.map((d) => d._id)))
    }
  }

  const toggleOne = (id: string, checked: boolean) => {
    setSelection((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleAction = async (
    discovery: Doc<'discoveries'>,
    action: DiscoveryAction,
    reason?: string,
  ) => {
    setError(null)
    const id = discovery._id
    if (action === 'investigate') {
      setWorking((p) => ({ ...p, [id]: true }))
      try {
        await investigate({ discoveryId: id })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Investigation failed')
      } finally {
        setWorking((p) => ({ ...p, [id]: false }))
      }
      return
    }
    if (action === 'createCase') {
      setWorking((p) => ({ ...p, [id]: true }))
      try {
        const caseId = await createCase({
          discoveryId: id,
          title: `Case: ${discovery.title ?? discovery.canonicalUrl}`,
        })
        navigate(`/cases/${caseId}`)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create case')
      } finally {
        setWorking((p) => ({ ...p, [id]: false }))
      }
      return
    }
    setWorking((p) => ({ ...p, [id]: true }))
    try {
      await review({ discoveryId: id, action, reason })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Review failed')
    } finally {
      setWorking((p) => ({ ...p, [id]: false }))
    }
  }

  const bulk = async (action: 'approve' | 'dismiss' | 'watchlist' | 'allow') => {
    if (selection.size === 0) return
    setError(null)
    try {
      await bulkReview({
        discoveryIds: [...selection] as Id<'discoveries'>[],
        action,
        reason: action === 'dismiss' ? denyReason : undefined,
      })
      setSelection(new Set())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bulk review failed')
    }
  }

  const approveAll = async () => {
    setConfirmApproveAll(false)
    setError(null)
    try {
      await bulkReview({
        discoveryIds: sorted.map((d) => d._id),
        action: 'approve',
      })
      setSelection(new Set())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approve all failed')
    }
  }

  const startPatrol = async () => {
    const brand = firstBrand
    if (!brand) return
    setError(null)
    setRunning(true)
    try {
      const runId = await runPatrol({ brandId: brand._id, type: 'brand_name' })
      const queries = [brand.name, `${brand.name} official`, `${brand.name} sale`]
      await search({ runId, brandId: brand._id, queries })
      setTab('needs_review')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Patrol failed')
    } finally {
      setRunning(false)
    }
  }

  if (brands === undefined || counts === undefined || discoveries === undefined) {
    return <Loading message="Loading discoveries…" />
  }

  const brandNameFor = (d: Doc<'discoveries'>) =>
    brands.find((b) => b._id === d.brandId)?.name ?? 'Brand'

  const pendingCount = counts['needs_review'] ?? 0
  const weekAgo = Date.now() - 7 * 86400_000
  const newThisWeek = (discoveries ?? []).filter(
    (d) => d.status === tab && d._creationTime > weekAgo,
  ).length
  const similarities = sorted
    .map((d) => d.similarityScore ?? d.matchConfidence)
    .filter((s): s is number => s !== undefined)
  const avgSimilarity =
    similarities.length > 0
      ? Math.round((similarities.reduce((a, b) => a + b, 0) / similarities.length) * 100)
      : null

  return (
    <div className="space-y-5">
      <PageHeader
        title="Threat Radar"
        subtitle={`Suspected copies and impersonators — ${organization?.name ?? 'workspace'}`}
        actions={
          <div className="flex items-center gap-2">
            {brands.length > 1 && (
              <select
                aria-label="Filter by brand"
                value={selectedBrandId}
                onChange={(e) =>
                  setSelectedBrandId(e.target.value as Id<'brands'> | 'all')
                }
                className="input-field !w-auto"
              >
                <option value="all">All brands</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-secondary"
              disabled={!firstBrand}
              title={firstBrand ? 'Flag a suspect URL directly' : 'Add a brand first'}
            >
              <Plus className="w-4 h-4" /> Add by URL
            </button>
            <button
              onClick={startPatrol}
              disabled={!firstBrand || !providerActionsEnabled || running}
              className="btn-primary"
              title={
                !providerActionsEnabled
                  ? 'Provider actions are disabled for this workspace'
                  : 'Search the web for copies of this brand'
              }
            >
              <Radar className="w-4 h-4" />
              {running ? 'Running…' : 'Run patrol'}
            </button>
          </div>
        }
      />

      <EnableProviderActions />

      {error && (
        <div className="p-3.5 bg-rose-50 text-rose-700 rounded-xl text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="p-1 hover:bg-rose-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {brands.length === 0 ? (
        <EmptyState
          title="No brands to protect yet"
          description="Add a brand and build its Brand DNA before running patrols."
          actionTo="/onboarding"
          actionLabel="Add brand"
        />
      ) : (
        <>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1">
            {TABS.map((t) => {
              const n = counts[t.key] ?? 0
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Needs review" value={pendingCount} accent={pendingCount > 0} />
            <StatCard label="New this week" value={newThisWeek} />
            <StatCard label="Avg similarity" value={avgSimilarity !== null ? `${avgSimilarity}%` : '—'} />
            <StatCard label="Watchlisted" value={counts['watchlisted'] ?? 0} />
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-neutral-300 accent-neutral-900"
                aria-label="Select all"
              />
              Select all ({sorted.length})
            </label>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="input-field !w-auto !py-1.5 !pr-8 appearance-none text-xs"
                  aria-label="Sort discoveries"
                >
                  <option value="newest">Newest first</option>
                  <option value="similarity">Highest similarity</option>
                </select>
                <ArrowDownWideNarrow className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
              {tab === 'needs_review' && sorted.length > 0 && (
                <button onClick={() => setConfirmApproveAll(true)} className="btn-secondary !py-1.5 text-xs">
                  <CheckCheck className="w-3.5 h-3.5" /> Approve all
                </button>
              )}
              <button
                onClick={() => setShowRuns((v) => !v)}
                className="btn-ghost !py-1.5 text-xs"
              >
                <History className="w-3.5 h-3.5" /> Patrol runs
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showRuns ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          </div>

          {showRuns && (
            <section className="app-panel overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-100 font-medium text-sm">
                Patrol runs
              </div>
              {runs === undefined ? (
                <div className="p-4 text-sm text-neutral-500">
                  {selectedBrandId === 'all' ? 'Select a brand to view runs.' : 'Loading…'}
                </div>
              ) : runs.length === 0 ? (
                <div className="p-4 text-sm text-neutral-500">No patrol runs yet.</div>
              ) : (
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-neutral-50 border-b border-neutral-100">
                    <tr>
                      <th className="px-4 py-2.5 font-medium text-neutral-600">Type</th>
                      <th className="px-4 py-2.5 font-medium text-neutral-600">Status</th>
                      <th className="px-4 py-2.5 font-medium text-neutral-600">Started</th>
                      <th className="px-4 py-2.5 font-medium text-neutral-600">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((run) => (
                      <tr key={run._id} className="border-b border-neutral-50 last:border-0">
                        <td className="px-4 py-2.5 capitalize">{run.type.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-2.5">
                          <RunStatusBadge status={run.status} />
                        </td>
                        <td className="px-4 py-2.5 text-neutral-600">
                          {new Date(run.startedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-neutral-600">
                          {run.completedAt ? new Date(run.completedAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {sorted.length === 0 ? (
            <EmptyState
              title={`Nothing in ${TABS.find((t) => t.key === tab)?.label ?? tab}`}
              description={
                tab === 'needs_review'
                  ? 'Run a patrol or add a suspect URL to start reviewing discoveries.'
                  : 'Discoveries you move here will appear in this view.'
              }
              actionTo={tab === 'needs_review' ? undefined : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-20">
              {sorted.map((d) => (
                <CompareCard
                  key={d._id}
                  discovery={d}
                  brandName={brandNameFor(d)}
                  selected={selection.has(d._id)}
                  onSelect={(checked) => toggleOne(d._id, checked)}
                  onAction={(action, reason) => handleAction(d, action, reason)}
                  busy={!!working[d._id]}
                />
              ))}
            </div>
          )}
        </>
      )}

      {selection.size > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 app-panel px-4 py-3 flex items-center gap-3 animate-toast-in"
          style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.18)' }}
        >
          <span className="text-sm font-medium">{selection.size} selected</span>
          <div className="w-px h-5 bg-neutral-200" />
          <button onClick={() => bulk('approve')} className="btn-primary !py-1.5 text-xs">
            Approve
          </button>
          <select
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
            className="input-field !w-auto !py-1.5 text-xs"
            aria-label="Deny reason"
          >
            <option>Wrong match</option>
            <option>Authorized seller</option>
            <option>Official content</option>
          </select>
          <button onClick={() => bulk('dismiss')} className="btn-danger-soft !py-1.5 text-xs">
            Deny
          </button>
          <button onClick={() => bulk('watchlist')} className="btn-secondary !py-1.5 text-xs">
            Watchlist
          </button>
          <button
            onClick={() => setSelection(new Set())}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <AddDiscoveryModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        brandId={firstBrand?._id}
      />

      <Modal
        open={confirmApproveAll}
        onClose={() => setConfirmApproveAll(false)}
        title={`Approve ${sorted.length} discoveries?`}
        subtitle="Each one moves to Approved, ready to become a case. This doesn't send anything."
        footer={
          <>
            <button onClick={() => setConfirmApproveAll(false)} className="btn-ghost">
              Cancel
            </button>
            <button onClick={approveAll} className="btn-primary">
              Approve all
            </button>
          </>
        }
      >
        <p className="text-sm text-neutral-600">
          Approved discoveries keep their evidence and can be escalated into cases at any
          time. You can still dismiss them later.
        </p>
      </Modal>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number | string
  accent?: boolean
}) {
  return (
    <div className="app-panel px-4 py-3.5">
      <div className="text-xs text-neutral-500 font-medium">{label}</div>
      <div className={`text-2xl font-semibold tracking-tight mt-1 ${accent ? 'text-amber-600' : ''}`}>
        {value}
      </div>
    </div>
  )
}

function RunStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    queued: 'bg-neutral-100 text-neutral-600',
    running: 'bg-blue-50 text-blue-700',
    completed: 'bg-emerald-50 text-emerald-700',
    failed: 'bg-rose-50 text-rose-700',
  }
  return <span className={`badge ${styles[status] ?? styles.queued}`}>{status}</span>
}
