import { convexTest, type TestConvexForDataModel } from 'convex-test'
import { DataModelFromSchemaDefinition } from 'convex/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './_generated/api'
import schema from './schema.ts'

const modules = import.meta.glob(['./**/*.ts', './_generated/*.js', '!./**/*.test.ts'])

type TestBackend = TestConvexForDataModel<DataModelFromSchemaDefinition<typeof schema>>

async function createWorkspace(t: TestBackend, ownerSubject: string, name: string) {
  const asOwner = t.withIdentity({ subject: ownerSubject })
  const organizationId = await asOwner.mutation(api.organizations.create, { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') })
  return { asOwner, organizationId }
}

async function seedBrand(t: TestBackend, organizationId: string, ownerSubject: string, name: string) {
  return await t.withIdentity({ subject: ownerSubject }).mutation(api.brands.create, {
    organizationId: organizationId as any,
    name,
    canonicalDomain: `https://${name.toLowerCase().replace(/\s+/g, '-')}.example`,
  })
}

async function seedDiscovery(t: TestBackend, organizationId: string, brandId: string) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert('discoveries', {
      organizationId: organizationId as any,
      brandId: brandId as any,
      canonicalUrl: 'https://suspect.example',
      status: 'needs_review',
      title: 'Suspect copy',
    })
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network is forbidden in tests'))))
})

describe('Phase 1 workspace authentication and tenant isolation', () => {
  it('rejects anonymous calls with UNAUTHENTICATED', async () => {
    const t = convexTest({ schema, modules })
    await expect(t.mutation(api.organizations.create, { name: 'Test org' }))
      .rejects.toMatchObject({ data: { code: 'UNAUTHENTICATED' } })
    await expect(t.query(api.brands.list, {}))
      .rejects.toMatchObject({ data: { code: 'UNAUTHENTICATED' } })
    await expect(t.query(api.cases.listByState, { state: 'active' }))
      .rejects.toMatchObject({ data: { code: 'UNAUTHENTICATED' } })
  })

  it('returns only workspaces the authenticated user belongs to', async () => {
    const t = convexTest({ schema, modules })
    const { organizationId: orgA } = await createWorkspace(t, 'owner-a', 'Workspace A')
    const { organizationId: orgB } = await createWorkspace(t, 'owner-b', 'Workspace B')

    const forA = await t.withIdentity({ subject: 'owner-a' }).query(api.organizations.list, {})
    expect(forA.map((o: any) => o._id)).toContain(orgA)
    expect(forA.map((o: any) => o._id)).not.toContain(orgB)

    const forB = await t.withIdentity({ subject: 'owner-b' }).query(api.organizations.list, {})
    expect(forB.map((o: any) => o._id)).toContain(orgB)
    expect(forB.map((o: any) => o._id)).not.toContain(orgA)
  })

  it('prevents cross-tenant reads and writes', async () => {
    const t = convexTest({ schema, modules })
    const { asOwner: asA, organizationId: orgA } = await createWorkspace(t, 'owner-a', 'Workspace A')
    const brandA = await seedBrand(t, orgA, 'owner-a', 'Brand A')
    const discoveryA = await seedDiscovery(t, orgA, brandA)

    const { asOwner: asB } = await createWorkspace(t, 'owner-b', 'Workspace B')

    // User B cannot create a brand in org A
    await expect(asB.mutation(api.brands.create, {
      organizationId: orgA as any,
      name: 'Imposter brand',
      canonicalDomain: 'https://imposter.example',
    })).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } })

    // User B cannot read A's discovery
    await expect(asB.query(api.discoveries.get, { discoveryId: discoveryA as any }))
      .rejects.toMatchObject({ data: { code: 'FORBIDDEN' } })

    // User B cannot create a case from A's discovery
    await expect(asB.mutation(api.cases.createFromDiscovery, {
      discoveryId: discoveryA as any,
      title: 'Stolen case',
    })).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } })

    // User A lists only A's brand
    const forA = await asA.query(api.brands.list, {})
    expect(forA.map((b: any) => b._id)).toEqual([brandA])

    // User B lists only B's brand
    const forB = await asB.query(api.brands.list, {})
    expect(forB.map((b: any) => b._id)).not.toContain(brandA)
  })

  it('allows a workspace member to create a brand and a patrol', async () => {
    const t = convexTest({ schema, modules })
    const { asOwner, organizationId } = await createWorkspace(t, 'owner-a', 'Workspace A')
    const brandId = await seedBrand(t, organizationId, 'owner-a', 'Brand A')
    const runId = await asOwner.mutation(api.patrolRuns.start, {
      brandId: brandId as any,
      type: 'brand_name',
    })
    expect(typeof runId).toBe('string')
  })

  it('still blocks paid/provider actions behind the prototype guard', async () => {
    const t = convexTest({ schema, modules })
    const { asOwner, organizationId } = await createWorkspace(t, 'owner-a', 'Workspace A')
    const brandId = await seedBrand(t, organizationId, 'owner-a', 'Brand A')
    const discoveryId = await seedDiscovery(t, organizationId, brandId)

    await expect(asOwner.action(api.brandDna.crawl, { brandId: brandId as any, url: 'https://brand.example' }))
      .rejects.toMatchObject({ data: { code: 'PROTOTYPE_READ_ONLY' } })
    await expect(asOwner.action(api.forensics.investigateDiscovery, { discoveryId: discoveryId as any }))
      .rejects.toMatchObject({ data: { code: 'PROTOTYPE_READ_ONLY' } })

    expect(fetch).not.toHaveBeenCalled()
  })
})
