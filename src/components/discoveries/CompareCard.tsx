import { useEffect, useRef, useState } from 'react'
import { useQuery } from 'convex/react'
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  Flag,
  Gauge,
  MoreHorizontal,
  RotateCcw,
  Search,
} from 'lucide-react'
import type { Doc } from '../../../convex/_generated/dataModel'
import { api } from '../../../convex/_generated/api'
import { useWorkspace } from '../../lib/workspace'

export type DiscoveryAction =
  | 'approve'
  | 'dismiss'
  | 'watchlist'
  | 'allow'
  | 'reopen'
  | 'investigate'
  | 'createCase'

const PLATFORM_META: Record<string, { label: string; swatch: string }> = {
  amazon: { label: 'Amazon', swatch: 'bg-amber-400' },
  ebay: { label: 'eBay', swatch: 'bg-blue-500' },
  etsy: { label: 'Etsy', swatch: 'bg-orange-500' },
  walmart: { label: 'Walmart', swatch: 'bg-sky-500' },
  alibaba: { label: 'Alibaba', swatch: 'bg-orange-600' },
  dhgate: { label: 'DHgate', swatch: 'bg-red-500' },
  temu: { label: 'Temu', swatch: 'bg-orange-500' },
  shein: { label: 'Shein', swatch: 'bg-neutral-800' },
  tiktok: { label: 'TikTok', swatch: 'bg-neutral-900' },
  meta: { label: 'Meta', swatch: 'bg-blue-600' },
  shopify: { label: 'Shopify', swatch: 'bg-emerald-600' },
  demo: { label: 'Demo site', swatch: 'bg-violet-500' },
  web: { label: 'Website', swatch: 'bg-neutral-400' },
}

const SEVERITY_STYLE: Record<string, string> = {
  low: 'bg-neutral-100 text-neutral-600',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-orange-50 text-orange-700',
  critical: 'bg-rose-50 text-rose-700',
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export function PlatformChip({ platform }: { platform?: string }) {
  const meta = PLATFORM_META[platform ?? 'web'] ?? PLATFORM_META.web
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-neutral-700">
      <span className={`w-3.5 h-3.5 rounded-[4px] ${meta.swatch}`} aria-hidden="true" />
      {meta.label}
    </span>
  )
}

