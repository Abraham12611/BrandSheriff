import { convexTest, type TestConvexForDataModel } from 'convex-test'
import { DataModelFromSchemaDefinition } from 'convex/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './_generated/api'
import schema from './schema.ts'

const modules = import.meta.glob(['./**/*.ts', './_generated/*.js', '!./**/*.test.ts'])

type TestBackend = TestConvexForDataModel<DataModelFromSchemaDefinition<typeof schema>>

async function seed(t: TestBackend) {
  return t.run(async (ctx) => {
    const organizationId = await ctx.db.insert('organizations', {
      name: 'Test workspace',
      slug: 'test',
      ownerUserId: 'test-owner',
      mailboxId: 'test-inbox',
      settings: { providerActionsEnabled: false },
    })
    await ctx.db.insert('organizationMembers', {
      organizationId,
      userId: 'test-owner',
      role: 'owner',
      status: 'active',
      createdAt: 1,
      updatedAt: 1,
    })
    const brandId = await ctx.db.insert('brands', {
      organizationId,
      name: 'Test brand',
      canonicalDomain: 'https://brand.example',
      status: 'active',
      brandDnaStatus: 'pending',
    })
    const patrolId = await ctx.db.insert('patrols', {
      organizationId,
      brandId,
      name: 'Test patrol',
      type: 'brand_name',
      enabled: true,
    })
    const runId = await ctx.db.insert('patrolRuns', {
      organizationId,
      brandId,
      patrolId,
      type: 'brand_name',
      status: 'queued',
      startedAt: 1,
    })
    const discoveryId = await ctx.db.insert('discoveries', {
      organizationId,
      brandId,
      canonicalUrl: 'https://suspect.example',
      status: 'needs_review',
    })
    const caseId = await ctx.db.insert('cases', {
      organizationId,
      brandId,
      discoveryId,
      caseNumber: 'BS-TEST',
      title: 'Test case',
      state: 'active',
    })
    const draftId = await ctx.db.insert('draftNotices', {
      organizationId,
      caseId,
      routeType: 'email',
      status: 'draft',
      body: 'Test body',
      structuredFields: { subject: 'Test subject' },
      createdAt: 1,
      updatedAt: 1,
    })
    const watchId = await ctx.db.insert('hydraWatches', {
      organizationId,
      brandId,
      caseId,
      fingerprint: {},
      enabled: true,
    })
    return { organizationId, brandId, runId, discoveryId, caseId, draftId, watchId, patrolId }
  })
}

type SeedIds = Awaited<ReturnType<typeof seed>>

const providerOperations: Array<{ name: string; run: (t: TestBackend, ids: SeedIds) => Promise<unknown> }> = [
  { name: 'crawl', run: (t, ids) => t.action(api.brandDna.crawl, { brandId: ids.brandId, url: 'https://brand.example' }) },
  { name: 'search', run: (t, ids) => t.action(api.patrol.runSearch, { runId: ids.runId, brandId: ids.brandId, queries: ['test'] }) },
  { name: 'investigate', run: (t, ids) => t.action(api.forensics.investigateDiscovery, { discoveryId: ids.discoveryId }) },
  { name: 'generate draft', run: (t, ids) => t.action(api.enforcement.generateDraft, { caseId: ids.caseId }) },
  { name: 'send', run: (t, ids) => t.action(api.enforcement.approveAndSend, { caseId: ids.caseId, draftId: ids.draftId, to: 'recipient@example.com' }) },
  { name: 'connect mailbox', run: (t, ids) => t.action(api.mail.resolveInbox, { organizationId: ids.organizationId }) },
  { name: 'verify', run: (t, ids) => t.action(api.verification.recheckTarget, { caseId: ids.caseId }) },
  { name: 'run watch', run: (t, ids) => t.action(api.hydra.runWatch, { watchId: ids.watchId }) },
]

async function snapshot(t: TestBackend) {
  return t.run(async (ctx) => {
    const tables = [
      'organizations', 'brands', 'patrols', 'patrolRuns', 'discoveries', 'cases',
      'draftNotices', 'approvals', 'hydraWatches', 'rechecks', 'evidenceItems', 'auditEvents',
    ] as const
    return Promise.all(tables.map((table) => ctx.db.query(table).collect()))
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network is forbidden in safety tests'))))
})

describe.each(['anonymous', 'authenticated'] as const)('provider action containment: %s caller', (caller) => {
  it.each(providerOperations)('blocks $name before side effects', async ({ run }) => {
    const backend = convexTest({ schema, modules })
    const ids = await seed(backend)
    const before = await snapshot(backend)
    const t = caller === 'authenticated' ? backend.withIdentity({ subject: 'test-owner' }) : backend

    await expect(run(t, ids)).rejects.toMatchObject({ data: { code: caller === 'authenticated' ? 'PROVIDER_ACTIONS_DISABLED' : 'UNAUTHENTICATED' } })
    expect(await snapshot(backend)).toEqual(before)
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('demo data seeding containment', () => {
  it('blocks demo workspace seeding', async () => {
    const backend = convexTest({ schema, modules })
    await expect(backend.withIdentity({ subject: 'test-owner' }).mutation(api.seed.loadDemoWorkspace, { demoBaseUrl: 'https://demo.example' }))
      .rejects.toMatchObject({ data: { code: 'DEMO_SEEDING_DISABLED' } })
  })
})
