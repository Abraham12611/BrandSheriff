import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useAction } from 'convex/react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Inbox,
  Mail,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  Store,
  X,
} from 'lucide-react'
import { api } from '../../convex/_generated/api'
import type { Doc, Id } from '../../convex/_generated/dataModel'
import { useWorkspace } from '../lib/workspace'
import Loading from '../components/Loading'
import Modal from '../components/Modal'
import { PlatformChip } from '../components/discoveries/CompareCard'

type TabKey = 'details' | 'activity' | 'enforcement'

const STATE_STYLE: Record<string, string> = {
  active: 'bg-amber-50 text-amber-700',
  reviewing: 'bg-blue-50 text-blue-700',
  awaiting_approval: 'bg-purple-50 text-purple-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  watching: 'bg-sky-50 text-sky-700',
  running: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-rose-50 text-rose-700',
  draft: 'bg-neutral-100 text-neutral-700',
  draft_edited: 'bg-neutral-100 text-neutral-700',
  sent: 'bg-emerald-50 text-emerald-700',
}

const SEVERITY_STYLE: Record<string, string> = {
  low: 'bg-neutral-100 text-neutral-600',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-orange-50 text-orange-700',
  critical: 'bg-rose-50 text-rose-700',
}

function Badge({ label, tone }: { label: string; tone?: string }) {
  return (
    <span className={`badge capitalize ${tone ?? 'bg-neutral-100 text-neutral-700'}`}>
      {label.replace(/_/g, ' ')}
    </span>
  )
}

