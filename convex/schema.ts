import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Agents table - represents each AI agent in the squad
  agents: defineTable({
    name: v.string(),
    emoji: v.string(),
    role: v.string(),
    color: v.string(),
    badge: v.optional(v.string()),
    openclawAgentId: v.optional(v.string()),
    isActive: v.boolean(),
    lastSeenAt: v.optional(v.number()), // Heartbeat timestamp for status display
    createdAt: v.number(),
  })
    .index("by_openclaw_id", ["openclawAgentId"])
    .index("by_name", ["name"]),

  // Activities table - log every agent action
  activities: defineTable({
    agentId: v.id("agents"),
    type: v.string(), // "task", "cron", "message", "memory", "web", etc
    action: v.string(), // "created", "completed", "sent", "searched", etc
    details: v.optional(v.string()),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_agent", ["agentId"])
    .index("by_type", ["type"])
    .index("by_timestamp", ["timestamp"])
    .index("by_agent_timestamp", ["agentId", "timestamp"]),

  // Tasks table - todos and tasks for the squad
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("backlog"),
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("done"),
      v.literal("cancelled")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    product: v.optional(v.string()), // "hellopeople", "transforce", "golance", etc
    assignedTo: v.optional(v.id("agents")),
    scheduledFor: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    tags: v.array(v.string()),
    createdBy: v.optional(v.id("agents")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_assigned", ["assignedTo"])
    .index("by_product", ["product"])
    .index("by_scheduled", ["scheduledFor"])
    .index("by_due", ["dueDate"]),

  // Messages table - squad chat messages
  messages: defineTable({
    agentId: v.id("agents"),
    content: v.string(),
    replyTo: v.optional(v.id("messages")),
    taskRef: v.optional(v.string()),
    isHuman: v.optional(v.boolean()),
    messageType: v.optional(v.union(
      v.literal("message"),
      v.literal("discussion_prompt"),
      v.literal("discussion_response"),
      v.literal("system")
    )),
    timestamp: v.number(),
  })
    .index("by_agent", ["agentId"])
    .index("by_timestamp", ["timestamp"]),

  // Cron jobs table - synced from OpenClaw
  cronJobs: defineTable({
    openclawId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    schedule: v.string(), // cron expression or description
    product: v.optional(v.string()), // "hellopeople", "transforce", "golance", etc
    agentId: v.optional(v.id("agents")),
    payload: v.optional(v.any()),
    nextRunAtMs: v.optional(v.number()),
    lastRunAtMs: v.optional(v.number()),
    lastStatus: v.optional(v.union(
      v.literal("success"),
      v.literal("failure"),
      v.literal("running")
    )),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_openclaw_id", ["openclawId"])
    .index("by_agent", ["agentId"])
    .index("by_next_run", ["nextRunAtMs"])
    .index("by_product", ["product"]),

  // Memories table - with vector search support
  memories: defineTable({
    content: v.string(),
    category: v.union(
      v.literal("preference"),
      v.literal("fact"),
      v.literal("decision"),
      v.literal("entity"),
      v.literal("other")
    ),
    agentId: v.optional(v.id("agents")),
    embedding: v.optional(v.array(v.float64())),
    createdAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_agent", ["agentId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536, // OpenAI ada-002
      filterFields: ["category"],
    }),

  // Sessions table - synced from OpenClaw gateway
  sessions: defineTable({
    sessionId: v.string(), // OpenClaw session ID (e.g., "agent:main:main")
    agentId: v.optional(v.id("agents")),
    agentName: v.string(), // OpenClaw agent name
    channel: v.optional(v.string()), // "whatsapp", "discord", "telegram", etc.
    status: v.union(
      v.literal("active"),
      v.literal("idle"),
      v.literal("sleeping"),
      v.literal("terminated")
    ),
    model: v.optional(v.string()), // Current model being used
    lastActivityAt: v.number(),
    startedAt: v.number(),
    metadata: v.optional(v.any()), // Extra session info
  })
    .index("by_session_id", ["sessionId"])
    .index("by_agent", ["agentId"])
    .index("by_agent_name", ["agentName"])
    .index("by_status", ["status"])
    .index("by_last_activity", ["lastActivityAt"]),

  // Recurring tasks table - for task queue with retry support
  recurringTasks: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    schedule: v.string(), // cron expression
    agentId: v.optional(v.id("agents")),
    payload: v.optional(v.any()),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("failed"),
      v.literal("completed")
    ),
    retryCount: v.number(),
    maxRetries: v.number(),
    lastRunAt: v.optional(v.number()),
    lastStatus: v.optional(v.union(
      v.literal("success"),
      v.literal("failure"),
      v.literal("running"),
      v.literal("skipped")
    )),
    lastError: v.optional(v.string()),
    nextRunAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_agent", ["agentId"])
    .index("by_next_run", ["nextRunAt"])
    .index("by_name", ["name"]),
});
