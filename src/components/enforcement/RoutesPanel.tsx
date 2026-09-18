import { useState } from 'react'
import { useAction, useMutation, useQuery } from 'convex/react'
import {
  ExternalLink,
  FileText,
  Loader2,
  ShieldAlert,
  Zap,
} from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import { useWorkspace } from '../../lib/workspace'

type ActionRow = Doc<'enforcementActions'> & { label?: string }
type Rec = {
  route: string
  channel: string
  basis: string
  label: string
  reason: string
  confidence: string
  status: string
  submissionUrl?: string
  requiredFields?: string[]
}

const CONFIDENCE_STYLE: Record<string, string> = {
  high: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-neutral-100 text-neutral-500',
}

const STATUS_STYLE: Record<string, string> = {
  recommended: 'bg-neutral-100 text-neutral-600',
  prepared: 'bg-blue-50 text-blue-700',
  submitted: 'bg-purple-50 text-purple-700',
  platform_reviewing: 'bg-indigo-50 text-indigo-700',
  actioned: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
  counter_notice: 'bg-orange-50 text-orange-700',
  withdrawn: 'bg-neutral-100 text-neutral-400',
}

const BASIS_LABEL: Record<string, string> = {
  copyright: 'Copyright',
  trademark: 'Trademark',
  counterfeit: 'Counterfeit',
  impersonation: 'Impersonation',
  udrp: 'UDRP',
  design: 'Design/trade dress',
}

/**
 * Recommended enforcement routes for a case — one row per complaint channel
 * (platform, host, registrar, search, ads, social, marketplace, counsel),
 * each with its own lifecycle and platform-native packet generation.
 */
export default function RoutesPanel({ caseId }: { caseId: Id<'cases'> }) {
  const { organization, providerActionsEnabled, isAdmin } = useWorkspace()
  const orgId = organization?._id
  const data = useQuery(
    api.enforcementRoutes.listForCase,
    orgId ? { caseId, organizationId: orgId } : 'skip',
  )
  const ensure = useMutation(api.enforcementRoutes.ensureForCase)
  const updateStatus = useMutation(api.enforcementRoutes.updateStatus)
  const withdraw = useMutation(api.enforcementRoutes.withdraw)
  const prepare = useAction(api.enforcementRoutes.prepare)
  const [busy, setBusy] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  if (!orgId || data === undefined) return null

  const stored = (data.stored ?? []) as ActionRow[]
  const recommended = (data.recommended ?? []) as Rec[]
  const hasAny = stored.length > 0 || recommended.length > 0

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key)
    try {
      await fn()
    } finally {
      setBusy(null)
    }
  }

  const row = (a: {
    key: string
    label: string
    channel: string
    basis: string
    confidence: string
    reason: string
    status: string
    submissionUrl?: string
    requiredFields?: string[]
    id?: Id<'enforcementActions'>
    draftId?: Id<'draftNotices'>
  }) => {
    const isOpen = expanded === a.key
    return (
      <div key={a.key} className="px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-neutral-900">{a.label}</p>
              <span className={`badge ${CONFIDENCE_STYLE[a.confidence] ?? ''}`}>
                {a.confidence}
              </span>
              <span className={`badge ${STATUS_STYLE[a.status] ?? ''}`}>
                {a.status.replace(/_/g, ' ')}
              </span>
              <span className="badge bg-neutral-100 text-neutral-500">
                {BASIS_LABEL[a.basis] ?? a.basis}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{a.reason}</p>
            {isOpen && (
              <div className="mt-2 rounded-lg bg-neutral-50 border border-neutral-100 p-3 space-y-2">
                {a.requiredFields && a.requiredFields.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide mb-1">
                      Required fields
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {a.requiredFields.map((f) => (
                        <span key={f} className="badge bg-white border border-neutral-200 text-neutral-600">
                          {f.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {a.submissionUrl && (
                  <a
                    href={a.submissionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> Official submission channel
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setExpanded(isOpen ? null : a.key)}
              className="btn-ghost text-[11px]"
            >
              {isOpen ? 'Less' : 'Details'}
            </button>
            {!a.id ? (
              <button
                onClick={() => run('ensure', () => ensure({ caseId, organizationId: orgId }))}
                disabled={busy !== null}
                className="btn-secondary text-[11px]"
              >
                {busy === 'ensure' ? 'Tracking…' : 'Track all'}
              </button>
            ) : (
              <>
                {a.status === 'recommended' && (
                  <button
                    onClick={() =>
                      run(a.key, () => prepare({ actionId: a.id! }))
                    }
                    disabled={busy !== null || !providerActionsEnabled}
                    className="btn-secondary text-[11px]"
                    title={
                      providerActionsEnabled
                        ? 'Generate the platform-native complaint text via OpenAI'
                        : 'Enable provider actions in Settings first'
                    }
                  >
                    {busy === a.key ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <FileText className="w-3 h-3" />
                    )}
                    Prepare
                  </button>
                )}
                {(a.status === 'prepared' || a.status === 'recommended') && (
                  <button
                    onClick={() =>
                      run(a.key, () =>
                        updateStatus({ actionId: a.id!, status: 'submitted' }),
                      )
                    }
                    disabled={busy !== null || !isAdmin}
                    className="btn-secondary text-[11px]"
                  >
                    Mark submitted
                  </button>
                )}
                {a.status !== 'withdrawn' && a.status !== 'actioned' && a.status !== 'rejected' && (
                  <button
                    onClick={() => run(a.key, () => withdraw({ actionId: a.id! }))}
                    disabled={busy !== null || !isAdmin}
                    className="btn-ghost text-[11px] text-neutral-400"
                  >
                    Withdraw
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="app-panel overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-neutral-500" />
          <h2 className="font-medium text-sm">Enforcement routes</h2>
          <span className="text-[11px] text-neutral-400">
            attack the clone at every dependency point
          </span>
        </div>
        {stored.length === 0 && hasAny && (
          <button
            onClick={() => run('ensure', () => ensure({ caseId, organizationId: orgId }))}
            disabled={busy !== null}
            className="btn-primary text-xs"
          >
            <Zap className="w-3.5 h-3.5" />
            {busy === 'ensure' ? 'Building…' : 'Track all routes'}
          </button>
        )}
      </div>
      {!hasAny ? (
        <p className="px-4 py-6 text-sm text-neutral-500 text-center">
          No enforcement routes detected for this case yet.
        </p>
      ) : (
        <div className="divide-y divide-neutral-100">
          {stored.map((s) =>
            row({
              key: s._id,
              id: s._id,
              label: (s as ActionRow & { routeLabel?: string }).routeLabel ?? s.route,
              channel: s.channel,
              basis: s.basis,
              confidence: s.confidence,
              reason: s.reason,
              status: s.status,
              submissionUrl: s.submissionUrl,
              requiredFields: s.requiredFields,
              draftId: s.draftId,
            }),
          )}
          {recommended.map((r) =>
            row({
              key: `rec-${r.route}`,
              label: r.label,
              channel: r.channel,
              basis: r.basis,
              confidence: r.confidence,
              reason: r.reason,
              status: 'recommended',
              submissionUrl: r.submissionUrl,
              requiredFields: r.requiredFields,
            }),
          )}
        </div>
      )}
      {stored.some((s) => s.draftId) && (
        <p className="px-4 py-2 text-[11px] text-neutral-400 border-t border-neutral-100">
          Prepared packets appear as drafts below — review before submitting anywhere.
        </p>
      )}
    </section>
  )
}