function hostOf(url?: string): string {
  if (!url) return '—'
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function tryParseJson(text?: string): Record<string, unknown> | null {
  if (!text) return null
  try {
    const parsed = JSON.parse(text)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function Meter({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100)
  const tone = pct >= 80 ? 'bg-rose-500' : pct >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-neutral-500">{label}</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div className={`h-full ${tone} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function ForensicPanel({ analysis }: { analysis: Record<string, unknown> }) {
  const matchTypes = Array.isArray(analysis.matchTypes) ? (analysis.matchTypes as string[]) : []
  const counterSignals = Array.isArray(analysis.counterSignals)
    ? (analysis.counterSignals as string[])
    : []
  const identity = Number(analysis.identitySimilarity ?? 0)
  const authRisk = Number(analysis.authorizationRisk ?? 0)

  return (
    <div className="space-y-4">
      {typeof analysis.summary === 'string' && analysis.summary && (
        <p className="text-sm text-neutral-800">{analysis.summary}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Meter label="Identity similarity" value={identity} />
        <Meter label="Likelihood unauthorized" value={authRisk} />
      </div>
      {matchTypes.length > 0 && (
        <div>
          <div className="text-xs text-neutral-500 mb-1.5">Copied elements</div>
          <div className="flex flex-wrap gap-1.5">
            {matchTypes.map((m) => (
              <span key={m} className="badge bg-rose-50 text-rose-700">
                {m.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
      {typeof analysis.explanation === 'string' && analysis.explanation && (
        <div>
          <div className="text-xs text-neutral-500 mb-1">Assessment</div>
          <p className="text-sm text-neutral-700">{analysis.explanation}</p>
        </div>
      )}
      {counterSignals.length > 0 && (
        <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 p-3">
          <div className="text-xs font-medium text-emerald-800 mb-1.5">
            Possible legitimate explanations
          </div>
          <ul className="text-sm text-emerald-800 space-y-1 list-disc pl-4">
            {counterSignals.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-[11px] text-neutral-400">
        Automated assessment — signals only, not a legal determination.
      </p>
    </div>
  )
}

function RecheckResult({ raw }: { raw?: string }) {
  const parsed = tryParseJson(raw)
  if (!parsed) {
    return raw ? (
      <pre className="mt-1 text-xs text-neutral-600 bg-neutral-50 p-2 rounded-lg overflow-auto max-h-32">
        {raw}
      </pre>
    ) : null
  }
  const changed = Array.isArray(parsed.changedElements) ? (parsed.changedElements as string[]) : []
  return (
    <div className="mt-2 space-y-2">
      {typeof parsed.summary === 'string' && (
        <p className="text-sm text-neutral-700">{parsed.summary}</p>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {parsed.confidence !== undefined && (
          <span className="badge bg-neutral-100 text-neutral-700">
            confidence {Math.round(Number(parsed.confidence) * 100)}%
          </span>
        )}
      </div>
      {changed.length > 0 && (
        <ul className="text-xs text-neutral-600 list-disc pl-4 space-y-0.5">
          {changed.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      )}
      {typeof parsed.recommendation === 'string' && (
        <p className="text-xs text-neutral-500">
          <span className="font-medium">Suggested next step:</span> {parsed.recommendation}
        </p>
      )}
    </div>
  )
}

function EvidenceItem({ item }: { item: Doc<'evidenceItems'> }) {
  const [expanded, setExpanded] = useState(false)
  const analysis = item.type === 'forensic_analysis' ? tryParseJson(item.textContent) : null

  return (
    <li className="px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
          <span className="text-sm font-medium truncate">{item.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-neutral-400">
            {new Date(item.capturedAt).toLocaleDateString()}
          </span>
          <Badge label={item.type} />
        </div>
      </div>
      {item.sourceUrl && (
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-neutral-500 hover:text-neutral-900 hover:underline flex items-center gap-1 mt-1 ml-6"
        >
          <ExternalLink className="w-3 h-3" />
          <span className="truncate">{item.sourceUrl}</span>
        </a>
      )}
      {analysis ? (
        <div className="mt-3 ml-6">
          <ForensicPanel analysis={analysis} />
        </div>
      ) : item.textContent ? (
        <div className="mt-2 ml-6">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-neutral-500 hover:text-neutral-900"
          >
            {expanded ? 'Hide raw content' : 'Show raw content'}
          </button>
          {expanded && (
            <pre className="mt-2 text-xs text-neutral-600 bg-neutral-50 p-3 rounded-lg overflow-auto max-h-48 whitespace-pre-wrap">
              {item.textContent}
            </pre>
          )}
        </div>
      ) : null}
    </li>
  )
}

type TimelineItem = {
  key: string
  at: number
  icon: React.ReactNode
  label: string
  detail?: string
}

const EVENT_LABEL: Record<string, string> = {
  case_created: 'Case created',
  case_resolved: 'Case resolved',
  case_reopened: 'Case reopened',
  discovery_approved: 'Discovery approved',
  discovery_dismissed: 'Discovery dismissed',
  discovery_watchlisted: 'Added to watchlist',
  discovery_allowed: 'Marked as allowed',
  discovery_reopened: 'Discovery reopened',
  discovery_created_manual: 'Discovery added manually',
  created: 'Created',
  deleted: 'Deleted',
}

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>()
  const caseId = id as Id<'cases'> | undefined
  const [tab, setTab] = useState<TabKey>('details')
  const [to, setTo] = useState('')
  const [inboxError, setInboxError] = useState<string | null>(null)
  const [manualInbox, setManualInbox] = useState('')
  const [inboxBusy, setInboxBusy] = useState(false)
  const [confirmSend, setConfirmSend] = useState(false)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const { organization } = useWorkspace()

  const c = useQuery(api.cases.get, caseId ? { caseId } : 'skip')
  const evidence = useQuery(api.evidenceItems.listByCase, caseId ? { caseId } : 'skip')
  const discovery = useQuery(
    api.discoveries.get,
    c?.discoveryId ? { discoveryId: c.discoveryId } : 'skip',
  )
  const discoveryEvidence = useQuery(
    api.evidenceItems.listByDiscovery,
    c?.discoveryId ? { discoveryId: c.discoveryId } : 'skip',
  )
  const draft = useQuery(api.enforcement.latestDraft, caseId ? { caseId } : 'skip')
  const rechecks = useQuery(api.verification.list, caseId ? { caseId } : 'skip')
  const watches = useQuery(api.hydra.list, caseId ? { caseId } : 'skip')
  const auditEvents = useQuery(api.auditEvents.listByCase, caseId ? { caseId } : 'skip')

  const generate = useAction(api.enforcement.generateDraft)
  const update = useMutation(api.enforcement.updateDraft)
  const approveSend = useAction(api.enforcement.approveAndSend)
  const resolveInbox = useAction(api.mail.resolveInbox)
  const connectManual = useAction(api.mail.connectInboxManual)
  const recheck = useAction(api.verification.recheckTarget)
  const startWatch = useMutation(api.hydra.startWatch)
  const runWatch = useAction(api.hydra.runWatch)
  const resolve = useMutation(api.cases.resolve)
  const reopen = useMutation(api.cases.reopen)

  const allEvidence = useMemo(() => {
    const seen = new Set<string>()
    return [...(evidence ?? []), ...(discoveryEvidence ?? [])].filter((e) => {
      if (seen.has(e._id)) return false
      seen.add(e._id)
      return true
    })
  }, [evidence, discoveryEvidence])

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = []
    for (const e of auditEvents ?? []) {
      items.push({
        key: e._id,
        at: e.timestamp,
        icon: <Activity className="w-3.5 h-3.5" />,
        label: EVENT_LABEL[e.eventType] ?? e.eventType.replace(/_/g, ' '),
        detail: typeof e.metadataSafe?.title === 'string' ? e.metadataSafe.title : undefined,
      })
    }
    for (const r of rechecks ?? []) {
      items.push({
        key: r._id,
        at: r.checkedAt,
        icon: <Search className="w-3.5 h-3.5" />,
        label: 'Verification recheck',
        detail: r.availability ? `Outcome: ${r.availability.replace(/_/g, ' ')}` : r.status,
      })
    }
    if (draft) {
      items.push({
        key: `draft-${draft._id}`,
        at: draft.updatedAt,
        icon: <Mail className="w-3.5 h-3.5" />,
        label: draft.status === 'sent' ? 'Enforcement email sent' : 'Enforcement draft updated',
      })
    }
    return items.sort((a, b) => b.at - a.at)
  }, [auditEvents, rechecks, draft])

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setActionError(null)
    setBusyAction(key)
    try {
      await fn()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setBusyAction(null)
    }
  }

  const handleResolveInbox = async () => {
    if (!organization) return
    setInboxError(null)
    setInboxBusy(true)
    try {
      await resolveInbox({ organizationId: organization._id })
    } catch (e) {
      setInboxError(e instanceof Error ? e.message : 'Failed to resolve AgentMail inbox')
    } finally {
      setInboxBusy(false)
    }
  }

  const handleConnectManual = async () => {
    if (!organization || !manualInbox.trim()) return
    setInboxError(null)
    setInboxBusy(true)
    try {
      await connectManual({ organizationId: organization._id, inboxAddress: manualInbox.trim() })
      setManualInbox('')
    } catch (e) {
      setInboxError(e instanceof Error ? e.message : 'Failed to connect inbox')
    } finally {
      setInboxBusy(false)
    }
  }

  if (!c) {
    return <Loading message="Loading case…" />
  }

  const draftFields = draft?.structuredFields as
    | { subject?: string; warnings?: string[] }
    | undefined
  const draftSubject = draftFields?.subject ?? ''
  const similarity = discovery?.similarityScore ?? discovery?.matchConfidence
  const draftWarnings = Array.isArray(draftFields?.warnings) ? draftFields.warnings : []

  return (
    <div className="space-y-5">
      <div>
        <Link
          to="/cases"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 mb-2"
        >
          ← Cases
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-neutral-500 font-mono">{c.caseNumber}</span>
              <Badge label={c.state} tone={STATE_STYLE[c.state]} />
              {c.severity && <Badge label={c.severity} tone={SEVERITY_STYLE[c.severity]} />}
              {c.primaryThreatType && <Badge label={c.primaryThreatType} />}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mt-1.5 truncate">{c.title}</h1>
          </div>
          {draft?.status === 'sent' ? (
            <span className="badge bg-emerald-50 text-emerald-700 !text-sm !px-3 !py-1.5">
              <CheckCircle2 className="w-4 h-4" /> Notice sent
            </span>
          ) : (
            draft && (
              <button onClick={() => setConfirmSend(true)} className="btn-primary">
                <Send className="w-4 h-4" /> Approve &amp; send
              </button>
            )
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 bg-rose-50 text-rose-700 rounded-xl text-sm flex items-center justify-between">
          {actionError}
          <button onClick={() => setActionError(null)} className="p-1 hover:bg-rose-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-1 border-b border-neutral-200 -mb-1">
        {(
          [
            { key: 'details', label: 'Store Details', icon: Store },
            { key: 'activity', label: 'Activity Feed', icon: Activity },
            { key: 'enforcement', label: 'Enforcement', icon: ShieldAlert },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
            aria-selected={tab === t.key}
            role="tab"
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2 space-y-5 min-w-0">
          <section className="app-panel overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 font-medium text-sm">
              Infringing asset
            </div>
            <div className="p-4">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 max-w-md">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-full aspect-video bg-neutral-900 rounded-lg flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {(c.title ?? 'B').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-medium">Your brand</span>
                </div>
                <span className="text-neutral-300 text-xl font-light" aria-hidden="true">
                  →
                </span>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-full aspect-video bg-neutral-100 rounded-lg flex items-center justify-center">
                    {discovery ? (
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostOf(discovery.canonicalUrl))}&sz=128`}
                        alt=""
                        className="w-12 h-12 object-contain"
                        loading="lazy"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <Store className="w-8 h-8 text-neutral-300" />
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-500 font-medium">Infringing page</span>
                </div>
              </div>
              {discovery && (
                <a
                  href={discovery.canonicalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-neutral-500 hover:text-neutral-900 hover:underline flex items-center gap-1 mt-3"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="truncate">{discovery.canonicalUrl}</span>
                </a>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <StatBox
                  label="Similarity"
                  value={similarity !== undefined ? `${Math.round(similarity * 100)}%` : '—'}
                />
                <StatBox
                  label="Platform"
                  value={<PlatformChip platform={discovery?.platformGuess} />}
                />
                <StatBox label="Severity" value={c.severity ?? '—'} capitalize />
                <StatBox
                  label="First seen"
                  value={
                    discovery ? new Date(discovery._creationTime).toLocaleDateString() : '—'
                  }
                />
              </div>
            </div>
          </section>

          {tab === 'details' && (
            <>
              <section className="app-panel p-5">
                <h2 className="font-semibold mb-2">Summary</h2>
                <p className="text-sm text-neutral-700">
                  {c.summary || discovery?.summary || 'No summary yet — run an investigation on the discovery.'}
                </p>
              </section>
              <section className="app-panel overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-100 font-medium text-sm">
                  Evidence locker{' '}
                  <span className="text-neutral-400 font-normal">({allEvidence.length})</span>
                </div>
                <ul className="divide-y divide-neutral-50">
                  {allEvidence.map((item) => (
                    <EvidenceItem key={item._id} item={item} />
                  ))}
                  {allEvidence.length === 0 && (
                    <li className="px-4 py-10 text-center text-sm text-neutral-500">
                      No evidence attached yet.
                    </li>
                  )}
                </ul>
              </section>
            </>
          )}

          {tab === 'activity' && (
            <section className="app-panel overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-100 font-medium text-sm">
                Timeline
              </div>
              {timeline.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-neutral-500">
                  No activity recorded yet.
                </div>
              ) : (
                <ul className="divide-y divide-neutral-50">
                  {timeline.map((item) => (
                    <li key={item.key} className="px-4 py-3 flex items-start gap-3">
                      <span className="mt-0.5 w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0">
                        {item.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{item.label}</div>
                        {item.detail && (
                          <div className="text-xs text-neutral-500 mt-0.5">{item.detail}</div>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-400 shrink-0">
                        {new Date(item.at).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {tab === 'enforcement' && (
            <>
              <section className="app-panel p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Enforcement draft</h2>
                  {draft && <Badge label={draft.status} tone={STATE_STYLE[draft.status]} />}
                </div>
                {draft ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="recipient" className="text-xs text-neutral-500">
                          Recipient
                        </label>
                        <input
                          id="recipient"
                          value={to}
                          onChange={(e) => setTo(e.target.value)}
                          className="input-field mt-1"
                          placeholder="abuse@example.com"
                        />
                      </div>
                      <div>
                        <label htmlFor="subject" className="text-xs text-neutral-500">
                          Subject
                        </label>
                        <input
                          id="subject"
                          value={draftSubject}
                          onChange={(e) =>
                            update({
                              draftId: draft._id,
                              body: draft.body ?? '',
                              subject: e.target.value,
                            })
                          }
                          className="input-field mt-1"
                          placeholder="Enforcement notice"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="draftBody" className="text-xs text-neutral-500">
                        Body
                      </label>
                      <textarea
                        id="draftBody"
                        value={draft.body ?? ''}
                        onChange={(e) =>
                          update({ draftId: draft._id, body: e.target.value })
                        }
                        rows={10}
                        className="input-field mt-1 font-mono text-xs leading-relaxed"
                      />
                    </div>
                    {draftWarnings.length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                        <div className="text-xs font-medium text-amber-800 mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Before you send
                        </div>
                        <ul className="text-xs text-amber-800 list-disc pl-4 space-y-0.5">
                          {draftWarnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      {draft.status !== 'sent' && (
                        <button
                          onClick={() => setConfirmSend(true)}
                          disabled={!to.trim() || busyAction !== null}
                          className="btn-primary"
                          title={!to.trim() ? 'Add a recipient email first' : undefined}
                        >
                          <Send className="w-4 h-4" /> Approve &amp; send
                        </button>
                      )}
                      {draft.status === 'sent' && (
                        <p className="text-sm text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Sent — replies arrive via the
                          AgentMail webhook.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-neutral-500 mb-3">
                      No draft yet — generate one from confirmed case evidence.
                    </p>
                    <button
                      onClick={() =>
                        run('generate', () => generate({ caseId: c._id }))
                      }
                      disabled={busyAction === 'generate'}
                      className="btn-primary"
                    >
                      {busyAction === 'generate' ? 'Generating…' : 'Generate draft'}
                    </button>
                  </div>
                )}
              </section>

              <section className="app-panel overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-100 font-medium text-sm">
                  Verification rechecks
                </div>
                <ul className="divide-y divide-neutral-50">
                  {rechecks?.map((r) => (
                    <li key={r._id} className="px-4 py-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">
                          {new Date(r.checkedAt).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {r.availability && <Badge label={r.availability} />}
                          <Badge label={r.status} tone={STATE_STYLE[r.status]} />
                        </div>
                      </div>
                      <RecheckResult raw={r.comparisonResult} />
                    </li>
                  ))}
                  {(rechecks?.length ?? 0) === 0 && (
                    <li className="px-4 py-8 text-center text-sm text-neutral-500">
                      No rechecks yet — run verification after sending the notice.
                    </li>
                  )}
                </ul>
              </section>

              <section className="app-panel overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-100 font-medium text-sm">
                  Reappearance watch (Hydra)
                </div>
                <ul className="divide-y divide-neutral-50">
                  {watches?.map((w) => (
                    <li key={w._id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-emerald-600" /> Watch active
                        </span>
                        {w.lastRunAt && (
                          <span className="text-xs text-neutral-500">
                            Last sweep {new Date(w.lastRunAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => run(`watch-${w._id}`, () => runWatch({ watchId: w._id }))}
                        disabled={busyAction === `watch-${w._id}`}
                        className="btn-secondary !py-1.5 text-xs"
                      >
                        {busyAction === `watch-${w._id}` ? 'Running…' : 'Run now'}
                      </button>
                    </li>
                  ))}
                  {(watches?.length ?? 0) === 0 && (
                    <li className="px-4 py-4 text-sm text-neutral-500 text-center">
                      No watch yet — start one to catch this operator reappearing.
                    </li>
                  )}
                </ul>
              </section>
            </>
          )}
        </div>

        <aside className="space-y-4">
          <div className="app-panel p-5">
            <h2 className="font-semibold mb-3 text-sm">Actions</h2>
            <div className="space-y-2">
              <div className="rounded-lg bg-neutral-50 p-3">
                <div className="text-xs font-medium text-neutral-600 mb-1.5 flex items-center gap-1.5">
                  <Inbox className="w-3.5 h-3.5" /> Sending identity
                </div>
                {organization?.mailboxAddress ? (
                  <p className="text-xs text-emerald-700 flex items-center gap-1 break-all">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    {organization.mailboxAddress}
                  </p>
                ) : (
                  <>
                    <button
                      onClick={handleResolveInbox}
                      disabled={inboxBusy}
                      className="btn-secondary w-full !py-1.5 text-xs"
                    >
                      {inboxBusy ? 'Connecting…' : 'Connect AgentMail inbox'}
                    </button>
                    <div className="flex gap-1.5 mt-2">
                      <input
                        value={manualInbox}
                        onChange={(e) => setManualInbox(e.target.value)}
                        className="input-field !py-1.5 !text-xs flex-1"
                        placeholder="inbox@org.agentmail.to"
                        aria-label="AgentMail inbox address"
                      />
                      <button
                        onClick={handleConnectManual}
                        disabled={inboxBusy || !manualInbox.trim()}
                        className="btn-secondary !py-1.5 text-xs"
                      >
                        Set
                      </button>
                    </div>
                  </>
                )}
                {inboxError && <p className="text-xs text-rose-600 mt-1.5">{inboxError}</p>}
              </div>

              <button
                onClick={() => run('recheck', () => recheck({ caseId: c._id }))}
                disabled={busyAction === 'recheck'}
                className="btn-secondary w-full"
              >
                <RefreshCw className={`w-4 h-4 ${busyAction === 'recheck' ? 'animate-spin' : ''}`} />
                {busyAction === 'recheck' ? 'Checking…' : 'Run verification'}
              </button>

              {watches && watches.length === 0 && (
                <button
                  onClick={() =>
                    run('watch', () =>
                      startWatch({
                        caseId: c._id,
                        brandId: c.brandId,
                        fingerprint: { discoveryId: c.discoveryId },
                      }),
                    )
                  }
                  disabled={busyAction === 'watch'}
                  className="btn-secondary w-full"
                >
                  <Eye className="w-4 h-4" /> Start watching
                </button>
              )}

              {c.state === 'resolved' ? (
                <button
                  onClick={() => run('reopen', () => reopen({ caseId: c._id }))}
                  disabled={busyAction === 'reopen'}
                  className="btn-secondary w-full"
                >
                  <RotateCcw className="w-4 h-4" /> Reopen case
                </button>
              ) : (
                <button
                  onClick={() => run('resolve', () => resolve({ caseId: c._id }))}
                  disabled={busyAction === 'resolve'}
                  className="btn-secondary w-full"
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark resolved
                </button>
              )}
            </div>
          </div>

          <div className="app-panel p-5">
            <h2 className="font-semibold mb-3 text-sm">Properties</h2>
            <dl className="text-sm space-y-2.5">
              <PropRow label="Case number" value={c.caseNumber} mono />
              <PropRow label="Status" value={<Badge label={c.state} tone={STATE_STYLE[c.state]} />} />
              <PropRow label="Severity" value={c.severity ?? '—'} />
              <PropRow
                label="Target host"
                value={
                  discovery ? (
                    <span className="flex items-center gap-1">
                      {hostOf(discovery.canonicalUrl)}
                      <button
                        onClick={() => navigator.clipboard.writeText(discovery.canonicalUrl)}
                        className="text-neutral-400 hover:text-neutral-700"
                        aria-label="Copy target URL"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </span>
                  ) : (
                    '—'
                  )
                }
              />
              <PropRow label="Source" value={discovery?.source ?? '—'} />
              <PropRow label="Created" value={new Date(c._creationTime).toLocaleDateString()} />
              {c.resolvedAt && (
                <PropRow label="Resolved" value={new Date(c.resolvedAt).toLocaleDateString()} />
              )}
            </dl>
          </div>
        </aside>
      </div>

      <Modal
        open={confirmSend}
        onClose={() => setConfirmSend(false)}
        title="Approve and send enforcement notice?"
        subtitle="This sends a real email from your workspace inbox. It cannot be unsent."
        footer={
          <>
            <button onClick={() => setConfirmSend(false)} className="btn-ghost">
              Cancel
            </button>
            <button
              onClick={() => {
                setConfirmSend(false)
                if (draft && caseId) {
                  run('send', () =>
                    approveSend({ caseId, draftId: draft._id, to: to.trim() }),
                  )
                }
              }}
              disabled={!to.trim()}
              className="btn-primary"
            >
              <Send className="w-4 h-4" /> Send now
            </button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <div className="rounded-lg bg-neutral-50 p-3 space-y-1.5">
            <div className="flex gap-2">
              <span className="text-neutral-500 w-16 shrink-0">From</span>
              <span className="font-medium break-all">
                {organization?.mailboxAddress ?? '—'}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-neutral-500 w-16 shrink-0">To</span>
              <span className="font-medium break-all">{to || '—'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-neutral-500 w-16 shrink-0">Subject</span>
              <span className="font-medium">{draftSubject || '—'}</span>
            </div>
          </div>
          <div className="rounded-lg border border-neutral-100 p-3 max-h-48 overflow-y-auto">
            <pre className="text-xs text-neutral-700 whitespace-pre-wrap font-sans">
              {draft?.body}
            </pre>
          </div>
          {draftWarnings.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
              <ul className="text-xs text-amber-800 list-disc pl-4 space-y-0.5">
                {draftWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

function StatBox({
  label,
  value,
  capitalize,
}: {
  label: string
  value: React.ReactNode
  capitalize?: boolean
}) {
  return (
    <div className="rounded-lg bg-neutral-50 px-3 py-2.5">
      <div className="text-[11px] text-neutral-500 font-medium">{label}</div>
      <div className={`text-sm font-semibold mt-0.5 ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </div>
    </div>
  )
}

function PropRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <dt className="text-neutral-500 shrink-0">{label}</dt>
      <dd className={`text-right truncate ${mono ? 'font-mono text-xs' : 'font-medium'}`}>
        {value}
      </dd>
    </div>
  )
}
