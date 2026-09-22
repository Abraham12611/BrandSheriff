import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/react'
import { useConvexAuth } from 'convex/react'
import { SignIn } from '@clerk/react'
import Loading from './Loading'
import BrandMark from './BrandMark'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()
  const { isLoading, isAuthenticated } = useConvexAuth()
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    if (!isSignedIn) {
      setShowHint(false)
      return
    }
    const id = window.setTimeout(() => setShowHint(true), 5000)
    return () => window.clearTimeout(id)
  }, [isSignedIn])

  if (!isLoaded) {
    return <Loading message="Loading BrandSheriff…" />
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-canvas p-6">
        <div className="w-full max-w-sm mb-4 text-center">
          <BrandMark className="w-10 h-10 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-neutral-900">BrandSheriff</h1>
          <p className="text-neutral-600 text-sm mt-2">Sign in to your workspace.</p>
        </div>
        <SignIn routing="hash" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-canvas p-6">
        <div className="w-full max-w-md text-center">
          <h1 className="text-xl font-bold text-neutral-900">Setting up your workspace…</h1>
          <p className="text-neutral-600 mt-3">
            {isLoading
              ? 'Connecting to your secure backend…'
              : 'Could not authenticate with the Convex backend. This usually means the Convex JWT template is missing in Clerk.'}
          </p>
          {showHint && (
            <p className="text-neutral-500 text-sm mt-4">
              In the Clerk Dashboard, activate the <strong>Convex integration</strong> (or create a JWT template named <code className="bg-white px-1 rounded border border-neutral-200">convex</code> with <code className="bg-white px-1 rounded border border-neutral-200">aud: &quot;convex&quot;</code>), then reload this page.
            </p>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
