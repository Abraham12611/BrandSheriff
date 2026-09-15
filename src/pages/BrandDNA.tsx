import { useState } from 'react'
import { useQuery, useAction, useMutation } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import { useWorkspace } from '../lib/workspace'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import EnableProviderActions from '../components/EnableProviderActions'
import type { Doc, Id } from '../../convex/_generated/dataModel'

export default function BrandDNA() {
  const { organization, providerActionsEnabled, isAdmin } = useWorkspace()
  const brands = useQuery(api.brands.list)
  const crawl = useAction(api.brandDna.crawl)
  const removeBrand = useMutation(api.brands.remove)
  const [crawling, setCrawling] = useState<Record<string, boolean>>({})
  const [expandedBrandId, setExpandedBrandId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRemove = async (brand: Doc<'brands'>) => {
    if (!window.confirm(`Remove ${brand.name} and its captured assets? This cannot be undone.`)) return
    setError(null)
    try {
      await removeBrand({ brandId: brand._id })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove brand')
    }
  }

  if (brands === undefined) {
    return <Loading message="Loading brands…" />
  }

  const handleCrawl = async (brand: { _id: string; canonicalDomain: string }) => {
    setError(null)
    setCrawling((prev) => ({ ...prev, [brand._id]: true }))
    try {
      await crawl({ brandId: brand._id as any, url: brand.canonicalDomain })
      setExpandedBrandId(brand._id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Crawl failed')
    } finally {
      setCrawling((prev) => ({ ...prev, [brand._id]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brand DNA"
        subtitle={`Official brands for ${organization?.name ?? 'this workspace'}`}
        actions={
          <Link to="/onboarding" className="btn-primary">
            Add brand
          </Link>
        }
      />

      <EnableProviderActions />

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-sm">{error}</div>
      )}

      <div className="app-panel overflow-hidden">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 font-medium text-neutral-600">Name</th>
              <th className="px-4 py-3 font-medium text-neutral-600">Domain</th>
              <th className="px-4 py-3 font-medium text-neutral-600">Status</th>
              <th className="px-4 py-3 font-medium text-neutral-600">Last indexed</th>
              <th className="px-4 py-3 font-medium text-neutral-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => (
              <BrandRow
                key={brand._id}
                brand={brand}
                crawling={!!crawling[brand._id]}
                expanded={expandedBrandId === brand._id}
                providerActionsEnabled={providerActionsEnabled}
                isAdmin={isAdmin}
                onCrawl={() => handleCrawl(brand)}
                onRemove={() => handleRemove(brand)}
                onToggle={() =>
                  setExpandedBrandId((prev) => (prev === brand._id ? null : brand._id))
                }
              />
            ))}
          </tbody>
        </table>
        {brands.length === 0 && (
          <EmptyState
            title="No brands yet"
            description="Brand DNA is built from your official site crawl. Add your first brand to start monitoring."
            actionTo="/onboarding"
            actionLabel="Add brand"
          />
        )}
      </div>
    </div>
  )
}

function BrandRow({
  brand,
  crawling,
  expanded,
  providerActionsEnabled,
  isAdmin,
  onCrawl,
  onRemove,
  onToggle,
}: {
  brand: Doc<'brands'>
  crawling: boolean
  expanded: boolean
  providerActionsEnabled: boolean
  isAdmin: boolean
  onCrawl: () => void
  onRemove: () => void
  onToggle: () => void
}) {
  return (
    <>
      <tr className="border-b border-neutral-100 last:border-0">
        <td className="px-4 py-3 font-medium">{brand.name}</td>
        <td className="px-4 py-3 text-neutral-600">
          <a
            href={brand.canonicalDomain}
            target="_blank"
            rel="noreferrer"
            className="hover:underline text-violet-600"
          >
            {brand.canonicalDomain}
          </a>
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={brand.brandDnaStatus} />
        </td>
        <td className="px-4 py-3 text-neutral-600">
          {brand.lastIndexedAt ? new Date(brand.lastIndexedAt).toLocaleString() : 'Never'}
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <button
              onClick={onCrawl}
              disabled={!providerActionsEnabled || crawling}
              title={
                providerActionsEnabled
                  ? 'Crawl the official site and build Brand DNA'
                  : isAdmin
                  ? 'Enable provider actions to crawl'
                  : 'Provider actions are disabled for this workspace'
              }
              className="btn-secondary text-xs"
            >
              {crawling ? 'Crawling…' : 'Crawl'}
            </button>
            <button onClick={onToggle} className="btn-secondary text-xs">
              {expanded ? 'Hide assets' : 'View assets'}
            </button>
            {isAdmin && (
              <button
                onClick={onRemove}
                title="Remove this brand and its captured assets"
                className="text-xs text-rose-600 hover:text-rose-700 px-2"
              >
                Remove
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-neutral-100 last:border-0">
          <td colSpan={5} className="px-4 py-4 bg-neutral-50">
            <BrandAssets brandId={brand._id} />
          </td>
        </tr>
      )}
    </>
  )
}

function BrandAssets({ brandId }: { brandId: Id<'brands'> }) {
  const assets = useQuery(api.brandAssets.list, { brandId }) as Doc<'brandAssets'>[] | undefined

  if (assets === undefined) {
    return <p className="text-sm text-neutral-500">Loading assets…</p>
  }

  if (assets.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No assets captured yet. Run a crawl to build Brand DNA from the official site.
      </p>
    )
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">
        {assets.length} captured asset{assets.length === 1 ? '' : 's'}
      </p>
      <ul className="space-y-3">
        {assets.map((asset) => (
          <li key={asset._id} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <AssetTypeBadge type={asset.type} />
              <span className="font-medium text-sm">{asset.title}</span>
              {asset.monitorEnabled && (
                <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  monitored
                </span>
              )}
            </div>
            {asset.sourceUrl && (
              <a
                href={asset.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="block text-xs text-violet-600 hover:underline mt-1 truncate"
              >
                {asset.sourceUrl}
              </a>
            )}
            {asset.textContent && (
              <p className="mt-2 text-xs text-neutral-600 whitespace-pre-wrap line-clamp-4">
                {asset.textContent}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function AssetTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    page: 'bg-blue-50 text-blue-700',
    link: 'bg-neutral-100 text-neutral-600',
    image: 'bg-violet-50 text-violet-700',
    logo: 'bg-amber-50 text-amber-700',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[type] ?? styles.link}`}>
      {type}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-neutral-100 text-neutral-700',
    crawling: 'bg-blue-50 text-blue-700',
    review: 'bg-amber-50 text-amber-700',
    active: 'bg-emerald-50 text-emerald-700',
    failed: 'bg-rose-50 text-rose-700',
  }
  return (
    <span className={`badge ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  )
}
