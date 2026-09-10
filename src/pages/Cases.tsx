import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../convex/_generated/api'

export default function Cases() {
  const cases = useQuery(api.cases.listByState, { state: 'active' })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cases</h1>
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 font-medium text-neutral-600">Case</th>
              <th className="px-4 py-3 font-medium text-neutral-600">State</th>
              <th className="px-4 py-3 font-medium text-neutral-600">Severity</th>
              <th className="px-4 py-3 font-medium text-neutral-600">Created</th>
            </tr>
          </thead>
          <tbody>
            {cases?.map((c) => (
              <tr key={c._id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 font-medium">
                  <Link to={`/cases/${c._id}`} className="hover:underline">{c.title}</Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.state} />
                </td>
                <td className="px-4 py-3 text-neutral-600">{c.severity ?? '—'}</td>
                <td className="px-4 py-3 text-neutral-600">{new Date(c._creationTime).toLocaleDateString()}</td>
              </tr>
            ))}
            {cases?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                  No active cases. Create one from a discovery.
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
    active: 'bg-amber-50 text-amber-700',
    reviewing: 'bg-blue-50 text-blue-700',
    awaiting_approval: 'bg-purple-50 text-purple-700',
    resolved: 'bg-emerald-50 text-emerald-700',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-neutral-100 text-neutral-700'}`}>
      {status}
    </span>
  )
}
