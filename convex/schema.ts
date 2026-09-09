import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    ownerUserId: v.string(),
    plan: v.optional(v.string()),
    defaultBrandId: v.optional(v.id("brands")),
    mailboxId: v.optional(v.string()),
    mailboxAddress: v.optional(v.string()),
    settings: v.optional(v.any()),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerUserId"]),

  organizationMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.string(),
    role: v.string(),
    status: v.string(),
  }).index("by_org_user", ["organizationId", "userId"]),

  brands: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    canonicalDomain: v.string(),
    description: v.optional(v.string()),
    logoFileId: v.optional(v.string()),
    status: v.string(),
    brandDnaStatus: v.string(),
    lastIndexedAt: v.optional(v.number()),
  })
    .index("by_org", ["organizationId"])
    .index("by_domain", ["canonicalDomain"]),

  brandAssets: defineTable({
    organizationId: v.id("organizations"),
    brandId: v.id("brands"),
    type: v.string(),
    title: v.string(),
    sourceUrl: v.optional(v.string()),
    fileId: v.optional(v.string()),
    textContent: v.optional(v.string()),
    status: v.string(),
    monitorEnabled: v.boolean(),
  })
    .index("by_brand", ["brandId"])
    .index("by_brand_type", ["brandId", "type"]),

  patrols: defineTable({
    organizationId: v.id("organizations"),
    brandId: v.id("brands"),
    name: v.string(),
    type: v.string(),
    enabled: v.boolean(),
    config: v.optional(v.any()),
  }).index("by_brand", ["brandId"]),

  patrolRuns: defineTable({
    patrolId: v.id("patrols"),
    organizationId: v.id("organizations"),
    brandId: v.id("brands"),
    type: v.string(),
    status: v.string(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_patrol", ["patrolId", "startedAt"])
    .index("by_brand_status", ["brandId", "status"]),

  discoveries: defineTable({
    organizationId: v.id("organizations"),
    brandId: v.id("brands"),
    patrolRunId: v.optional(v.id("patrolRuns")),
    canonicalUrl: v.string(),
    title: v.optional(v.string()),
    status: v.string(),
    severity: v.optional(v.string()),
    summary: v.optional(v.string()),
    matchConfidence: v.optional(v.number()),
    identityRisk: v.optional(v.number()),
    authorizationRisk: v.optional(v.number()),
  })
    .index("by_org_status", ["organizationId", "status"])
    .index("by_brand_status", ["brandId", "status"])
    .index("by_url", ["canonicalUrl"]),

  cases: defineTable({
    organizationId: v.id("organizations"),
    brandId: v.id("brands"),
    discoveryId: v.optional(v.id("discoveries")),
    caseNumber: v.string(),
    title: v.string(),
    state: v.string(),
    severity: v.optional(v.string()),
    summary: v.optional(v.string()),
    primaryThreatType: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_org_state", ["organizationId", "state"])
    .index("by_brand_state", ["brandId", "state"])
    .index("by_case_number", ["caseNumber"]),

  evidenceItems: defineTable({
    organizationId: v.id("organizations"),
    caseId: v.optional(v.id("cases")),
    discoveryId: v.optional(v.id("discoveries")),
    type: v.string(),
    title: v.string(),
    sourceUrl: v.optional(v.string()),
    capturedAt: v.number(),
    contentHash: v.optional(v.string()),
    textContent: v.optional(v.string()),
  })
    .index("by_case", ["caseId"])
    .index("by_discovery", ["discoveryId"])
    .index("by_source_url", ["sourceUrl"]),

  draftNotices: defineTable({
    organizationId: v.id("organizations"),
    caseId: v.id("cases"),
    routeType: v.string(),
    status: v.string(),
    structuredFields: v.optional(v.any()),
    body: v.optional(v.string()),
    generatedBy: v.optional(v.string()),
    version: v.optional(v.number()),
    readiness: v.optional(v.string()),
    warnings: v.optional(v.array(v.string())),
    outboundId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_case", ["caseId"]),

  approvals: defineTable({
    organizationId: v.id("organizations"),
    caseId: v.id("cases"),
    objectType: v.string(),
    objectId: v.string(),
    action: v.string(),
    approvedByUserId: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    snapshotBody: v.optional(v.string()),
    snapshotSubject: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_object", ["objectType", "objectId"])
    .index("by_case", ["caseId"]),

  rechecks: defineTable({
    organizationId: v.id("organizations"),
    caseId: v.id("cases"),
    targetUrl: v.string(),
    purpose: v.string(),
    status: v.string(),
    availability: v.optional(v.string()),
    comparisonResult: v.optional(v.string()),
    checkedAt: v.number(),
  }).index("by_case", ["caseId"]),

  hydraWatches: defineTable({
    organizationId: v.id("organizations"),
    brandId: v.id("brands"),
    caseId: v.id("cases"),
    fingerprint: v.any(),
    enabled: v.boolean(),
    lastRunAt: v.optional(v.number()),
  }).index("by_case", ["caseId"]),

  auditEvents: defineTable({
    organizationId: v.id("organizations"),
    brandId: v.optional(v.id("brands")),
    caseId: v.optional(v.id("cases")),
    actorType: v.string(),
    actorId: v.string(),
    eventType: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    timestamp: v.number(),
    metadataSafe: v.optional(v.any()),
  })
    .index("by_org_time", ["organizationId", "timestamp"])
    .index("by_case_time", ["caseId", "timestamp"]),
});
