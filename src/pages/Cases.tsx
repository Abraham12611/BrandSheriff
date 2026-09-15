import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import { useWorkspace } from '../lib/workspace'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'

export default function Cases() {
  const { organization } = useWorkspace()
  const cases = useQuery(api.cases.listByState, { state: 'active' })

  if (cases === undefined) {
    return <Loading message="Loading cases…" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cases"
        subtitle={`Active enforcement cases for ${organization?.name ?? 'this workspace'}`}
      />

      <div className="app-panel overflow-hidden">
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
            {cases.map((c) => (
              <tr key={c._id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 font-medium">
                  <Link to={`/cases/${c._id}`} className="text-neutral-700 hover:underline">
                    {c.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.state} />
                </td>
                <td className="px-4 py-3 text-neutral-600">{c.severity ?? '—'}</td>
                <td className="px-4 py-3 text-neutral-600">{new Date(c._creationTime).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {cases.length === 0 && (
          <EmptyState
            title="No active cases"
            description="Cases are created from discoveries on the Threat Radar. Run a patrol, then create a case from any finding."
          />
        )}
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
    <span className={`badge ${styles[status] ?? 'bg-neutral-100 text-neutral-700'}`}>
      {status}
    </span>
  )
}
