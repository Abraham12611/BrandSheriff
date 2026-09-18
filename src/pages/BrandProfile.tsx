import { useEffect, useMemo, useState } from 'react'
import { useQuery, useAction, useMutation } from 'convex/react'
import { Link } from 'react-router-dom'
import {
  ExternalLink,
  FileText,
  Globe,
  Image,
  Link2,
  Video,
  Plus,
  RefreshCw,
  ShieldCheck,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { api } from '../../convex/_generated/api'
import { useWorkspace } from '../lib/workspace'
import { useToast } from '../components/Toasts'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import EnableProviderActions from '../components/EnableProviderActions'
import Modal from '../components/Modal'
import type { Doc, Id } from '../../convex/_generated/dataModel'

type TabKey = 'overview' | 'assets' | 'keywords' | 'allowlist'

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'assets', label: 'Asset Library' },
  { key: 'keywords', label: 'Keywords' },
  { key: 'allowlist', label: 'Allowlist' },
]

const ASSET_TYPE_META: Record<string, { label: string; icon: React.ReactNode; tone: string }> = {
  page: { label: 'Page', icon: <Globe className="w-4 h-4" />, tone: 'bg-blue-50 text-blue-700' },
  link: { label: 'Link', icon: <Link2 className="w-4 h-4" />, tone: 'bg-neutral-100 text-neutral-600' },
  image: { label: 'Image', icon: <Image className="w-4 h-4" />, tone: 'bg-emerald-50 text-emerald-700' },
  video: { label: 'Video', icon: <Video className="w-4 h-4" />, tone: 'bg-cyan-50 text-cyan-700' },
  logo: { label: 'Logo', icon: <Image className="w-4 h-4" />, tone: 'bg-amber-50 text-amber-700' },
  document: { label: 'Doc', icon: <FileText className="w-4 h-4" />, tone: 'bg-purple-50 text-purple-700' },
}

