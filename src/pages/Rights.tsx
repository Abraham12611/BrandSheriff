import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { AlertTriangle, Landmark, Plus, Trash2 } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import type { Doc, Id } from '../../convex/_generated/dataModel'
import { useWorkspace } from '../lib/workspace'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'

const KIND_META: Record<string, { label: string; hint: string }> = {
  trademark: { label: 'Trademarks', hint: 'Word marks, logos, slogans' },
  copyright_registration: { label: 'Copyright registrations', hint: 'Registered works' },
  design_right: { label: 'Design rights', hint: 'Registered designs, design patents, trade dress' },
  domain: { label: 'Domains', hint: 'Domains you own' },
  official_account: { label: 'Official accounts', hint: 'Real social/marketplace profiles' },
  authorized_seller: { label: 'Authorized sellers', hint: 'Retailers, distributors, affiliates' },
  ad_account: { label: 'Ad accounts', hint: 'Your Google/Meta advertiser identities' },
  proof_document: { label: 'Proof documents', hint: 'Invoices, contracts, first-publication evidence' },
}

const STATUS_STYLE: Record<string, string> = {
  registered: 'bg-emerald-50 text-emerald-700',
  verified: 'bg-emerald-50 text-emerald-700',
  active: 'bg-blue-50 text-blue-700',
  pending: 'bg-amber-50 text-amber-700',
  unregistered: 'bg-neutral-100 text-neutral-500',
}

export default function Rights() {
  const { organization, isAdmin } = useWorkspace()
  const orgId = organization?._id
  const brands = useQuery(api.brands.list) as Doc<'brands'>[] | undefined
  const [brandId, setBrandId] = useState<Id<'brands'> | null>(null)
  const activeBrandId = brandId ?? brands?.[0]?._id ?? null

  const rights = useQuery(
    api.rights.listForBrand,
    orgId && activeBrandId ? { brandId: activeBrandId, organizationId: orgId } : 'skip',
  ) as Doc<'rightsObjects'>[] | undefined
  const coverage = useQuery(
    api.rights.coverage,
    orgId && activeBrandId ? { brandId: activeBrandId, organizationId: orgId } : 'skip',
  )

  const add = useMutation(api.rights.add)
  const remove = useMutation(api.rights.remove)

  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ kind: 'trademark', label: '', value: '', territory: '', status: 'registered', notes: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!orgId || brands === undefined) return <Loading message="Loading rights vault…" />

  const grouped = new Map<string, Doc<'rightsObjects'>[]>()
  for (const r of rights ?? []) {
    if (!grouped.has(r.kind)) grouped.set(r.kind, [])
    grouped.get(r.kind)!.push(r)
  }

  const submit = async () => {
    if (!activeBrandId || !form.label.trim()) return
    setBusy(true)
    setError(null)
    try {
      await add({
        organizationId: orgId,
        brandId: activeBrandId,
        kind: form.kind,
        label: form.label.trim(),
        value: form.value.trim() || undefined,
        territory: form.territory.trim() || undefined,
        status: form.status,
        notes: form.notes.trim() || undefined,
      })
      setShowAdd(false)
      setForm({ kind: 'trademark', label: '', value: '', territory: '', status: 'registered', notes: '' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rights Vault"
        subtitle="What the business owns — trademarks, registrations, official accounts, authorized sellers, proof documents."
        actions={
          <div className="flex items-center gap-2">
            {(brands.length ?? 0) > 1 && (
              <select
                value={activeBrandId ?? ''}
                onChange={(e) => setBrandId(e.target.value as Id<'brands'>)}
                className="input-field text-sm w-auto"
              >
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            )}
            {activeBrandId && (
              <button onClick={() => setShowAdd(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> Add right
              </button>
            )}
          </div>
        }
      />

      {coverage && coverage.gaps.length > 0 && (
        <section className="app-panel p-4 border-l-4 border-amber-300">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="font-medium text-sm">Rights coverage gaps</h2>
          </div>
          <ul className="space-y-1.5">
            {coverage.gaps.map((g, i) => (
              <li key={i} className="text-xs text-neutral-600 leading-relaxed flex gap-2">
                <span className="text-amber-400">•</span> {g}
              </li>
            ))}
          </ul>
        </section>
      )}

      {rights !== undefined && rights.length === 0 ? (
        <EmptyState
          title="No rights recorded yet"
          description="Register what the brand owns — trademarks, domains, official accounts, authorized sellers. Enforcement routing and coverage-gap detection use this."
          actionLabel="Add your first right"
        />
      ) : (
        [...grouped.entries()].map(([kind, rows]) => (
          <section key={kind} className="app-panel overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-neutral-500" />
              <h2 className="font-medium text-sm">{KIND_META[kind]?.label ?? kind}</h2>
              <span className="text-[11px] text-neutral-400">{KIND_META[kind]?.hint}</span>
              <span className="ml-auto text-xs text-neutral-400">{rows.length}</span>
            </div>
            <div className="divide-y divide-neutral-100">
              {rows.map((r) => (
                <div key={r._id} className="px-4 py-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 truncate">{r.label}</p>
                    <p className="text-[11px] text-neutral-500 truncate">
                      {[r.value, r.territory, r.notes].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className={`badge capitalize ${STATUS_STYLE[r.status] ?? ''}`}>
                    {r.status}
                  </span>
                  {r.expiresAt && (
                    <span className="text-[11px] text-neutral-400">
                      expires {new Date(r.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                  {isAdmin && (
                    <button
                      onClick={async () => {
                        if (!confirm(`Remove "${r.label}"?`)) return
                        await remove({ id: r._id })
                      }}
                      className="btn-ghost text-xs text-neutral-400 hover:text-rose-600"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); setError(null) }}
        title="Add right"
        subtitle="Record something the brand owns — used for enforcement routing and coverage gaps."
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500">Type</label>
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
                className="input-field mt-1"
              >
                {Object.entries(KIND_META).map(([k, m]) => (
                  <option key={k} value={k}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-500">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input-field mt-1"
              >
                {['registered', 'pending', 'unregistered', 'active', 'verified'].map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-neutral-500">Label</label>
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="input-field mt-1"
              placeholder='e.g. "ACME word mark", "acme.com", "@acmeofficial"'
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500">Identifier (optional)</label>
              <input
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="input-field mt-1"
                placeholder="Reg. no, domain, handle"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500">Territory (optional)</label>
              <input
                value={form.territory}
                onChange={(e) => setForm({ ...form, territory: e.target.value })}
                className="input-field mt-1"
                placeholder="US, EU, UK, global"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-neutral-500">Notes (optional)</label>
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input-field mt-1"
              placeholder="Anything useful for enforcement packets"
            />
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button onClick={submit} disabled={!form.label.trim() || busy} className="btn-primary w-full">
            {busy ? 'Adding…' : 'Add right'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
