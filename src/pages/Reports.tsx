import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { useWorkspace } from '../lib/workspace'
import { useToast } from '../components/Toasts'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import {
  FileText,
  Plus,
  ExternalLink,
  Link2,
  Ban,
  Trash2,
  Check,
} from 'lucide-react'

type ReportRow = {
  _id: Id<'reports'>
  title: string
  rangeFrom: number
  rangeTo: number
  sections: string[]
  token: string
  createdByName: string | null
  createdAt: number
  revokedAt: number | null
  brandId: Id<'brands'> | null
}

const SECTION_OPTIONS = [
  { key: 'headline', label: 'Headline metrics', desc: 'Discoveries, cases, notices, removals' },
  { key: 'channels', label: 'Channel breakdown', desc: 'Where suspects were found' },
  { key: 'top_offenders', label: 'Top offenders', desc: 'Highest-similarity suspects' },
  { key: 'resolved_cases', label: 'Resolved cases log', desc: 'Cases closed in the period' },
]

const RANGE_PRESETS = [
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export default function Reports() {
  const { organization, isAdmin } = useWorkspace()
  const toast = useToast()
  const reports = useQuery(
    api.reports.list,
    organization ? { organizationId: organization._id } : 'skip',
  ) as ReportRow[] | undefined
  const brands = useQuery(api.brands.list, {}) as { _id: Id<'brands'>; name: string }[] | undefined
  const generate = useMutation(api.reports.generate)
  const revoke = useMutation(api.reports.revoke)
  const remove = useMutation(api.reports.remove)

  const [modalOpen, setModalOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const shareUrl = (token: string) => `${window.location.origin}/report/${token}`

  const copyLink = async (r: ReportRow) => {
    try {
      await navigator.clipboard.writeText(shareUrl(r.token))
      setCopiedId(r._id)
      setTimeout(() => setCopiedId((c) => (c === r._id ? null : c)), 2000)
      toast.success('Share link copied')
    } catch {
      toast.error('Could not copy — clipboard unavailable')
    }
  }

  const onRevoke = async (r: ReportRow) => {
    try {
      await revoke({ reportId: r._id })
      toast.success('Share link revoked')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Revoke failed')
    }
  }

  const onRemove = async (r: ReportRow) => {
    try {
      await remove({ reportId: r._id })
      toast.success('Report deleted')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const brandName = (id: Id<'brands'> | null) =>
    id ? (brands?.find((b) => b._id === id)?.name ?? 'Brand') : 'All brands'

  if (!organization) return <Loading />

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Reports"
        subtitle="Shareable snapshots of enforcement activity for people who never log in."
        actions={
          isAdmin ? (
            <button onClick={() => setModalOpen(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Generate report
            </button>
          ) : undefined
        }
      />

      {reports === undefined ? (
        <Loading />
      ) : reports.length === 0 ? (
        <div className="app-panel">
          <EmptyState
            title="No reports yet"
            description="Generate a report to get a shareable, print-friendly summary of discoveries, cases, and outcomes over a period."
          />
        </div>
      ) : (
        <div className="app-panel divide-y divide-neutral-100">
          {reports.map((r) => (
            <div key={r._id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-neutral-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-neutral-900 truncate">{r.title}</h3>
                    {r.revokedAt ? (
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                        Revoked
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Link active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {fmtDate(r.rangeFrom)} – {fmtDate(r.rangeTo)} · {brandName(r.brandId)} ·{' '}
                    {r.createdByName ? `${r.createdByName} · ` : ''}
                    {fmtDate(r.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 pl-12 sm:pl-0">
                {!r.revokedAt && (
                  <>
                    <a
                      href={shareUrl(r.token)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost text-xs"
                      title="Open report"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open
                    </a>
                    <button
                      onClick={() => copyLink(r)}
                      className="btn-ghost text-xs"
                      title="Copy share link"
                    >
                      {copiedId === r._id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Link2 className="w-3.5 h-3.5" />
                      )}
                      Copy link
                    </button>
                  </>
                )}
                {isAdmin && !r.revokedAt && (
                  <button onClick={() => onRevoke(r)} className="btn-ghost text-xs" title="Revoke share link">
                    <Ban className="w-3.5 h-3.5" /> Revoke
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => onRemove(r)}
                    className="btn-ghost text-xs text-red-600 hover:bg-red-50"
                    title="Delete report"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <GenerateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        organizationId={organization._id}
        brands={brands ?? []}
        onGenerate={async (args) => {
          const res = await generate(args)
          toast.success('Report generated — share link ready')
          return res
        }}
      />
    </div>
  )
}

function GenerateModal({
  open,
  onClose,
  organizationId,
  brands,
  onGenerate,
}: {
  open: boolean
  onClose: () => void
  organizationId: Id<'organizations'>
  brands: { _id: Id<'brands'>; name: string }[]
  onGenerate: (args: {
    organizationId: Id<'organizations'>
    brandId?: Id<'brands'>
    rangeFrom: number
    rangeTo: number
    sections: string[]
    title?: string
  }) => Promise<{ token: string }>
}) {
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [days, setDays] = useState(30)
  const [brandId, setBrandId] = useState<string>('')
  const [sections, setSections] = useState<string[]>(SECTION_OPTIONS.map((s) => s.key))
  const [busy, setBusy] = useState(false)
  const [createdToken, setCreatedToken] = useState<string | null>(null)

  const rangeTo = Date.now()
  const rangeFrom = rangeTo - days * 86400_000

  const toggle = (key: string) =>
    setSections((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]))

  const submit = async () => {
    setBusy(true)
    try {
      const res = await onGenerate({
        organizationId,
        brandId: (brandId || undefined) as Id<'brands'> | undefined,
        rangeFrom,
        rangeTo,
        sections,
        title: title.trim() || undefined,
      })
      setCreatedToken(res.token)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Report generation failed')
    } finally {
      setBusy(false)
    }
  }

  const close = () => {
    setCreatedToken(null)
    setTitle('')
    onClose()
  }

  const shareUrl = createdToken ? `${window.location.origin}/report/${createdToken}` : null

  return (
    <Modal
      open={open}
      onClose={close}
      title="Generate report"
      subtitle="A frozen snapshot over the period — the share link is readable by anyone who has it until you revoke it."
      footer={
        createdToken ? (
          <button onClick={close} className="btn-primary">
            Done
          </button>
        ) : (
          <>
            <button onClick={close} className="btn-secondary">
              Cancel
            </button>
            <button onClick={submit} disabled={busy || sections.length === 0} className="btn-primary">
              {busy ? 'Generating…' : 'Generate'}
            </button>
          </>
        )
      }
    >
      {createdToken && shareUrl ? (
        <div className="space-y-3">
          <p className="text-sm text-neutral-700">
            Your report is ready. Anyone with this link can view it — no account needed.
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={shareUrl}
              className="input-field text-xs flex-1 font-mono"
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={() => {
                navigator.clipboard
                  .writeText(shareUrl)
                  .then(() => toast.success('Share link copied'))
                  .catch(() => toast.error('Copy failed'))
              }}
              className="btn-secondary text-xs shrink-0"
            >
              <Link2 className="w-3.5 h-3.5" /> Copy
            </button>
            <a href={shareUrl} target="_blank" rel="noreferrer" className="btn-secondary text-xs shrink-0">
              <ExternalLink className="w-3.5 h-3.5" /> Open
            </a>
          </div>
          <p className="text-xs text-neutral-500">
            You can revoke the link anytime from the reports list.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">Title (optional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. March enforcement summary"
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">Period</label>
            <div className="flex gap-1.5">
              {RANGE_PRESETS.map((p) => (
                <button
                  key={p.days}
                  onClick={() => setDays(p.days)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    days === p.days
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  Last {p.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-1.5">
              {fmtDate(rangeFrom)} – {fmtDate(rangeTo)}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">Scope</label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="input-field w-full"
            >
              <option value="">All brands</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">Sections</label>
            <div className="space-y-1.5">
              {SECTION_OPTIONS.map((s) => (
                <label
                  key={s.key}
                  className="flex items-start gap-2.5 p-2 rounded-lg border border-neutral-200 hover:border-neutral-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={sections.includes(s.key)}
                    onChange={() => toggle(s.key)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium text-neutral-800">{s.label}</span>
                    <span className="block text-xs text-neutral-500">{s.desc}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              The methodology note is always included — it explains how matching works and that
              machine signals are not legal conclusions.
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
}