function hostOf(url?: string): string {
  if (!url) return '—'
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

const DNA_STATUS: Record<string, string> = {
  pending: 'bg-neutral-100 text-neutral-700',
  crawling: 'bg-blue-50 text-blue-700',
  review: 'bg-amber-50 text-amber-700',
  active: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-rose-50 text-rose-700',
}

export default function BrandProfile() {
  const { organization, providerActionsEnabled, isAdmin } = useWorkspace()
  const brands = useQuery(api.brands.list)
  const [brandId, setBrandId] = useState<Id<'brands'> | null>(null)
  const [tab, setTab] = useState<TabKey>('overview')
  const [crawling, setCrawling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const crawl = useAction(api.brandDna.crawl)
  const removeBrand = useMutation(api.brands.remove)

  useEffect(() => {
    if (!brands || brands.length === 0) return
    setBrandId((prev) => (prev && brands.some((b) => b._id === prev) ? prev : brands[0]._id))
  }, [brands])

  const brand = brands?.find((b) => b._id === brandId) ?? brands?.[0]

  const assets = useQuery(api.brandAssets.list, brand ? { brandId: brand._id } : 'skip')
  const setKeywords = useMutation(api.brands.setKeywords)
  const setAllowlist = useMutation(api.brands.setAllowlist)

  const handleCrawl = async () => {
    if (!brand) return
    setError(null)
    setCrawling(true)
    try {
      await crawl({ brandId: brand._id, url: brand.canonicalDomain })
      setTab('assets')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Crawl failed')
    } finally {
      setCrawling(false)
    }
  }

  const handleRemove = async () => {
    if (!brand) return
    setConfirmRemove(false)
    try {
      await removeBrand({ brandId: brand._id })
      setBrandId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove brand')
    }
  }

  if (brands === undefined) {
    return <Loading message="Loading brand profile…" />
  }

  if (brands.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Brand Profile" subtitle="Your official brand presence" />
        <EmptyState
          title="No brands yet"
          description="Add your first brand to build its Brand DNA from the official site."
          actionTo="/onboarding"
          actionLabel="Add brand"
        />
      </div>
    )
  }

  const monitoredCount = assets?.filter((a) => a.monitorEnabled).length ?? 0

  return (
    <div className="space-y-5">
      <PageHeader
        title="Brand Profile"
        subtitle={`Official brand presence — ${organization?.name ?? 'workspace'}`}
        actions={
          <div className="flex items-center gap-2">
            {brands.length > 1 && brand && (
              <select
                value={brand._id}
                onChange={(e) => setBrandId(e.target.value as Id<'brands'>)}
                className="input-field !w-auto"
                aria-label="Select brand"
              >
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
            <Link to="/onboarding" className="btn-secondary">
              <Plus className="w-4 h-4" /> Add brand
            </Link>
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

      {brand && (
        <>
          <section className="app-panel p-5">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="w-14 h-14 rounded-xl bg-neutral-900 flex items-center justify-center text-white text-xl font-bold shrink-0">
                {brand.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold tracking-tight">{brand.name}</h2>
                  <span className={`badge ${DNA_STATUS[brand.brandDnaStatus] ?? DNA_STATUS.pending}`}>
                    {brand.brandDnaStatus}
                  </span>
                </div>
                <a
                  href={brand.canonicalDomain}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-neutral-500 hover:text-neutral-900 hover:underline flex items-center gap-1 mt-0.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="truncate">{brand.canonicalDomain}</span>
                </a>
                <p className="text-xs text-neutral-400 mt-1">
                  Last indexed{' '}
                  {brand.lastIndexedAt ? new Date(brand.lastIndexedAt).toLocaleString() : 'never'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCrawl}
                  disabled={!providerActionsEnabled || crawling}
                  className="btn-primary"
                  title={
                    providerActionsEnabled
                      ? 'Crawl the official site and refresh Brand DNA'
                      : 'Provider actions are disabled for this workspace'
                  }
                >
                  <RefreshCw className={`w-4 h-4 ${crawling ? 'animate-spin' : ''}`} />
                  {crawling ? 'Crawling…' : 'Crawl site'}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setConfirmRemove(true)}
                    className="btn-ghost text-rose-600 hover:bg-rose-50"
                    title="Remove this brand and its captured assets"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <MiniStat label="Assets" value={assets?.length ?? '—'} />
              <MiniStat label="Monitored" value={monitoredCount} />
              <MiniStat label="Keywords" value={brand.keywords?.length ?? 0} />
              <MiniStat label="Allowlisted" value={brand.allowlist?.length ?? 0} />
            </div>
          </section>

          <div className="flex items-center gap-1 border-b border-neutral-200">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t.key
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
                role="tab"
                aria-selected={tab === t.key}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && <OverviewTab brand={brand} assetCount={assets?.length ?? 0} />}
          {tab === 'assets' && <AssetsTab brandId={brand._id} assets={assets} />}
          {tab === 'keywords' && (
            <KeywordsTab brand={brand} onSave={(keywords) => setKeywords({ brandId: brand._id, keywords })} />
          )}
          {tab === 'allowlist' && (
            <AllowlistTab brand={brand} onSave={(domains) => setAllowlist({ brandId: brand._id, domains })} />
          )}
        </>
      )}

      <Modal
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title={`Remove ${brand?.name}?`}
        subtitle="This deletes the brand and all captured assets. Discoveries and cases stay but lose their brand link."
        footer={
          <>
            <button onClick={() => setConfirmRemove(false)} className="btn-ghost">
              Cancel
            </button>
            <button onClick={handleRemove} className="btn-danger-soft">
              <Trash2 className="w-4 h-4" /> Remove brand
            </button>
          </>
        }
      >
        <p className="text-sm text-neutral-600">
          This cannot be undone. You can re-add the brand and crawl again later.
        </p>
      </Modal>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-neutral-50 px-3 py-2.5">
      <div className="text-[11px] text-neutral-500 font-medium">{label}</div>
      <div className="text-lg font-semibold mt-0.5">{value}</div>
    </div>
  )
}

function OverviewTab({ brand, assetCount }: { brand: Doc<'brands'>; assetCount: number }) {
  const discoveries = useQuery(api.discoveries.listForInbox, { brandId: brand._id })
  const needsReview = discoveries?.filter((d) => d.status === 'needs_review').length ?? 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <section className="app-panel p-5">
        <h3 className="font-semibold text-sm mb-3">Official presence</h3>
        <dl className="text-sm space-y-2.5">
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500">Canonical domain</dt>
            <dd className="font-medium text-right truncate">{hostOf(brand.canonicalDomain)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500">DNA status</dt>
            <dd>
              <span className={`badge ${DNA_STATUS[brand.brandDnaStatus] ?? DNA_STATUS.pending}`}>
                {brand.brandDnaStatus}
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500">Captured assets</dt>
            <dd className="font-medium">{assetCount}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500">Discoveries</dt>
            <dd className="font-medium">{discoveries?.length ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500">Awaiting review</dt>
            <dd className={`font-medium ${needsReview > 0 ? 'text-amber-600' : ''}`}>
              {needsReview}
            </dd>
          </div>
        </dl>
        {brand.description && (
          <p className="text-sm text-neutral-600 mt-4 pt-3 border-t border-neutral-100">
            {brand.description}
          </p>
        )}
      </section>

      <section className="app-panel p-5">
        <h3 className="font-semibold text-sm mb-3">How BrandSheriff uses this profile</h3>
        <ul className="text-sm text-neutral-600 space-y-2.5">
          <li className="flex gap-2">
            <Globe className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
            Crawled assets become the reference set forensic comparisons run against.
          </li>
          <li className="flex gap-2">
            <Tag className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
            Keywords drive patrol queries — defaults are the brand name plus
            &ldquo;official&rdquo;/&ldquo;sale&rdquo; variants.
          </li>
          <li className="flex gap-2">
            <ShieldCheck className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
            Allowlisted hosts are suppressed from future patrol results.
          </li>
        </ul>
        <div className="mt-4 pt-3 border-t border-neutral-100">
          <Link to="/discoveries" className="text-sm font-medium hover:underline">
            Review discoveries →
          </Link>
        </div>
      </section>
    </div>
  )
}

function AssetsTab({
  brandId,
  assets,
}: {
  brandId: Id<'brands'>
  assets: Array<Doc<'brandAssets'> & { fileUrl?: string | null }> | undefined
}) {
  const toast = useToast()
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const setMonitor = useMutation(api.brandAssets.setMonitor)
  const bulkSetMonitor = useMutation(api.brandAssets.bulkSetMonitor)
  const bulkRemove = useMutation(api.brandAssets.bulkRemove)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const createDocument = useMutation(api.brandAssets.createDocument)

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const uploadUrl = await generateUploadUrl({ brandId })
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })
      if (!res.ok) throw new Error(`Upload failed (${res.status})`)
      const { storageId } = (await res.json()) as { storageId: string }
      await createDocument({
        brandId,
        title: file.name,
        fileId: storageId,
        contentType: file.type || undefined,
      })
      toast.success(`Uploaded ${file.name}`)
      setTypeFilter('document')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const types = useMemo(
    () => [...new Set((assets ?? []).map((a) => a.type))].sort(),
    [assets],
  )
  const filtered = useMemo(
    () => (assets ?? []).filter((a) => typeFilter === 'all' || a.type === typeFilter),
    [assets, typeFilter],
  )
  const allSelected = filtered.length > 0 && filtered.every((a) => selection.has(a._id))

  const toggleAll = () =>
    setSelection(allSelected ? new Set() : new Set(filtered.map((a) => a._id)))

  const bulk = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await fn()
      setSelection(new Set())
    } finally {
      setBusy(false)
    }
  }

  if (assets === undefined) {
    return <p className="text-sm text-neutral-500 py-8 text-center">Loading assets…</p>
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {['all', ...types].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTypeFilter(t)
                setSelection(new Set())
              }}
              className="status-pill !py-1 text-xs capitalize"
              data-active={typeFilter === t}
            >
              {t === 'all' ? 'All' : (ASSET_TYPE_META[t]?.label ?? t)}
              <span className="text-[10px] px-1 py-0.5 rounded bg-neutral-200/60 text-neutral-600">
                {t === 'all' ? assets.length : assets.filter((a) => a.type === t).length}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label className="btn-secondary !py-1.5 text-xs cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            {uploading ? 'Uploading…' : 'Upload document'}
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.mp4,.webm,.mov,.doc,.docx,.txt"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleUpload(f)
                e.target.value = ''
              }}
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="w-3.5 h-3.5 rounded border-neutral-300 accent-neutral-900"
            />
            Select all
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No assets captured"
          description="Run Crawl site to capture pages, links, and assets from the official domain."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((asset) => {
            const meta = ASSET_TYPE_META[asset.type] ?? ASSET_TYPE_META.link
            const expanded = expandedId === asset._id
            return (
              <div
                key={asset._id}
                className={`app-panel card-lift p-3.5 ${selection.has(asset._id) ? 'ring-2 ring-neutral-900' : ''}`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={selection.has(asset._id)}
                    onChange={(e) => {
                      setSelection((prev) => {
                        const next = new Set(prev)
                        if (e.target.checked) next.add(asset._id)
                        else next.delete(asset._id)
                        return next
                      })
                    }}
                    className="mt-1 w-3.5 h-3.5 rounded border-neutral-300 accent-neutral-900"
                    aria-label={`Select ${asset.title}`}
                  />
                  {asset.type === 'image' && asset.fileUrl ? (
                    <img
                      src={asset.fileUrl}
                      alt={asset.title}
                      loading="lazy"
                      className="w-9 h-9 rounded-lg object-cover shrink-0"
                    />
                  ) : asset.type === 'video' && asset.fileUrl ? (
                    <video
                      src={asset.fileUrl}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-9 h-9 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.tone}`}>
                      {meta.icon}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate" title={asset.title}>
                      {asset.title}
                    </div>
                    <div className="text-[11px] text-neutral-500 truncate">
                      {hostOf(asset.sourceUrl)}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setMonitor({ assetId: asset._id, enabled: !asset.monitorEnabled })
                    }
                    className={`relative w-8 h-[18px] rounded-full transition-colors shrink-0 ${
                      asset.monitorEnabled ? 'bg-emerald-500' : 'bg-neutral-200'
                    }`}
                    role="switch"
                    aria-checked={asset.monitorEnabled}
                    title={asset.monitorEnabled ? 'Monitoring on' : 'Monitoring off'}
                  >
                    <span
                      className={`absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full shadow transition-transform ${
                        asset.monitorEnabled ? 'left-[16px]' : 'left-[2px]'
                      }`}
                    />
                  </button>
                </div>

                {asset.sourceUrl && (
                  <a
                    href={asset.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-neutral-400 hover:text-neutral-700 hover:underline flex items-center gap-1 mt-2 ml-6"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{asset.sourceUrl}</span>
                  </a>
                )}
                {asset.fileUrl && (
                  <a
                    href={asset.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-neutral-500 hover:text-neutral-900 hover:underline flex items-center gap-1 mt-2 ml-6"
                  >
                    <FileText className="w-3 h-3 shrink-0" />
                    Open file
                  </a>
                )}

                {asset.textContent && (
                  <div className="mt-2 ml-6">
                    <button
                      onClick={() => setExpandedId(expanded ? null : asset._id)}
                      className="text-[11px] text-neutral-500 hover:text-neutral-900"
                    >
                      {expanded ? 'Hide preview' : 'Preview content'}
                    </button>
                    {expanded && (
                      <p className="mt-1.5 text-xs text-neutral-600 whitespace-pre-wrap line-clamp-6 bg-neutral-50 rounded-lg p-2.5">
                        {asset.textContent}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {selection.size > 0 && (
        <div
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 app-panel px-4 py-3 flex items-center gap-3 animate-toast-in"
          style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.18)' }}
        >
          <span className="text-sm font-medium">{selection.size} selected</span>
          <div className="w-px h-5 bg-neutral-200" />
          <button
            onClick={() =>
              bulk(() =>
                bulkSetMonitor({ assetIds: [...selection] as Id<'brandAssets'>[], enabled: true }),
              )
            }
            disabled={busy}
            className="btn-secondary !py-1.5 text-xs"
          >
            Monitor
          </button>
          <button
            onClick={() =>
              bulk(() =>
                bulkSetMonitor({ assetIds: [...selection] as Id<'brandAssets'>[], enabled: false }),
              )
            }
            disabled={busy}
            className="btn-secondary !py-1.5 text-xs"
          >
            Unmonitor
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Delete ${selection.size} asset(s)?`)) {
                bulk(() => bulkRemove({ assetIds: [...selection] as Id<'brandAssets'>[] }))
              }
            }}
            disabled={busy}
            className="btn-danger-soft !py-1.5 text-xs"
          >
            Delete
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
    </div>
  )
}

