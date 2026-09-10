import { Link } from 'react-router-dom'
import { useWorkspace } from '../lib/workspace'
import Loading from './Loading'

export default function WorkspaceRequired({ children }: { children: React.ReactNode }) {
  const { organization, isLoading } = useWorkspace()

  if (isLoading) {
    return <Loading message="Loading workspace…" />
  }

  if (!organization) {
    return (
      <div className="max-w-xl mx-auto app-panel p-8 text-center">
        <h1 className="text-2xl font-bold">Create a workspace first</h1>
        <p className="text-neutral-600 mt-2">
          This area needs a BrandSheriff workspace before you can use it.
        </p>
        <Link
          to="/onboarding"
          className="inline-block mt-6 btn-primary"
        >
          Set up workspace
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
