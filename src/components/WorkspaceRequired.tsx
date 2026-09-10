import { Link } from 'react-router-dom'
import { useWorkspace } from '../lib/workspace'

export default function WorkspaceRequired({ children }: { children: React.ReactNode }) {
  const { organization, isLoading } = useWorkspace()

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-sm text-neutral-500">
        Loading workspace…
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-lg border border-neutral-200 p-8 text-center">
        <h1 className="text-2xl font-bold">Create a workspace first</h1>
        <p className="text-neutral-600 mt-2">
          This area needs a BrandSheriff workspace before you can use it.
        </p>
        <Link
          to="/onboarding"
          className="inline-block mt-6 px-4 py-2 bg-neutral-900 text-white rounded-md text-sm font-medium hover:bg-neutral-800"
        >
          Set up workspace
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