function KeywordsTab({
  brand,
  onSave,
}: {
  brand: Doc<'brands'>
  onSave: (keywords: string[]) => Promise<unknown>
}) {
  const toast = useToast()
  const [keywords, setKeywords] = useState<string[]>(brand.keywords ?? [])
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setKeywords(brand.keywords ?? [])
  }, [brand._id, brand.keywords])

  const add = () => {
    const k = input.trim()
    if (k && !keywords.includes(k)) setKeywords([...keywords, k])
    setInput('')
  }

  const save = async () => {
    setSaving(true)
    try {
      await onSave(keywords)
      toast.success('Keywords saved — patrols will use them')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const defaults = [brand.name, `${brand.name} official`, `${brand.name} sale`]

  return (
    <div className="max-w-2xl">
      <section className="app-panel p-5">
        <h3 className="font-semibold text-sm mb-1">Patrol keywords</h3>
        <p className="text-xs text-neutral-500 mb-4">
          Patrols search these queries instead of the defaults
          {keywords.length === 0 && ` (${defaults.join(', ')})`}.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {keywords.map((k) => (
            <span
              key={k}
              className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-neutral-100 rounded-full text-sm"
            >
              {k}
              <button
                onClick={() => setKeywords(keywords.filter((x) => x !== k))}
                className="p-0.5 hover:bg-neutral-200 rounded-full"
                aria-label={`Remove ${k}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {keywords.length === 0 && (
            <span className="text-sm text-neutral-400 py-1.5">Using default queries</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder={`e.g. "${brand.name} backpack"`}
            className="input-field flex-1"
          />
          <button onClick={add} disabled={!input.trim()} className="btn-secondary">
            Add
          </button>
        </div>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-neutral-100">
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save keywords'}
          </button>
        </div>
      </section>
    </div>
  )
}

function AllowlistTab({
  brand,
  onSave,
}: {
  brand: Doc<'brands'>
  onSave: (domains: string[]) => Promise<unknown>
}) {
  const toast = useToast()
  const [domains, setDomains] = useState<string[]>(brand.allowlist ?? [])
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDomains(brand.allowlist ?? [])
  }, [brand._id, brand.allowlist])

  const add = () => {
    const d = input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (d && !domains.includes(d)) setDomains([...domains, d])
    setInput('')
  }

  const save = async () => {
    setSaving(true)
    try {
      await onSave(domains)
      toast.success('Allowlist saved')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <section className="app-panel p-5">
        <h3 className="font-semibold text-sm mb-1">Allowlisted domains</h3>
        <p className="text-xs text-neutral-500 mb-4">
          Patrols never surface discoveries from these hosts. Marking a discovery as
          &ldquo;Allowed&rdquo; adds its host here automatically.
        </p>
        {domains.length > 0 ? (
          <ul className="divide-y divide-neutral-100 mb-4">
            {domains.map((d) => (
              <li key={d} className="flex items-center justify-between py-2">
                <span className="text-sm font-mono">{d}</span>
                <button
                  onClick={() => setDomains(domains.filter((x) => x !== d))}
                  className="p-1 text-neutral-400 hover:text-rose-600"
                  aria-label={`Remove ${d}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-400 mb-4">No allowlisted domains yet.</p>
        )}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="partner-shop.com"
            className="input-field flex-1"
          />
          <button onClick={add} disabled={!input.trim()} className="btn-secondary">
            Add
          </button>
        </div>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-neutral-100">
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save allowlist'}
          </button>
        </div>
      </section>
    </div>
  )
}
