import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import { useWorkspace } from '../lib/workspace'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'

export default function Dashboard() {
  const { organization, isLoading: workspaceLoading } = useWorkspace()
  const brands = useQuery(api.brands.list)
  const firstBrand = brands?.[0]
  const discoveries = useQuery(api.discoveries.listByStatus, { status: 'needs_review' })
  const activeCases = useQuery(api.cases.listByState, { state: 'active' })
  const resolvedCases = useQuery(api.cases.listByState, { state: 'resolved' })
  const runs = useQuery(
    api.patrolRuns.listByBrand,
    firstBrand ? { brandId: firstBrand._id } : 'skip',
  )

  if (workspaceLoading) {
    return <Loading message="Loading workspace…" />
  }

  if (!organization) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-xl border border-neutral-200 p-8 text-center">
        <h1 className="text-2xl font-bold">Create your workspace</h1>
        <p className="text-neutral-600 mt-2">
          Before you can monitor brands and cases, you need a BrandSheriff workspace.
        </p>
        <Link
          to="/onboarding"
          className="btn-primary mt-6"
        >
          Set up workspace
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Command Center"
        subtitle={`Workspace: ${organization.name}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/onboarding"
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                (brands?.length ?? 0) === 0
                  ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                  : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              Onboard a brand
            </Link>
            <Link
              to="/discoveries"
              className="btn-secondary"
            >
              Run patrol
            </Link>
            <Link
              to="/cases"
              className="btn-secondary"
            >
              View cases
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Brands monitored" value={brands?.length ?? 0} />
        <KpiCard label="Needs review" value={discoveries?.length ?? 0} tone="warning" />
        <KpiCard label="Active cases" value={activeCases?.length ?? 0} tone="danger" />
        <KpiCard label="Resolved" value={resolvedCases?.length ?? 0} tone="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 app-panel p-6">
          <h2 className="font-semibold mb-4">Quick actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/onboarding"
              className={(brands?.length ?? 0) === 0 ? 'btn-primary' : 'btn-secondary'}
            >
              Onboard a brand
            </Link>
            <Link
              to="/discoveries"
              className="btn-secondary"
            >
              Run patrol
            </Link>
            <Link
              to="/cases"
              className="btn-secondary"
            >
              View cases
            </Link>
          </div>

          {firstBrand && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-neutral-200 p-4">
                <div className="text-xs text-neutral-500 uppercase tracking-wide">Official demo store</div>
                <a
                  href={`${import.meta.env.VITE_CONVEX_SITE_URL || window.location.origin}/demo/northstar/index.html`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-neutral-700 hover:underline mt-1 block truncate"
                >
                  Northstar Atelier
                </a>
              </div>
              <div className="rounded-lg border border-neutral-200 p-4">
                <div className="text-xs text-neutral-500 uppercase tracking-wide">Demo clone threat</div>
                <a
                  href={`${import.meta.env.VITE_CONVEX_SITE_URL || window.location.origin}/demo/clone/index.html`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-neutral-700 hover:underline mt-1 block truncate"
                >
                  Suspicious clone
                </a>
              </div>
            </div>
          )}
        </section>

        <section className="app-panel overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 font-medium">Recent patrol runs</div>
          <ul className="divide-y divide-neutral-100">
            {runs?.slice(0, 5).map((run) => (
              <li key={run._id} className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{run.type}</span>
                <StatusBadge status={run.status} />
              </li>
            ))}
            {(runs?.length ?? 0) === 0 && (
              <li className="px-4 py-8 text-center text-neutral-500 text-sm">No patrol runs yet.</li>
            )}
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="app-panel overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 font-medium">Discoveries needing review</div>
          <ul className="divide-y divide-neutral-100">
            {discoveries?.slice(0, 5).map((d) => (
              <li key={d._id} className="px-4 py-3">
                <Link to="/discoveries" className="text-sm font-medium hover:underline block truncate">
                  {d.title ?? d.canonicalUrl}
                </Link>
                <p className="text-xs text-neutral-500 truncate">{d.canonicalUrl}</p>
              </li>
            ))}
            {(discoveries?.length ?? 0) === 0 && (
              <li className="px-4 py-8 text-center text-neutral-500 text-sm">No discoveries yet. Run a patrol.</li>
            )}
          </ul>
        </section>

        <section className="app-panel overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 font-medium">Active cases</div>
          <ul className="divide-y divide-neutral-100">
            {activeCases?.slice(0, 5).map((c) => (
              <li key={c._id} className="px-4 py-3">
                <Link
                  to={`/cases/${c._id}`}
                  className="text-sm font-medium hover:underline block truncate"
                >
                  {c.title}
                </Link>
                <p className="text-xs text-neutral-500">{c.caseNumber} · {c.severity ?? '—'}</p>
              </li>
            ))}
            {(activeCases?.length ?? 0) === 0 && (
              <li className="px-4 py-8 text-center text-neutral-500 text-sm">No active cases yet.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}

function KpiCard({ label, value, tone }: { label: string; value: number; tone?: 'neutral' | 'warning' | 'danger' | 'success' }) {
  const toneClasses = {
    neutral: 'bg-white border-neutral-200',
    warning: 'bg-amber-50 border-amber-200',
    danger: 'bg-rose-50 border-rose-200',
    success: 'bg-emerald-50 border-emerald-200',
  }
  return (
    <div className={`rounded-xl border p-5 ${toneClasses[tone ?? 'neutral']}`}>
      <div className="text-sm text-neutral-600">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
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
