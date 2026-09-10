import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../convex/_generated/api'

export default function BrandDNA() {
  const brands = useQuery(api.brands.list)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Brand DNA</h1>
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
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
            {brands?.map((brand) => (
              <tr key={brand._id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 font-medium">{brand.name}</td>
                <td className="px-4 py-3 text-neutral-600">{brand.canonicalDomain}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={brand.brandDnaStatus} />
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {brand.lastIndexedAt ? new Date(brand.lastIndexedAt).toLocaleString() : 'Never'}
                </td>
              </tr>
            ))}
            {brands?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                  No brands yet. <Link to="/onboarding" className="underline">Onboard one</Link>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  )
}
