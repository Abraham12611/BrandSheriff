import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider, useAuth } from '@clerk/react'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import App from './App.tsx'
import './index.css'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

function AuthNotConfigured() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold">BrandSheriff</h1>
        <p className="text-neutral-600 mt-4">
          Authentication is required but the Clerk publishable key is not configured.
        </p>
        <p className="text-neutral-500 text-sm mt-2">
          Set <code className="bg-neutral-100 px-1 rounded">VITE_CLERK_PUBLISHABLE_KEY</code> in your local environment and restart the dev server.
        </p>
      </div>
    </div>
  )
}

function Root() {
  if (!publishableKey) {
    return <AuthNotConfigured />
  }
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <App />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
