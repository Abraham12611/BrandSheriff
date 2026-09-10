import { useConvexAuth } from 'convex/react'
import { SignIn } from '@clerk/react'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-sm text-neutral-500">Loading BrandSheriff…</div>
      </div>
    )
  }

  if (!isAuthenticated) {
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

  return <>{children}</>
}
