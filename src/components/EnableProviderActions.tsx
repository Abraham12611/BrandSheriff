import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useWorkspace } from '../lib/workspace'
import { AlertCircle } from 'lucide-react'

export default function EnableProviderActions() {
  const { organization, isAdmin, providerActionsEnabled } = useWorkspace()
  const enable = useMutation(api.organizations.enableProviderActions)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (providerActionsEnabled) return null

  const handleEnable = async () => {
    if (!organization) return
    setLoading(true)
    setError(null)
    try {
      await enable({ organizationId: organization._id })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable provider actions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-panel p-5 border-l-4 border-amber-500 mb-6" role="status">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h3 className="font-semibold text-neutral-900">Provider actions are disabled</h3>
          <p className="text-sm text-neutral-600 mt-1">
            Paid provider calls (Firecrawl, OpenAI, AgentMail) are disabled for this workspace until an owner or admin explicitly enables them.
          </p>
          {error && <p className="text-sm text-rose-700 mt-2">{error}</p>}
          {isAdmin ? (
            <button
              onClick={handleEnable}
              disabled={loading}
              className="btn-primary mt-3"
            >
              {loading ? 'Enabling…' : 'Enable provider actions'}
            </button>
          ) : (
            <p className="text-sm text-neutral-500 mt-2">
              Ask a workspace owner or admin to enable this feature.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
