import { useState } from 'react'
import { useQuery, useAction } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import { useWorkspace } from '../lib/workspace'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import EnableProviderActions from '../components/EnableProviderActions'

export default function BrandDNA() {
  const { organization, providerActionsEnabled, isAdmin } = useWorkspace()
  const brands = useQuery(api.brands.list)
  const crawl = useAction(api.brandDna.crawl)
  const [crawling, setCrawling] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  if (brands === undefined) {
    return <Loading message="Loading brands…" />
  }

  const handleCrawl = async (brand: { _id: string; canonicalDomain: string }) => {
    setError(null)
    setCrawling((prev) => ({ ...prev, [brand._id]: true }))
    try {
      await crawl({ brandId: brand._id as any, url: brand.canonicalDomain })
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
              <tr key={brand._id} className="border-b border-neutral-100 last:border-0">
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
                  <button
                    onClick={() => handleCrawl(brand)}
                    disabled={!providerActionsEnabled || crawling[brand._id]}
                    title={
                      providerActionsEnabled
                        ? 'Crawl the official site and build Brand DNA'
                        : isAdmin
                        ? 'Enable provider actions to crawl'
                        : 'Provider actions are disabled for this workspace'
                    }
                    className="btn-secondary text-xs"
                  >
                    {crawling[brand._id] ? 'Crawling…' : 'Crawl'}
                  </button>
                </td>
              </tr>
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
