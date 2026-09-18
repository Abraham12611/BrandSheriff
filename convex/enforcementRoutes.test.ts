import { convexTest, type TestConvexForDataModel } from 'convex-test'
import { DataModelFromSchemaDefinition } from 'convex/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './_generated/api'
import schema from './schema.ts'
import { computeRoutes } from './enforcementRoutes'

const modules = import.meta.glob(['./**/*.ts', './_generated/*.js', '!./**/*.test.ts'])

type TestBackend = TestConvexForDataModel<DataModelFromSchemaDefinition<typeof schema>>

async function setup(t: TestBackend, owner = 'owner_1') {
  const asOwner = t.withIdentity({ subject: owner })
  const organizationId = await asOwner.mutation(api.organizations.create, {
    name: 'Acme',
    slug: 'acme',
  })
  const brandId = await asOwner.mutation(api.brands.create, {
    organizationId: organizationId as any,
    name: 'Acme',
    canonicalDomain: 'https://acme.example',
  })
  return { asOwner, organizationId, brandId }
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network is forbidden in tests'))))
})

describe('computeRoutes (pure)', () => {
  it('recommends storefront + host + search for a standalone clone with image theft', () => {
    const recs = computeRoutes({
      discovery: {
        canonicalUrl: 'https://acme-clearance.shop/products/x',
        visualMatchScore: 0.95,
        similarityScore: 0.8,
      },
      evidenceCount: 3,
      hasPriorCases: false,
    })
    const routes = recs.map((r) => r.def.route)
    expect(routes).toContain('storefront_copyright')
    expect(routes).toContain('host_dmca')
    expect(routes).toContain('search_delisting')
    expect(routes).toContain('cease_desist')
    expect(routes).toContain('registrar_abuse') // "-clearance" in host
    expect(routes).toContain('udrp_assessment')
    expect(routes).not.toContain('marketplace_counterfeit')
    expect(routes).not.toContain('meta_ip')
    const storefront = recs.find((r) => r.def.route === 'storefront_copyright')!
    expect(storefront.confidence).toBe('high') // visual >= 0.9
  })

  it('routes marketplace hosts to the counterfeit route', () => {
    const recs = computeRoutes({
      discovery: { canonicalUrl: 'https://www.ebay.com/itm/123', visualMatchScore: 0.85 },
      evidenceCount: 0,
      hasPriorCases: false,
    })
    const routes = recs.map((r) => r.def.route)
    expect(routes).toContain('marketplace_counterfeit')
    expect(routes).not.toContain('host_dmca')
  })

  it('routes social hosts to Meta/Instagram IP reports', () => {
    const recs = computeRoutes({
      discovery: { canonicalUrl: 'https://www.instagram.com/fakeacme', visualMatchScore: 0.9 },
      evidenceCount: 0,
      hasPriorCases: false,
    })
    const routes = recs.map((r) => r.def.route)
    expect(routes).toContain('instagram_ip')
    expect(routes).not.toContain('storefront_copyright')
  })

  it('adds counsel escalation for repeat offenders', () => {
    const recs = computeRoutes({
      discovery: { canonicalUrl: 'https://clone2.example', visualMatchScore: 0.9 },
      evidenceCount: 1,
      hasPriorCases: true,
    })
    expect(recs.map((r) => r.def.route)).toContain('counsel_escalation')
  })
})

describe('enforcementRoutes functions', () => {
  it('listForCase returns recommendations; ensureForCase materializes them once', async () => {
    const t = convexTest(schema, modules)
    const { asOwner, organizationId, brandId } = await setup(t)
    const discoveryId = await t.run(async (ctx) =>
      ctx.db.insert('discoveries', {
        organizationId: organizationId as any,
        brandId: brandId as any,
        canonicalUrl: 'https://acme-outlet.shop/x',
        status: 'needs_review',
        visualMatchScore: 0.97,
      }),
    )
    const caseId = await asOwner.mutation(api.cases.createFromDiscovery, {
      discoveryId: discoveryId as any,
      title: 'Clone storefront',
    })

    const before = await asOwner.query(api.enforcementRoutes.listForCase, {
      caseId: caseId as any,
      organizationId: organizationId as any,
    })
    expect(before.stored).toHaveLength(0)
    expect(before.recommended.length).toBeGreaterThan(3)
    expect(before.recommended.map((r: any) => r.route)).toContain('host_dmca')

    const ensured = await asOwner.mutation(api.enforcementRoutes.ensureForCase, {
      caseId: caseId as any,
      organizationId: organizationId as any,
    })
    expect(ensured.created).toBeGreaterThan(3)

    const again = await asOwner.mutation(api.enforcementRoutes.ensureForCase, {
      caseId: caseId as any,
      organizationId: organizationId as any,
    })
    expect(again.created).toBe(0)

    const after = await asOwner.query(api.enforcementRoutes.listForCase, {
      caseId: caseId as any,
      organizationId: organizationId as any,
    })
    expect(after.recommended).toHaveLength(0)
    expect(after.stored.length).toBe(ensured.total)
  })

  it('updateStatus transitions an action and stamps submittedAt', async () => {
    const t = convexTest(schema, modules)
    const { asOwner, organizationId, brandId } = await setup(t)
    const discoveryId = await t.run(async (ctx) =>
      ctx.db.insert('discoveries', {
        organizationId: organizationId as any,
        brandId: brandId as any,
        canonicalUrl: 'https://clone.example',
        status: 'needs_review',
        visualMatchScore: 0.99,
      }),
    )
    const caseId = await asOwner.mutation(api.cases.createFromDiscovery, {
      discoveryId: discoveryId as any,
      title: 'Clone',
    })
    await asOwner.mutation(api.enforcementRoutes.ensureForCase, {
      caseId: caseId as any,
      organizationId: organizationId as any,
    })
    const { stored } = await asOwner.query(api.enforcementRoutes.listForCase, {
      caseId: caseId as any,
      organizationId: organizationId as any,
    })
    const target = stored.find((s: any) => s.route === 'host_dmca')
    await asOwner.mutation(api.enforcementRoutes.updateStatus, {
      actionId: target._id,
      status: 'submitted',
      externalRef: 'ticket-42',
    })
    const after = await asOwner.query(api.enforcementRoutes.listForCase, {
      caseId: caseId as any,
      organizationId: organizationId as any,
    })
    const updated = after.stored.find((s: any) => s._id === target._id)
    expect(updated.status).toBe('submitted')
    expect(updated.externalRef).toBe('ticket-42')
    expect(updated.submittedAt).toBeTypeOf('number')
  })

  it('rejects access to another workspace\u2019s case (IDOR guard)', async () => {
    const t = convexTest(schema, modules)
    const first = await setup(t, 'owner_1')
    const second = await setup(t, 'owner_2')
    const discoveryId = await t.run(async (ctx) =>
      ctx.db.insert('discoveries', {
        organizationId: first.organizationId as any,
        brandId: first.brandId as any,
        canonicalUrl: 'https://clone.example',
        status: 'needs_review',
      }),
    )
    const caseId = await first.asOwner.mutation(api.cases.createFromDiscovery, {
      discoveryId: discoveryId as any,
      title: 'Clone',
    })
    await expect(
      second.asOwner.query(api.enforcementRoutes.listForCase, {
        caseId: caseId as any,
        organizationId: second.organizationId as any,
      }),
    ).rejects.toThrow()
  })
})
