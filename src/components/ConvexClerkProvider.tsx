import { useCallback, useMemo } from 'react'
import { useAuth } from '@clerk/react'
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react'

const AUTH_TIMEOUT_MS = 15_000

function useConvexClerkAuth() {
  const { isLoaded, isSignedIn, getToken } = useAuth()

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      try {
        const token = await Promise.race([
          getToken({ template: 'convex', skipCache: forceRefreshToken }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), AUTH_TIMEOUT_MS)),
        ])
        return token
      } catch {
        return null
      }
    },
    [getToken],
  )

  return useMemo(
    () => ({
      isLoading: !isLoaded,
      isAuthenticated: isSignedIn ?? false,
      fetchAccessToken,
    }),
    [isLoaded, isSignedIn, fetchAccessToken],
  )
}

export default function ConvexClerkProvider({
  children,
  client,
}: {
  children: React.ReactNode
  client: ConvexReactClient
}) {
  return (
    <ConvexProviderWithAuth client={client} useAuth={useConvexClerkAuth}>
      {children}
    </ConvexProviderWithAuth>
  )
}
