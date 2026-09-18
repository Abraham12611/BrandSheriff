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
    crawlId: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
    allowlist: v.optional(v.array(v.string())),
  })
    .index("by_org", ["organizationId"])
    .index("by_domain", ["canonicalDomain"]),

  // AI-proposed + user-managed search terms that feed patrol queries.
  // Lifecycle: suggested → (Track) active ⇄ inactive, or → (Dismiss) rejected.
  brandKeywords: defineTable({
    organizationId: v.id("organizations"),
    brandId: v.id("brands"),
    term: v.string(),
    category: v.string(), // brand | product | variant | misspelling | marketplace | custom
    source: v.string(), // "ai" | "user"
    status: v.string(), // "suggested" | "active" | "inactive" | "rejected"
    rationale: v.optional(v.string()),
    hits: v.optional(v.number()),
    lastUsedAt: v.optional(v.number()),
  })
    .index("by_brand", ["brandId"])
    .index("by_brand_status", ["brandId", "status"]),

  brandAssets: defineTable({
    organizationId: v.id("organizations"),
    brandId: v.id("brands"),
    type: v.string(),
    title: v.string(),
    sourceUrl: v.optional(v.string()),
    fileId: v.optional(v.string()),
    imageHash: v.optional(v.string()),
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
    visualMatchScore: v.optional(v.number()),
    matchedAssetId: v.optional(v.id("brandAssets")),
    suspectImageFileId: v.optional(v.string()),
    source: v.optional(v.string()),
    matchedQuery: v.optional(v.string()),
    alertSentAt: v.optional(v.number()),
    // Composite clone-risk score (0-100) + the explainable signal rows that
    // produced it, in `cloneSignals`. Never a legal conclusion — a triage
    // ordering signal.
    cloneScore: v.optional(v.number()),
    cloneScoreComputedAt: v.optional(v.number()),
    offenderId: v.optional(v.id("offenders")),
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

  // One row per recommended enforcement channel for a case — the
  // "attack it from several directions" model. Each row tracks a
  // platform-native complaint through its own lifecycle.
  enforcementActions: defineTable({
    organizationId: v.id("organizations"),
    caseId: v.id("cases"),
    route: v.string(), // channel the complaint goes to (see routes.ts)
    channel: v.string(), // storefront_platform | host | registrar | search | ads | social | marketplace | counsel
    basis: v.string(), // copyright | trademark | counterfeit | impersonation | udrp | design
    status: v.string(), // recommended | prepared | submitted | platform_reviewing | actioned | rejected | counter_notice | withdrawn
    confidence: v.string(), // high | medium | low
    reason: v.string(),
    submissionUrl: v.optional(v.string()),
    requiredFields: v.optional(v.array(v.string())),
    draftId: v.optional(v.id("draftNotices")),
    submittedAt: v.optional(v.number()),
    externalRef: v.optional(v.string()),
    outcome: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_case", ["caseId"])
    .index("by_org_status", ["organizationId", "status"])
    .index("by_case_route", ["caseId", "route"]),

  // Explainable clone-risk signals — one row per detected signal feeding a
  // discovery's cloneScore. Factual observations, not legal conclusions.
  cloneSignals: defineTable({
    organizationId: v.id("organizations"),
    discoveryId: v.id("discoveries"),
    signal: v.string(), // product_image_match | brand_asset_match | description_similarity | domain_impersonation | repeat_offender | keyword_attribution | marketplace_listing | social_account | evidence_strength
    finding: v.string(), // human-readable "3 brand images re-hosted exactly"
    weight: v.number(), // contribution to cloneScore (0-100 scale)
    severity: v.string(), // strong | medium | weak
    detail: v.optional(v.any()),
    computedAt: v.number(),
  })
    .index("by_discovery", ["discoveryId"])
    .index("by_org", ["organizationId"]),

  // Brand Rights Graph — what the business owns: marks, registrations,
  // domains, official accounts, authorized sellers, ad accounts, proof docs.
  rightsObjects: defineTable({
    organizationId: v.id("organizations"),
    brandId: v.id("brands"),
    kind: v.string(), // trademark | copyright_registration | design_right | domain | official_account | authorized_seller | ad_account | proof_document
    label: v.string(),
    value: v.optional(v.string()), // registration no, domain, handle, seller name
    territory: v.optional(v.string()), // US | EU | UK | global | ...
    status: v.string(), // registered | pending | unregistered | active | verified
    fileId: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_brand", ["brandId"])
    .index("by_org_kind", ["organizationId", "kind"]),

  // Offender Graph — entities linking discoveries that look like one
  // operation. v1 links on shared host; shared stolen-asset matches and
  // contact patterns extend it later.
  offenders: defineTable({
    organizationId: v.id("organizations"),
    brandId: v.id("brands"),
    label: v.string(), // primary host / seller name
    status: v.string(), // suspected | confirmed | resolved
    firstSeenAt: v.number(),
    lastSeenAt: v.number(),
    maxCloneScore: v.optional(v.number()),
  })
    .index("by_org", ["organizationId"])
    .index("by_brand", ["brandId"])
    .index("by_org_label", ["organizationId", "label"]),

  offenderLinks: defineTable({
    organizationId: v.id("organizations"),
    offenderId: v.id("offenders"),
    discoveryId: v.id("discoveries"),
    matchType: v.string(), // same_host | shared_image | shared_contact | shared_query
    createdAt: v.number(),
  })
    .index("by_offender", ["offenderId"])
    .index("by_discovery", ["discoveryId"])
    .index("by_offender_discovery", ["offenderId", "discoveryId"]),

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
        // Extracted platform artifacts — ticket/case IDs, deadlines,
        // whether the sender looks like a platform/system address.
        refs: v.optional(v.array(v.string())),
        deadline: v.optional(v.string()),
        platformSender: v.optional(v.boolean()),
      }),
    ),
    eventId: v.optional(v.string()),
    attachments: v.optional(
      v.array(
        v.object({
          attachmentId: v.string(),
          filename: v.optional(v.string()),
          contentType: v.optional(v.string()),
          size: v.optional(v.number()),
          fileId: v.optional(v.string()),
        }),
      ),
    ),
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
