import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Doc } from '../../convex/_generated/dataModel'


type WorkspaceContextValue = {
  organization: Doc<'organizations'> | null
  organizations: Doc<'organizations'>[]
  isLoading: boolean
  setOrganization: (org: Doc<'organizations'>) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error('useWorkspace must be used inside <WorkspaceProvider>')
  }
  return ctx
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const organizations = useQuery(api.organizations.list) as Doc<'organizations'>[] | undefined
  const [activeOrg, setActiveOrg] = useState<Doc<'organizations'> | null>(null)

  useEffect(() => {
    if (organizations === undefined) return

    if (organizations.length === 0) {
      setActiveOrg(null)
      return
    }

    setActiveOrg((prev: Doc<'organizations'> | null) => {
      if (prev && organizations.some((org) => org._id === prev._id)) {
        return prev
      }
      return organizations[0]
    })
  }, [organizations])

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      organization: activeOrg ?? null,
      organizations: organizations ?? [],
      isLoading: organizations === undefined,
      setOrganization: setActiveOrg,
    }),
    [activeOrg, organizations],
  )

  if (value.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-sm text-neutral-500">
        Loading workspaces…
      </div>
    )
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
