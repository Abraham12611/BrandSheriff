import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/react'
import { useConvexAuth } from 'convex/react'
import { SignIn } from '@clerk/react'

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-sm text-neutral-500">Loading BrandSheriff…</div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-6">
        <div className="w-full max-w-sm mb-4 text-center">
          <h1 className="text-2xl font-bold">BrandSheriff</h1>
          <p className="text-neutral-600 text-sm mt-2">Sign in to your workspace.</p>
        </div>
        <SignIn routing="hash" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-6">
        <div className="w-full max-w-md text-center">
          <h1 className="text-xl font-bold">Setting up your workspace…</h1>
          <p className="text-neutral-600 mt-3">
            {isLoading
              ? 'Connecting to your secure backend…'
              : 'Could not authenticate with the Convex backend. This usually means the Convex JWT template is missing in Clerk.'}
          </p>
          {showHint && (
            <p className="text-neutral-500 text-sm mt-4">
              In the Clerk Dashboard, activate the <strong>Convex integration</strong> (or create a JWT template named <code className="bg-neutral-100 px-1 rounded">convex</code> with <code className="bg-neutral-100 px-1 rounded">aud: "convex"</code>), then reload this page.
            </p>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
