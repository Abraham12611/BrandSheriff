import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { useWorkspace } from '../lib/workspace'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>()
  const [to, setTo] = useState('abuse@example.com')
  const { organization } = useWorkspace()
  const c = useQuery(api.cases.get, id ? ({ caseId: id as any } as { caseId: Id<'cases'> }) : 'skip')
  const evidence = useQuery(
    api.evidenceItems.listByCase,
    id ? ({ caseId: id as any } as { caseId: Id<'cases'> }) : 'skip',
  )
  const discovery = useQuery(
    api.discoveries.get,
    c?.discoveryId ? ({ discoveryId: c.discoveryId as any } as { discoveryId: Id<'discoveries'> }) : 'skip',
  )
  const discoveryEvidence = useQuery(
    api.evidenceItems.listByDiscovery,
    c?.discoveryId ? ({ discoveryId: c.discoveryId as any } as { discoveryId: Id<'discoveries'> }) : 'skip',
  )
  const draft = useQuery(api.draftNotices.latest, id ? ({ caseId: id as any } as { caseId: Id<'cases'> }) : 'skip')
  const generate = useAction(api.enforcement.generateDraft)
  const update = useMutation(api.enforcement.updateDraft)
  const approveSend = useAction(api.enforcement.approveAndSend)
  const resolveInbox = useAction(api.mail.resolveInbox)
  const recheck = useAction(api.verification.recheckTarget)
  const rechecks = useQuery(api.verification.list, id ? ({ caseId: id as any } as { caseId: Id<'cases'> }) : 'skip')
  const startWatch = useMutation(api.hydra.startWatch)
  const watches = useQuery(api.hydra.list, id ? ({ caseId: id as any } as { caseId: Id<'cases'> }) : 'skip')
  const runWatch = useAction(api.hydra.runWatch)

  const allEvidence = [...(evidence ?? []), ...(discoveryEvidence ?? [])]

  const handleRecheck = async () => {
    if (!id) return
    await recheck({ caseId: id as any })
  }

  const handleGenerate = async () => {
    if (!id) return
    await generate({ caseId: id as any })
  }

  const handleSaveDraft = async () => {
    if (!draft) return
    await update({ draftId: draft._id, body: draft.body ?? '' })
  }

  const handleSend = async () => {
    if (!id || !draft) return
    await approveSend({ caseId: id as any, draftId: draft._id, to })
  }

  const handleResolveInbox = async () => {
    if (!organization) return
    await resolveInbox({ organizationId: organization._id })
  }

  const handleStartWatch = async () => {
    if (!id || !c || !c.discoveryId || !c.brandId) return
    await startWatch({ caseId: id as any, brandId: c.brandId, fingerprint: { discoveryId: c.discoveryId } })
  }

  const handleRunWatch = async (watchId: Id<'hydraWatches'>) => {
    await runWatch({ watchId })
  }

  if (!c) {
    return <Loading message="Loading case…" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={c.title}
        subtitle={c.caseNumber}
        backTo="/cases"
        backLabel="Cases"
        actions={<StateBadge state={c.state} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <div className="app-panel p-5">
            <h2 className="font-semibold mb-2">Summary</h2>
            <p className="text-sm text-neutral-700">{c.summary || 'No summary yet.'}</p>
          </div>

          {discovery && (
            <div className="app-panel p-5">
              <h2 className="font-semibold mb-2">Original discovery</h2>
              <a
                href={discovery.canonicalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-violet-600 hover:underline block truncate"
              >
                {discovery.canonicalUrl}
              </a>
              {discovery.matchConfidence !== undefined && (
                <p className="text-sm text-neutral-600 mt-2">
                  Identity similarity: {Math.round(discovery.matchConfidence * 100)}% · Severity: {discovery.severity}
                </p>
              )}
              {discovery.summary && <p className="text-sm text-neutral-700 mt-2">{discovery.summary}</p>}
            </div>
          )}

          <div className="app-panel p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Enforcement draft</h2>
              {!draft && (
                <button
                  onClick={handleGenerate}
                  title="Generate an editable draft from the case evidence"
                  className="btn-primary"
                >
                  Generate draft
                </button>
              )}
            </div>
            {draft ? (
              <div className="space-y-3">
                <div>
                  <label htmlFor="recipient" className="text-xs text-neutral-500">Recipient</label>
                  <input
                    id="recipient"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                    placeholder="abuse@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="draftBody" className="text-xs text-neutral-500">Body</label>
                  <textarea
                    id="draftBody"
                    value={draft.body ?? ''}
                    onChange={(e) => update({ draftId: draft._id, body: e.target.value })}
                    rows={8}
                    className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveDraft}
                    className="btn-secondary"
                  >
                    Save changes
                  </button>
                  <button
                    onClick={handleSend}
                    title="Approve and send this draft"
                    className="btn-primary"
                  >
                    Approve & send
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No draft yet. Generate one from the case evidence.</p>
            )}
          </div>

          <div className="app-panel overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 font-medium">Evidence locker</div>
            <ul className="divide-y divide-neutral-100">
              {allEvidence.map((item) => (
                <li key={item._id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">{item.type}</span>
                  </div>
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-violet-600 hover:underline block truncate"
                    >
                      {item.sourceUrl}
                    </a>
                  )}
                  {item.textContent && (
                    <pre className="mt-2 text-xs text-neutral-600 bg-neutral-50 p-2 rounded-lg overflow-auto max-h-40">
                      {item.textContent}
                    </pre>
                  )}
                </li>
              ))}
              {allEvidence.length === 0 && (
                <li className="px-4 py-8 text-center text-neutral-500">No evidence yet.</li>
              )}
            </ul>
          </div>

          <div className="app-panel overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 font-medium">Verification rechecks</div>
            <ul className="divide-y divide-neutral-100">
              {rechecks?.map((r) => (
                <li key={r._id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">{new Date(r.checkedAt).toLocaleString()}</span>
                    <StateBadge state={r.status} />
                  </div>
                  {r.availability && <p className="text-sm font-medium mt-1">Outcome: {r.availability}</p>}
                  {r.comparisonResult && (
                    <pre className="mt-1 text-xs text-neutral-600 bg-neutral-50 p-2 rounded-lg overflow-auto max-h-32">
                      {r.comparisonResult}
                    </pre>
                  )}
                </li>
              ))}
              {(rechecks?.length ?? 0) === 0 && (
                <li className="px-4 py-8 text-center text-neutral-500">No rechecks yet.</li>
              )}
            </ul>
          </div>

          <div className="app-panel overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 font-medium">Hydra watch</div>
            <div className="px-4 py-3">
              <button
                onClick={handleStartWatch}
                title="Watch for reappearance of this case target"
                className="btn-primary"
              >
                Start watching for reappearance
              </button>
            </div>
            <ul className="divide-y divide-neutral-100">
              {watches?.map((w) => (
                <li key={w._id} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm">Watch active</span>
                  <button
                    onClick={() => handleRunWatch(w._id)}
                    title="Run the watch now"
                    className="btn-secondary"
                  >
                    Run now
                  </button>
                </li>
              ))}
              {(watches?.length ?? 0) === 0 && (
                <li className="px-4 py-4 text-center text-neutral-500 text-sm">No Hydra watches yet.</li>
              )}
            </ul>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="app-panel p-5">
            <h2 className="font-semibold mb-3">Actions</h2>
            <div className="space-y-2">
              <button
                onClick={handleResolveInbox}
                title="Fetch the latest AgentMail inbox status"
                className="btn-secondary w-full"
              >
                Connect AgentMail inbox
              </button>
              <button
                onClick={handleRecheck}
                title="Re-check the target page and compare against evidence"
                className="btn-secondary w-full"
              >
                Run verification
              </button>
              <button
                title="Mark this case resolved after human review"
                className="btn-secondary w-full"
                disabled
              >
                Mark resolved
              </button>
            </div>
          </div>

          <div className="app-panel p-5">
            <h2 className="font-semibold mb-2">Properties</h2>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Severity</dt>
                <dd>{c.severity ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Created</dt>
                <dd>{new Date(c._creationTime).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  )
}

function StateBadge({ state }: { state: string }) {
  const styles: Record<string, string> = {
    active: 'bg-amber-50 text-amber-700',
    reviewing: 'bg-blue-50 text-blue-700',
    awaiting_approval: 'bg-purple-50 text-purple-700',
    resolved: 'bg-emerald-50 text-emerald-700',
    running: 'bg-blue-50 text-blue-700',
    completed: 'bg-emerald-50 text-emerald-700',
    failed: 'bg-rose-50 text-rose-700',
    draft: 'bg-neutral-100 text-neutral-700',
    sent: 'bg-emerald-50 text-emerald-700',
  }
  return (
    <span className={`badge ${styles[state] ?? 'bg-neutral-100 text-neutral-700'}`}>
      {state}
    </span>
  )
}