function SuspectThumbnail({ url }: { url: string }) {
  const [failed, setFailed] = useState(false)
  const host = hostOf(url)
  return (
    <div className="w-full h-full bg-neutral-100 rounded-lg flex items-center justify-center overflow-hidden">
      {!failed ? (
        <img
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`}
          alt=""
          className="w-10 h-10 object-contain"
          onError={() => setFailed(true)}
          loading="lazy"
        />
      ) : (
        <span className="text-xl font-semibold text-neutral-400">
          {host.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-900 font-medium">{children}</span>
    </div>
  )
}

function Menu({
  label,
  items,
  align = 'right',
  triggerClass,
}: {
  label: React.ReactNode
  items: Array<{ label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }>
  align?: 'left' | 'right'
  triggerClass?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={triggerClass ?? 'btn-ghost !px-2'}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1 w-52 bg-white rounded-lg py-1 z-30 animate-modal-in`}
          style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)' }}
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              onClick={() => {
                setOpen(false)
                item.onClick()
              }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-neutral-50 ${
                item.danger ? 'text-rose-600' : 'text-neutral-700'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CompareCard({
  discovery,
  brandName,
  selected,
  onSelect,
  onAction,
  busy,
}: {
  discovery: Doc<'discoveries'> & {
    suspectImageUrl?: string | null
    matchedAssetUrl?: string | null
  }
  brandName: string
  selected: boolean
  onSelect: (checked: boolean) => void
  onAction: (action: DiscoveryAction, reason?: string) => void
  busy: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [showSignals, setShowSignals] = useState(false)
  const { organization } = useWorkspace()
  const signals = useQuery(
    api.cloneScore.listSignals,
    showSignals && organization
      ? { discoveryId: discovery._id, organizationId: organization._id }
      : 'skip',
  )
  const similarity = discovery.similarityScore ?? discovery.matchConfidence
  const similarityPct = similarity !== undefined ? Math.round(similarity * 100) : null
  const visualPct =
    discovery.visualMatchScore !== undefined ? Math.round(discovery.visualMatchScore * 100) : null
  const status = discovery.status
  const host = hostOf(discovery.canonicalUrl)

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(discovery.canonicalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }

  const similarityTone =
    similarityPct === null
      ? 'text-neutral-400'
      : similarityPct >= 80
        ? 'text-rose-600'
        : similarityPct >= 50
          ? 'text-amber-600'
          : 'text-emerald-600'

  return (
    <div
      className={`app-panel card-lift p-4 flex flex-col gap-3 ${selected ? 'ring-2 ring-neutral-900' : ''}`}
      data-status={status}
    >
      <div className="flex items-start justify-between gap-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            className="w-4 h-4 rounded border-neutral-300 accent-neutral-900"
            aria-label={`Select ${host}`}
          />
          <span className="text-sm font-medium truncate max-w-[180px]">{host}</span>
        </label>
        <div className="flex items-center gap-1.5">
          {discovery.cloneScore !== undefined && (
            <span
              className={`badge font-semibold ${
                discovery.cloneScore >= 70
                  ? 'bg-rose-50 text-rose-700'
                  : discovery.cloneScore >= 40
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-neutral-100 text-neutral-500'
              }`}
              title="Clone risk score — composite of explainable signals"
            >
              <Gauge className="w-3 h-3" /> {discovery.cloneScore}
            </span>
          )}
          {discovery.severity && (
            <span className={`badge ${SEVERITY_STYLE[discovery.severity] ?? SEVERITY_STYLE.low}`}>
              {discovery.severity}
            </span>
          )}
          {discovery.priority === 'high' && (
            <span className="badge bg-rose-50 text-rose-700">
              <Flag className="w-3 h-3" /> Priority
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-full aspect-[4/3] bg-neutral-900 rounded-lg flex items-center justify-center overflow-hidden">
            {discovery.matchedAssetUrl ? (
              <img
                src={discovery.matchedAssetUrl}
                alt={`${brandName} asset`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="text-2xl font-bold text-white">
                {brandName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-[11px] text-neutral-500 font-medium">Your brand</span>
        </div>
        <div className="text-neutral-300 text-lg font-light select-none" aria-hidden="true">
          →
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-full aspect-[4/3] bg-neutral-100 rounded-lg overflow-hidden">
            {discovery.suspectImageUrl ? (
              <img
                src={discovery.suspectImageUrl}
                alt="Suspect page imagery"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <SuspectThumbnail url={discovery.canonicalUrl} />
            )}
          </div>
          <span className="text-[11px] text-neutral-500 font-medium">Potential copycat</span>
        </div>
      </div>

      <div className="border-t border-neutral-100 pt-2 -mt-1">
        <MetaRow label="Similarity">
          <span className={similarityTone}>{similarityPct !== null ? `${similarityPct}%` : '—'}</span>
        </MetaRow>
        {visualPct !== null && (
          <MetaRow label="Visual match">
            <span className={visualPct >= 85 ? 'text-rose-600 font-semibold' : visualPct >= 55 ? 'text-amber-600' : 'text-neutral-500'}>
              {visualPct}%
            </span>
          </MetaRow>
        )}
        <MetaRow label="Platform">
          <PlatformChip platform={discovery.platformGuess} />
        </MetaRow>
        <MetaRow label="Source">
          <span className="capitalize">{discovery.source ?? 'patrol'}</span>
        </MetaRow>
      </div>

      <a
        href={discovery.canonicalUrl}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-neutral-500 hover:text-neutral-900 hover:underline truncate flex items-center gap-1"
      >
        <ExternalLink className="w-3 h-3 shrink-0" />
        <span className="truncate">{discovery.title ?? discovery.canonicalUrl}</span>
      </a>

      {discovery.cloneScore !== undefined && (
        <div>
          <button
            onClick={() => setShowSignals((s) => !s)}
            className="text-[11px] font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
          >
            <Gauge className="w-3 h-3" />
            {showSignals ? 'Hide signal breakdown' : `Why ${discovery.cloneScore}/100?`}
          </button>
          {showSignals && (
            <div className="mt-1.5 rounded-lg bg-neutral-50 border border-neutral-100 divide-y divide-neutral-100">
              {signals === undefined ? (
                <p className="px-2.5 py-2 text-[11px] text-neutral-400">Loading signals…</p>
              ) : signals.length === 0 ? (
                <p className="px-2.5 py-2 text-[11px] text-neutral-400">No signals recorded yet.</p>
              ) : (
                signals.map((s) => (
                  <div key={s._id} className="px-2.5 py-1.5 flex items-start gap-2">
                    <span
                      className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                        s.severity === 'strong'
                          ? 'bg-rose-500'
                          : s.severity === 'medium'
                            ? 'bg-amber-400'
                            : 'bg-neutral-300'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-neutral-700 leading-snug">{s.finding}</p>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                      +{s.weight}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-100 mt-auto">
        {status === 'needs_review' && (
          <>
            <button
              onClick={() => onAction('approve')}
              disabled={busy}
              className="btn-primary !px-3 !py-1.5 text-xs flex-1"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
            <Menu
              triggerClass="btn-secondary !px-2.5 !py-1.5 text-xs"
              label={
                <span className="inline-flex items-center gap-1">
                  Deny <ChevronDown className="w-3 h-3" />
                </span>
              }
              items={[
                { label: 'Wrong match', onClick: () => onAction('dismiss', 'Wrong match') },
                { label: 'Authorized seller', onClick: () => onAction('dismiss', 'Authorized seller') },
                { label: 'Official content', onClick: () => onAction('dismiss', 'Official content') },
              ]}
            />
            <button
              onClick={() => onAction('watchlist')}
              disabled={busy}
              className="btn-secondary !px-2.5 !py-1.5 text-xs"
              title="Keep monitoring this page for changes"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        {status === 'approved' && (
          <button
            onClick={() => onAction('createCase')}
            disabled={busy}
            className="btn-primary !px-3 !py-1.5 text-xs flex-1"
          >
            Create case
          </button>
        )}
        {status === 'watchlisted' && (
          <>
            <button
              onClick={() => onAction('approve')}
              disabled={busy}
              className="btn-primary !px-3 !py-1.5 text-xs flex-1"
            >
              Approve
            </button>
            <button
              onClick={() => onAction('dismiss')}
              disabled={busy}
              className="btn-secondary !px-2.5 !py-1.5 text-xs"
            >
              Dismiss
            </button>
          </>
        )}
        {(status === 'dismissed' || status === 'allowed') && (
          <button
            onClick={() => onAction('reopen')}
            disabled={busy}
            className="btn-secondary !px-3 !py-1.5 text-xs flex-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reopen
          </button>
        )}

        <Menu
          label={<MoreHorizontal className="w-4 h-4" />}
          items={[
            {
              label: busy ? 'Investigating…' : 'Investigate',
              icon: <Search className="w-3.5 h-3.5" />,
              onClick: () => onAction('investigate'),
            },
            {
              label: copied ? 'Copied!' : 'Copy URL',
              icon: <Copy className="w-3.5 h-3.5" />,
              onClick: copyUrl,
            },
            {
              label: 'Open site',
              icon: <ExternalLink className="w-3.5 h-3.5" />,
              onClick: () => window.open(discovery.canonicalUrl, '_blank', 'noreferrer'),
            },
            ...(status !== 'needs_review'
              ? [{ label: 'Move to Needs Review', icon: <RotateCcw className="w-3.5 h-3.5" />, onClick: () => onAction('reopen') }]
              : []),
          ]}
        />
      </div>
    </div>
  )
}
