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
    mailboxPodId: v.optional(v.string()),
    mailboxWebhookId: v.optional(v.string()),
    mailboxProvisionedAt: v.optional(v.number()),
    settings: v.optional(v.any()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerUserId"])
    .index("by_mailbox", ["mailboxId"]),

  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    lastSeenAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  organizationMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.string(),
    role: v.string(),
    status: v.string(),
    invitedBy: v.optional(v.string()),
    notificationPrefs: v.optional(v.record(v.string(), v.boolean())),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_org_user", ["organizationId", "userId"])
    .index("by_user", ["userId"])
    .index("by_org", ["organizationId"]),

  invitations: defineTable({
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.string(),
    token: v.string(),
    status: v.string(),
    invitedBy: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_email", ["email"])
    .index("by_token", ["token"]),

  domainVerifications: defineTable({
    organizationId: v.id("organizations"),
    domain: v.string(),
    status: v.string(),
    token: v.optional(v.string()),
    verifiedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_domain", ["domain"]),

  brands: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    canonicalDomain: v.string(),
    description: v.optional(v.string()),
    logoFileId: v.optional(v.string()),
    status: v.string(),
    brandDnaStatus: v.string(),
    lastIndexedAt: v.optional(v.number()),
    keywords: v.optional(v.array(v.string())),
    allowlist: v.optional(v.array(v.string())),
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
    platformGuess: v.optional(v.string()),
    similarityScore: v.optional(v.number()),
    estimatedRevenueImpact: v.optional(v.number()),
    source: v.optional(v.string()),
    priority: v.optional(v.string()),
    denialReason: v.optional(v.string()),
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
  })
    .index("by_org", ["organizationId"])
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
    contactRoutes: v.optional(v.array(v.any())),
    contactResearchedAt: v.optional(v.number()),
    enforcementWorkflowId: v.optional(v.string()),
    enforcementWorkflowStatus: v.optional(v.string()),
    enforcementWorkflowStartedAt: v.optional(v.number()),
    interactScrapeId: v.optional(v.string()),
    interactLiveUrl: v.optional(v.string()),
    interactTakeoverUrl: v.optional(v.string()),
    interactSessionExpiresAt: v.optional(v.number()),
  })
    .index("by_org", ["organizationId"])
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
    fileId: v.optional(v.string()),
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
    threadId: v.optional(v.string()),
    sentTo: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_case", ["caseId"])
    .index("by_outbound", ["outboundId"])
    .index("by_thread", ["threadId"]),

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
    caseId: v.optional(v.id("cases")),
    discoveryId: v.optional(v.id("discoveries")),
    fingerprint: v.any(),
    enabled: v.boolean(),
    lastRunAt: v.optional(v.number()),
    monitorId: v.optional(v.string()),
    webhookToken: v.optional(v.string()),
    monitorError: v.optional(v.string()),
    lastCheckAt: v.optional(v.number()),
    lastCheckStatus: v.optional(v.string()),
    lastChangeAt: v.optional(v.number()),
    lastChangeSummary: v.optional(v.string()),
  })
    .index("by_case", ["caseId"])
    .index("by_discovery", ["discoveryId"])
    .index("by_webhook_token", ["webhookToken"]),

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

  webhookSecrets: defineTable({
    scope: v.string(),
    webhookId: v.string(),
    secret: v.string(),
    createdAt: v.number(),
  }).index("by_scope", ["scope"]),

  caseMessages: defineTable({
    organizationId: v.id("organizations"),
    caseId: v.optional(v.id("cases")),
    threadId: v.optional(v.string()),
    messageId: v.optional(v.string()),
    direction: v.string(),
    fromAddr: v.string(),
    toAddrs: v.array(v.string()),
    subject: v.optional(v.string()),
    text: v.optional(v.string()),
    preview: v.optional(v.string()),
    classification: v.optional(v.string()),
    classificationSource: v.optional(v.string()),
    classificationDetail: v.optional(
      v.object({
        intent: v.string(),
        confidence: v.number(),
        summary: v.string(),
        model: v.string(),
        classifiedAt: v.number(),
      }),
    ),
    eventId: v.optional(v.string()),
    receivedAt: v.number(),
    readAt: v.optional(v.number()),
  })
    .index("by_case", ["caseId"])
    .index("by_org", ["organizationId"]),

  notifications: defineTable({
    organizationId: v.id("organizations"),
    type: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    caseId: v.optional(v.id("cases")),
    href: v.optional(v.string()),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  }).index("by_org", ["organizationId"]),

  scanResults: defineTable({
    domain: v.string(),
    token: v.string(),
    sourceUrl: v.string(),
    scannedBrand: v.optional(v.string()),
    suspects: v.array(v.any()),
    scannedAt: v.number(),
  })
    .index("by_domain", ["domain"])
    .index("by_token", ["token"]),

  reports: defineTable({
    organizationId: v.id("organizations"),
    brandId: v.optional(v.id("brands")),
    title: v.string(),
    rangeFrom: v.number(),
    rangeTo: v.number(),
    sections: v.array(v.string()),
    snapshot: v.any(),
    token: v.string(),
    createdBy: v.string(),
    createdByName: v.optional(v.string()),
    createdAt: v.number(),
    revokedAt: v.optional(v.number()),
  })
    .index("by_org", ["organizationId"])
    .index("by_token", ["token"]),
});
