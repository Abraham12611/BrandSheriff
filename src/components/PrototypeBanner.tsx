import { useWorkspace } from '../lib/workspace'

export default function PrototypeBanner() {
  const { providerActionsEnabled } = useWorkspace()
  if (providerActionsEnabled) return null
  return (
    <div
      role="alert"
      className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-sm text-amber-800"
    >
      <span className="font-semibold">Development environment.</span>{' '}
      Authentication, workspace tenancy, and provider-action controls are active.
      Provider calls still require an owner/admin to enable them for the workspace
      and can call live paid APIs. Do not add company data or treat unverified
      case data as verified.
    </div>
  )
}
