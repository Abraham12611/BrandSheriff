import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import { useWorkspace } from '../lib/workspace'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'

export default function BrandDNA() {
  const { organization } = useWorkspace()
  const brands = useQuery(api.brands.list)

  if (brands === undefined) {
    return <Loading message="Loading brands…" />
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

      <div className="app-panel overflow-hidden">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 font-medium text-neutral-600">Name</th>
              <th className="px-4 py-3 font-medium text-neutral-600">Domain</th>
              <th className="px-4 py-3 font-medium text-neutral-600">Status</th>
              <th className="px-4 py-3 font-medium text-neutral-600">Last indexed</th>
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
  }
  return (
    <span className={`badge ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  )
}
