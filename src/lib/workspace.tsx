import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Doc } from '../../convex/_generated/dataModel'

type WorkspaceContextValue = {
  organization: Doc<'organizations'> | null
  organizations: Doc<'organizations'>[]
  membership: Doc<'organizationMembers'> | null
  isAdmin: boolean
  providerActionsEnabled: boolean
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

  const membership = useQuery(
    api.memberships.getMyMembership,
    activeOrg ? { organizationId: activeOrg._id } : 'skip',
  ) as Doc<'organizationMembers'> | undefined

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

  const value = useMemo<WorkspaceContextValue>(() => {
    const org = activeOrg ?? null
    const settings = (org?.settings ?? {}) as { providerActionsEnabled?: boolean }
    const role = membership?.role
    return {
      organization: org,
      organizations: organizations ?? [],
      membership: membership ?? null,
      isAdmin: role === 'owner' || role === 'admin',
      providerActionsEnabled: !!settings.providerActionsEnabled,
      isLoading: organizations === undefined || (activeOrg !== null && membership === undefined),
      setOrganization: setActiveOrg,
    }
  }, [activeOrg, membership, organizations])

  if (value.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas text-sm text-neutral-500">
        Loading workspaces…
      </div>
    )
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
