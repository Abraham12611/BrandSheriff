import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from 'convex/react'
import { useOrganization } from '@clerk/react'
import { api } from '../../convex/_generated/api'
import { useWorkspace } from '../lib/workspace'
import PageHeader from '../components/PageHeader'
import type { Id } from '../../convex/_generated/dataModel'

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ''
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { organization } = useWorkspace()
  const clerkOrg = useOrganization().organization

  const [workspaceName, setWorkspaceName] = useState(clerkOrg?.name ?? '')
  const [workspaceSlug, setWorkspaceSlug] = useState(slugify(clerkOrg?.name ?? ''))
  const [brandName, setBrandName] = useState('')
  const [canonicalDomain, setCanonicalDomain] = useState('')
  const [organizationId, setOrganizationId] = useState<Id<'organizations'> | null>(organization?._id ?? null)
  const [step, setStep] = useState<'workspace' | 'brand'>(organization ? 'brand' : 'workspace')
  const [creatingNewWorkspace, setCreatingNewWorkspace] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createWorkspace = useMutation(api.organizations.create)
  const createBrand = useMutation(api.brands.create)

  useEffect(() => {
    if (organization && !creatingNewWorkspace) {
      setOrganizationId(organization._id)
      setStep('brand')
    }
  }, [organization, creatingNewWorkspace])

  useEffect(() => {
    if (clerkOrg?.name) {
      setWorkspaceName(clerkOrg.name)
      setWorkspaceSlug(slugify(clerkOrg.name))
    }
  }, [clerkOrg?.name])

  const onWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const id = await createWorkspace({ name: workspaceName, slug: workspaceSlug })
      setOrganizationId(id)
      setStep('brand')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace')
    } finally {
      setSubmitting(false)
    }
  }

  const onBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organizationId) return
    setError(null)
    setSubmitting(true)
    try {
      await createBrand({
        organizationId,
        name: brandName,
        canonicalDomain: canonicalDomain,
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add brand')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto app-panel p-8">
      <PageHeader
        title="Set up your BrandSheriff workspace"
        subtitle={
          step === 'workspace'
            ? 'Create the workspace that will own your brands and cases.'
            : 'Add a brand you want to protect. You can add more later.'
        }
      />

      {error && (
        <div className="mt-6 p-4 bg-rose-50 text-rose-700 rounded-lg text-sm">{error}</div>
      )}

      {step === 'brand' && organization && !creatingNewWorkspace && (
        <p className="mt-4 text-sm text-neutral-600">
          Adding to workspace <span className="font-medium text-neutral-900">{organization.name}</span>.{' '}
          <button
            type="button"
            onClick={() => {
              setCreatingNewWorkspace(true)
              setOrganizationId(null)
              setStep('workspace')
            }}
            className="text-violet-700 hover:text-violet-800 font-medium"
          >
            Create a new workspace instead
          </button>
        </p>
      )}

      {step === 'workspace' ? (
        <form className="mt-6 space-y-4" onSubmit={onWorkspaceSubmit}>
          <div>
            <label htmlFor="workspaceName" className="block text-sm font-medium text-neutral-700">Workspace name</label>
            <input
              id="workspaceName"
              value={workspaceName}
              onChange={(e) => {
                setWorkspaceName(e.target.value)
                setWorkspaceSlug(slugify(e.target.value))
              }}
              required
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              placeholder="Northstar Holdings"
            />
          </div>
          <div>
            <label htmlFor="workspaceSlug" className="block text-sm font-medium text-neutral-700">Workspace slug</label>
            <input
              id="workspaceSlug"
              value={workspaceSlug}
              onChange={(e) => setWorkspaceSlug(slugify(e.target.value))}
              required
              pattern="^[a-z0-9-]+$"
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              placeholder="northstar-holdings"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !workspaceName.trim() || !workspaceSlug.trim()}
            className="btn-primary"
          >
            {submitting ? 'Creating…' : 'Create workspace'}
          </button>
        </form>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={onBrandSubmit}>
          <div>
            <label htmlFor="brandName" className="block text-sm font-medium text-neutral-700">Brand name</label>
            <input
              id="brandName"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              placeholder="Northstar Atelier"
            />
          </div>
          <div>
            <label htmlFor="canonicalDomain" className="block text-sm font-medium text-neutral-700">Official domain</label>
            <input
              id="canonicalDomain"
              value={canonicalDomain}
              onChange={(e) => setCanonicalDomain(e.target.value)}
              required
              type="url"
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              placeholder="https://northstaratelier.com"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || !brandName.trim() || !canonicalDomain.trim()}
              className="btn-primary"
            >
              {submitting ? 'Adding…' : 'Add brand'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
            >
              Skip for now
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
