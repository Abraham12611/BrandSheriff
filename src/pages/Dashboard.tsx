import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Globe,
  Plus,
  Radar,
  ShieldCheck,
  Store,
  Zap,
} from 'lucide-react'
import { api } from '../../convex/_generated/api'
import { useWorkspace } from '../lib/workspace'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'
import { PlatformChip } from '../components/discoveries/CompareCard'

const DNA_STATUS: Record<string, string> = {
  pending: 'bg-neutral-100 text-neutral-700',
  crawling: 'bg-blue-50 text-blue-700',
  review: 'bg-amber-50 text-amber-700',
  active: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-rose-50 text-rose-700',
}

const EVENT_LABEL: Record<string, string> = {
  case_created: 'Case created',
  case_resolved: 'Case resolved',
  case_reopened: 'Case reopened',
  discovery_approved: 'Discovery approved',
  discovery_dismissed: 'Discovery dismissed',
  discovery_watchlisted: 'Discovery watchlisted',
  discovery_allowed: 'Discovery allowed',
  discovery_reopened: 'Discovery reopened',
  discovery_created_manual: 'Discovery added manually',
  created: 'Created',
  deleted: 'Deleted',
}

function hostOf(url?: string): string {
  if (!url) return '—'
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export default function Dashboard() {
  const { organization, isLoading: workspaceLoading } = useWorkspace()
  const brands = useQuery(api.brands.list)
  const firstBrand = brands?.[0]
  const counts = useQuery(api.discoveries.countsByStatus, {})
  const allDiscoveries = useQuery(api.discoveries.listForInbox, {})
  const activeCases = useQuery(api.cases.listByState, { state: 'active' })
  const watchingCases = useQuery(api.cases.listByState, { state: 'watching' })
  const resolvedCases = useQuery(api.cases.listByState, { state: 'resolved' })
  const runs = useQuery(
    api.patrolRuns.listByBrand,
    firstBrand ? { brandId: firstBrand._id } : 'skip',
  )
  const recentEvents = useQuery(api.auditEvents.listRecent, { limit: 8 })

  if (workspaceLoading) {
    return <Loading message="Loading workspace…" />
  }

  if (!organization) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-xl app-panel p-8 text-center">
        <h1 className="text-2xl font-bold">Create your workspace</h1>
        <p className="text-neutral-600 mt-2">
          Before you can monitor brands and cases, you need a BrandSheriff workspace.
        </p>
        <Link to="/onboarding" className="btn-primary mt-6">
          Set up workspace
        </Link>
      </div>
    )
  }

  const needsReview = counts?.needs_review ?? 0
  const activeInfringers =
    (counts?.approved ?? 0) + (counts?.watchlisted ?? 0) + (counts?.case_created ?? 0)
  const activeCaseCount = (activeCases?.length ?? 0) + (watchingCases?.length ?? 0)

  const highPriority = (allDiscoveries ?? [])
    .filter((d) => ['needs_review', 'approved', 'watchlisted'].includes(d.status))
    .sort(
      (a, b) =>
        (b.similarityScore ?? b.matchConfidence ?? -1) -
        (a.similarityScore ?? a.matchConfidence ?? -1),
    )
    .slice(0, 4)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good ${timeOfDay()}, sheriff`}
        subtitle={`${organization.name} — protection overview`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/discoveries" className="btn-primary">
              <Radar className="w-4 h-4" /> Review queue
              {needsReview > 0 && (
                <span className="ml-1 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                  {needsReview}
                </span>
              )}
            </Link>
            <Link to="/onboarding" className="btn-secondary">
              <Plus className="w-4 h-4" /> Add brand
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Needs review"
          value={needsReview}
          tone={needsReview > 0 ? 'warning' : 'neutral'}
          hint="discoveries awaiting decision"
        />
        <KpiCard
          label="Active infringers"
          value={activeInfringers}
          tone={activeInfringers > 0 ? 'danger' : 'neutral'}
          hint="approved + watchlisted"
        />
        <KpiCard label="Open cases" value={activeCaseCount} hint="active + watching" />
        <KpiCard
          label="Resolved"
          value={resolvedCases?.length ?? 0}
          tone={(resolvedCases?.length ?? 0) > 0 ? 'success' : 'neutral'}
          hint="all time"
        />
      </div>

      {highPriority.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">High-priority infringers</h2>
            <Link
              to="/discoveries"
              className="text-sm text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {highPriority.map((d) => {
              const sim = d.similarityScore ?? d.matchConfidence
              return (
                <Link
                  key={d._id}
                  to="/discoveries"
                  className="app-panel card-lift p-4 block"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-medium truncate">{hostOf(d.canonicalUrl)}</span>
                    <span
                      className={`text-sm font-bold ${
                        sim !== undefined && sim >= 0.8
                          ? 'text-rose-600'
                          : sim !== undefined && sim >= 0.5
                            ? 'text-amber-600'
                            : 'text-neutral-400'
                      }`}
                    >
                      {sim !== undefined ? `${Math.round(sim * 100)}%` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <PlatformChip platform={d.platformGuess} />
                    <span className="capitalize">{d.status.replace(/_/g, ' ')}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="app-panel p-5">
          <h2 className="font-semibold text-sm mb-4">Quick actions</h2>
          <div className="space-y-2">
            <QuickAction
              to="/discoveries"
              icon={<Radar className="w-4 h-4" />}
              label="Run patrol"
              detail="Search for copies and impersonators"
            />
            <QuickAction
              to="/discoveries"
              icon={<Plus className="w-4 h-4" />}
              label="Add discovery by URL"
              detail="Flag a suspect page directly"
            />
            <QuickAction
              to="/brand"
              icon={<ShieldCheck className="w-4 h-4" />}
              label="Manage Brand Profile"
              detail="Assets, keywords, allowlist"
            />
            <QuickAction
              to="/cases"
              icon={<Zap className="w-4 h-4" />}
              label="Open cases"
              detail={`${activeCaseCount} open`}
            />
          </div>

          <div className="mt-5 pt-4 border-t border-neutral-100">
            <div className="text-xs font-medium text-neutral-500 mb-2 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" /> Demo storefronts
            </div>
            <div className="space-y-1.5">
              <a
                href={`${import.meta.env.VITE_CONVEX_SITE_URL || window.location.origin}/demo/northstar/index.html`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-neutral-600 hover:underline block truncate"
              >
                Northstar Atelier (official)
              </a>
              <a
                href={`${import.meta.env.VITE_CONVEX_SITE_URL || window.location.origin}/demo/clone/index.html`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-neutral-600 hover:underline block truncate"
              >
                Clone storefront (suspect)
              </a>
            </div>
          </div>
        </section>

        <section className="app-panel overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 font-medium text-sm">
            Protected brands
          </div>
          <ul className="divide-y divide-neutral-50">
            {(brands ?? []).map((b) => (
              <li key={b._id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <Link to="/brand" className="text-sm font-medium hover:underline truncate">
                    {b.name}
                  </Link>
                  <span className={`badge ${DNA_STATUS[b.brandDnaStatus] ?? DNA_STATUS.pending}`}>
                    {b.brandDnaStatus}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 truncate mt-0.5 flex items-center gap-1">
                  <Globe className="w-3 h-3 shrink-0" />
                  {hostOf(b.canonicalDomain)}
                </div>
              </li>
            ))}
            {(brands?.length ?? 0) === 0 && (
              <li className="px-4 py-8 text-center text-sm text-neutral-500">
                No brands yet —{' '}
                <Link to="/onboarding" className="font-medium hover:underline">
                  add one
                </Link>
                .
              </li>
            )}
          </ul>
        </section>

        <section className="app-panel overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 font-medium text-sm flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-neutral-400" /> Recent activity
          </div>
          <ul className="divide-y divide-neutral-50">
            {(recentEvents ?? []).map((e) => (
              <li key={e._id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                <span className="text-sm text-neutral-700 capitalize truncate">
                  {EVENT_LABEL[e.eventType] ?? e.eventType.replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] text-neutral-400 shrink-0">
                  {relativeTime(e.timestamp)}
                </span>
              </li>
            ))}
            {(recentEvents?.length ?? 0) === 0 && (
              <li className="px-4 py-8 text-center text-sm text-neutral-500">
                No activity yet — run a patrol to get started.
              </li>
            )}
          </ul>
          {runs && runs.length > 0 && (
            <div className="px-4 py-2.5 border-t border-neutral-100 text-xs text-neutral-500">
              Last patrol: {new Date(runs[0].startedAt).toLocaleString()} ·{' '}
              <span className="capitalize">{runs[0].status}</span>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function timeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

function relativeTime(ts: number) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function KpiCard({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string
  value: number
  hint?: string
  tone?: 'neutral' | 'warning' | 'danger' | 'success'
}) {
  const tones = {
    neutral: 'text-neutral-900',
    warning: 'text-amber-600',
    danger: 'text-rose-600',
    success: 'text-emerald-600',
  }
  return (
    <div className="app-panel px-4 py-4">
      <div className="text-xs text-neutral-500 font-medium">{label}</div>
      <div className={`text-3xl font-semibold tracking-tight mt-1 ${tones[tone]}`}>{value}</div>
      {hint && <div className="text-[11px] text-neutral-400 mt-1">{hint}</div>}
    </div>
  )
}

function QuickAction({
  to,
  icon,
  label,
  detail,
}: {
  to: string
  icon: React.ReactNode
  label: string
  detail?: string
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-50 transition-colors group"
    >
      <span className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {detail && <span className="block text-xs text-neutral-500">{detail}</span>}
      </span>
      <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-600 transition-colors" />
    </Link>
  )
}
