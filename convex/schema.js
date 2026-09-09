"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var server_1 = require("convex/server");
var values_1 = require("convex/values");
exports.default = (0, server_1.defineSchema)({
    organizations: (0, server_1.defineTable)({
        name: values_1.v.string(),
        slug: values_1.v.string(),
        ownerUserId: values_1.v.string(),
        plan: values_1.v.optional(values_1.v.string()),
        defaultBrandId: values_1.v.optional(values_1.v.id("brands")),
        settings: values_1.v.optional(values_1.v.any()),
    })
        .index("by_slug", ["slug"])
        .index("by_owner", ["ownerUserId"]),
    organizationMembers: (0, server_1.defineTable)({
        organizationId: values_1.v.id("organizations"),
        userId: values_1.v.string(),
        role: values_1.v.string(),
        status: values_1.v.string(),
    }).index("by_org_user", ["organizationId", "userId"]),
    brands: (0, server_1.defineTable)({
        organizationId: values_1.v.id("organizations"),
        name: values_1.v.string(),
        canonicalDomain: values_1.v.string(),
        description: values_1.v.optional(values_1.v.string()),
        logoFileId: values_1.v.optional(values_1.v.string()),
        status: values_1.v.string(),
        brandDnaStatus: values_1.v.string(),
        lastIndexedAt: values_1.v.optional(values_1.v.number()),
    })
        .index("by_org", ["organizationId"])
        .index("by_domain", ["canonicalDomain"]),
    brandAssets: (0, server_1.defineTable)({
        organizationId: values_1.v.id("organizations"),
        brandId: values_1.v.id("brands"),
        type: values_1.v.string(),
        title: values_1.v.string(),
        sourceUrl: values_1.v.optional(values_1.v.string()),
        fileId: values_1.v.optional(values_1.v.string()),
        textContent: values_1.v.optional(values_1.v.string()),
        status: values_1.v.string(),
        monitorEnabled: values_1.v.boolean(),
    })
        .index("by_brand", ["brandId"])
        .index("by_brand_type", ["brandId", "type"]),
    patrols: (0, server_1.defineTable)({
        organizationId: values_1.v.id("organizations"),
        brandId: values_1.v.id("brands"),
        name: values_1.v.string(),
        type: values_1.v.string(),
        enabled: values_1.v.boolean(),
        config: values_1.v.optional(values_1.v.any()),
    }).index("by_brand", ["brandId"]),
    patrolRuns: (0, server_1.defineTable)({
        patrolId: values_1.v.id("patrols"),
        organizationId: values_1.v.id("organizations"),
        brandId: values_1.v.id("brands"),
        status: values_1.v.string(),
        startedAt: values_1.v.number(),
        completedAt: values_1.v.optional(values_1.v.number()),
    })
        .index("by_patrol", ["patrolId", "startedAt"])
        .index("by_brand_status", ["brandId", "status"]),
    discoveries: (0, server_1.defineTable)({
        organizationId: values_1.v.id("organizations"),
        brandId: values_1.v.id("brands"),
        patrolRunId: values_1.v.optional(values_1.v.id("patrolRuns")),
        canonicalUrl: values_1.v.string(),
        title: values_1.v.optional(values_1.v.string()),
        status: values_1.v.string(),
        severity: values_1.v.optional(values_1.v.string()),
        summary: values_1.v.optional(values_1.v.string()),
    })
        .index("by_org_status", ["organizationId", "status"])
        .index("by_brand_status", ["brandId", "status"])
        .index("by_url", ["canonicalUrl"]),
    cases: (0, server_1.defineTable)({
        organizationId: values_1.v.id("organizations"),
        brandId: values_1.v.id("brands"),
        caseNumber: values_1.v.string(),
        title: values_1.v.string(),
        state: values_1.v.string(),
        severity: values_1.v.optional(values_1.v.string()),
        summary: values_1.v.optional(values_1.v.string()),
        primaryThreatType: values_1.v.optional(values_1.v.string()),
        resolvedAt: values_1.v.optional(values_1.v.number()),
    })
        .index("by_org_state", ["organizationId", "state"])
        .index("by_brand_state", ["brandId", "state"])
        .index("by_case_number", ["caseNumber"]),
    evidenceItems: (0, server_1.defineTable)({
        organizationId: values_1.v.id("organizations"),
        caseId: values_1.v.optional(values_1.v.id("cases")),
        discoveryId: values_1.v.optional(values_1.v.id("discoveries")),
        type: values_1.v.string(),
        title: values_1.v.string(),
        sourceUrl: values_1.v.optional(values_1.v.string()),
        capturedAt: values_1.v.number(),
        contentHash: values_1.v.optional(values_1.v.string()),
    })
        .index("by_case", ["caseId"])
        .index("by_discovery", ["discoveryId"])
        .index("by_source_url", ["sourceUrl"]),
    auditEvents: (0, server_1.defineTable)({
        organizationId: values_1.v.id("organizations"),
        brandId: values_1.v.optional(values_1.v.id("brands")),
        caseId: values_1.v.optional(values_1.v.id("cases")),
        actorType: values_1.v.string(),
        actorId: values_1.v.string(),
        eventType: values_1.v.string(),
        entityType: values_1.v.string(),
        entityId: values_1.v.string(),
        timestamp: values_1.v.number(),
        metadataSafe: values_1.v.optional(values_1.v.any()),
    })
        .index("by_org_time", ["organizationId", "timestamp"])
        .index("by_case_time", ["caseId", "timestamp"]),
});
