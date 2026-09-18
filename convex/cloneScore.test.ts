import { convexTest, type TestConvexForDataModel } from 'convex-test'
import { DataModelFromSchemaDefinition } from 'convex/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api, internal } from './_generated/api'
import schema from './schema.ts'
import { computeSignals, scoreFromSignals } from './cloneScore'

const modules = import.meta.glob(['./**/*.ts', './_generated/*.js', '!./**/*.test.ts'])

type TestBackend = TestConvexForDataModel<DataModelFromSchemaDefinition<typeof schema>>

async function setup(t: TestBackend) {
  const asOwner = t.withIdentity({ subject: 'owner_1' })
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

describe('computeSignals', () => {
  it('scores an exact image re-host as the dominant signal', () => {
    const signals = computeSignals({
      discovery: {
        canonicalUrl: 'https://acme-outlet.shop/x',
        visualMatchScore: 0.98,
        matchedAssetId: 'asset_1',
      },
      evidenceCount: 0,
      relatedCount: 1,
      brandAssetCount: 5,
    })
    const names = signals.map((s) => s.signal)
    expect(names).toContain('product_image_match')
    expect(names).toContain('brand_asset_match')
    expect(names).toContain('domain_impersonation')
    const img = signals.find((s) => s.signal === 'product_image_match')!
    expect(img.severity).toBe('strong')
    expect(img.weight).toBeGreaterThan(40)
  })

  it('flags repeat offenders and marketplace listings', () => {
    const signals = computeSignals({
      discovery: { canonicalUrl: 'https://www.ebay.com/itm/99' },
      evidenceCount: 0,
      relatedCount: 4,
      brandAssetCount: 2,
    })
    const names = signals.map((s) => s.signal)
    expect(names).toContain('repeat_offender')
    expect(names).toContain('marketplace_listing')
  })

  it('caps the composite at 100 and stays factual', () => {
    const signals = computeSignals({
      discovery: {
        canonicalUrl: 'https://fake-official-acme.shop',
        visualMatchScore: 1,
        similarityScore: 1,
        matchedAssetId: 'a',
        matchedQuery: 'acme outlet',
      },
      evidenceCount: 10,
      relatedCount: 6,
      brandAssetCount: 3,
    })
    expect(scoreFromSignals(signals)).toBe(100)
    for (const s of signals) {
      expect(s.finding.length).toBeGreaterThan(5)
      expect(s.finding).not.toMatch(/illegal|infring|guilty/i)
    }
  })
})

describe('cloneScore pipeline + offender graph', () => {
  it('compute writes signal rows + score; upsert links the discovery to an offender', async () => {
    const t = convexTest(schema, modules)
    const { asOwner, organizationId, brandId } = await setup(t)
    const assetId = await t.run(async (ctx) =>
      ctx.db.insert('brandAssets', {
        organizationId: organizationId as any,
        brandId: brandId as any,
        type: 'image',
        title: 'duffel.jpg',
        imageHash: 'ff'.repeat(32),
        status: 'active',
        monitorEnabled: true,
      }),
    )
    const discoveryId = await t.run(async (ctx) =>
      ctx.db.insert('discoveries', {
        organizationId: organizationId as any,
        brandId: brandId as any,
        canonicalUrl: 'https://acme-clearance.shop/a',
        status: 'needs_review',
        visualMatchScore: 0.97,
        matchedAssetId: assetId,
      }),
    )

    await t.action(internal.cloneScore.compute, { discoveryId })
    const scored = await t.run(async (ctx) => ctx.db.get('discoveries', discoveryId))
    expect(scored?.cloneScore).toBeGreaterThan(50)

    const signals = await asOwner.query(api.cloneScore.listSignals, {
      discoveryId,
      organizationId: organizationId as any,
    })
    expect(signals.length).toBeGreaterThan(0)
    expect(signals.some((s: any) => s.signal === 'product_image_match')).toBe(true)

    await t.mutation(internal.offenders.upsertForDiscovery, { discoveryId })
    const linked = await t.run(async (ctx) => ctx.db.get('discoveries', discoveryId))
    expect(linked?.offenderId).toBeTruthy()

    const networks = await asOwner.query(api.offenders.listForOrg, {
      organizationId: organizationId as any,
    })
    expect(networks).toHaveLength(1)
    expect(networks[0].label).toBe('acme-clearance.shop')
    expect(networks[0].discoveryCount).toBe(1)

    // Second discovery on the same host joins the same offender.
    const d2 = await t.run(async (ctx) =>
      ctx.db.insert('discoveries', {
        organizationId: organizationId as any,
        brandId: brandId as any,
        canonicalUrl: 'https://acme-clearance.shop/b',
        status: 'needs_review',
      }),
    )
    await t.mutation(internal.offenders.upsertForDiscovery, { discoveryId: d2 })
    const networks2 = await asOwner.query(api.offenders.listForOrg, {
      organizationId: organizationId as any,
    })
    expect(networks2).toHaveLength(1)
    expect(networks2[0].discoveryCount).toBe(2)
  })

  it('rights vault CRUD + coverage gaps', async () => {
    const t = convexTest(schema, modules)
    const { asOwner, organizationId, brandId } = await setup(t)
    const cov0 = await asOwner.query(api.rights.coverage, {
      brandId: brandId as any,
      organizationId: organizationId as any,
    })
    expect(cov0.registeredMarks).toBe(0)
    expect(cov0.gaps.some((g: string) => g.includes('trademark'))).toBe(true)

    await asOwner.mutation(api.rights.add, {
      organizationId: organizationId as any,
      brandId: brandId as any,
      kind: 'trademark',
      label: 'ACME word mark',
      value: 'US-12345',
      territory: 'US',
      status: 'registered',
    })
    const cov1 = await asOwner.query(api.rights.coverage, {
      brandId: brandId as any,
      organizationId: organizationId as any,
    })
    expect(cov1.registeredMarks).toBe(1)
    expect(cov1.territories).toContain('US')
    expect(cov1.gaps.some((g: string) => g.includes('No registered trademark'))).toBe(false)
  })
})
