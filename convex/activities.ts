import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Activity types for reference
export const ACTIVITY_TYPES = [
  "tool_call",
  "message_sent",
  "task_created",
  "task_completed",
  "file_written",
  "search",
  "decision",
  "error",
] as const;

// List activities with cursor pagination
export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("activities")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 25;

    let q = ctx.db
      .query("activities")
      .withIndex("by_timestamp")
      .order("desc");

    // If cursor provided, start after that item
    const activities = await q.collect();
    
    let startIndex = 0;
    if (args.cursor) {
      const cursorIndex = activities.findIndex((a) => a._id === args.cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const items = activities.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < activities.length;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]._id : null;

    return {
      items,
      hasMore,
      nextCursor,
    };
  },
});

// List activities with filters (agent, type, date range)
export const listFiltered = query({
  args: {
    agentId: v.optional(v.id("agents")),
    type: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("activities")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 25;

    // Start with the appropriate index
    let activities;
    if (args.agentId) {
      activities = await ctx.db
        .query("activities")
        .withIndex("by_agent_timestamp", (q) => q.eq("agentId", args.agentId!))
        .order("desc")
        .collect();
    } else if (args.type) {
      activities = await ctx.db
        .query("activities")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .order("desc")
        .collect();
    } else {
      activities = await ctx.db
        .query("activities")
        .withIndex("by_timestamp")
        .order("desc")
        .collect();
    }

    // Apply additional filters
    let filtered = activities;
    
    if (args.agentId && args.type) {
      // Already filtered by agent, now filter by type
      filtered = filtered.filter((a) => a.type === args.type);
    }
    
    if (args.startDate) {
      filtered = filtered.filter((a) => a.timestamp >= args.startDate!);
    }
    
    if (args.endDate) {
      filtered = filtered.filter((a) => a.timestamp <= args.endDate!);
    }

    // Handle cursor pagination
    let startIndex = 0;
    if (args.cursor) {
      const cursorIndex = filtered.findIndex((a) => a._id === args.cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const items = filtered.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < filtered.length;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]._id : null;

    return {
      items,
      hasMore,
      nextCursor,
      total: filtered.length,
    };
  },
});

// List activities by agent
export const listByAgent = query({
  args: {
    agentId: v.id("agents"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    return await ctx.db
      .query("activities")
      .withIndex("by_agent_timestamp", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(limit);
  },
});

// List activities by type
export const listByType = query({
  args: {
    type: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    return await ctx.db
      .query("activities")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .order("desc")
      .take(limit);
  },
});

// List activities by date range
export const listByDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();

    return activities
      .filter((a) => a.timestamp >= args.startDate && a.timestamp <= args.endDate)
      .slice(0, limit);
  },
});

// Log new activity (public mutation)
export const log = mutation({
  args: {
    agentId: v.id("agents"),
    type: v.string(),
    action: v.string(),
    details: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// Internal log mutation (for HTTP endpoints)
export const logInternal = internalMutation({
  args: {
    agentId: v.id("agents"),
    type: v.string(),
    action: v.string(),
    details: v.optional(v.string()),
    metadata: v.optional(v.any()),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", {
      agentId: args.agentId,
      type: args.type,
      action: args.action,
      details: args.details,
      metadata: args.metadata,
      timestamp: args.timestamp ?? Date.now(),
    });
  },
});

// Log by agent name (resolves name to ID)
export const logByAgentName = mutation({
  args: {
    agentName: v.string(),
    type: v.string(),
    action: v.string(),
    details: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Find agent by name
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.agentName))
      .first();

    if (!agent) {
      throw new Error(`Agent not found: ${args.agentName}`);
    }

    return await ctx.db.insert("activities", {
      agentId: agent._id,
      type: args.type,
      action: args.action,
      details: args.details,
      metadata: args.metadata,
      timestamp: Date.now(),
    });
  },
});

// Get activity stats for an agent
export const getStats = query({
  args: {
    agentId: v.id("agents"),
    since: v.optional(v.number()), // timestamp
  },
  handler: async (ctx, args) => {
    const since = args.since ?? Date.now() - 24 * 60 * 60 * 1000; // default 24h

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_agent_timestamp", (q) => q.eq("agentId", args.agentId))
      .filter((q) => q.gte(q.field("timestamp"), since))
      .collect();

    // Group by type
    const byType: Record<string, number> = {};
    for (const activity of activities) {
      byType[activity.type] = (byType[activity.type] || 0) + 1;
    }

    return {
      total: activities.length,
      byType,
    };
  },
});

// Get global stats
export const getGlobalStats = query({
  args: {
    since: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const since = args.since ?? Date.now() - 24 * 60 * 60 * 1000; // default 24h

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();

    const filtered = activities.filter((a) => a.timestamp >= since);

    // Group by type
    const byType: Record<string, number> = {};
    // Group by agent
    const byAgent: Record<string, number> = {};

    for (const activity of filtered) {
      byType[activity.type] = (byType[activity.type] || 0) + 1;
      const agentKey = activity.agentId.toString();
      byAgent[agentKey] = (byAgent[agentKey] || 0) + 1;
    }

    return {
      total: filtered.length,
      byType,
      byAgent,
    };
  },
});

// Get distinct types in the database
export const getTypes = query({
  args: {},
  handler: async (ctx) => {
    const activities = await ctx.db.query("activities").collect();
    const types = new Set(activities.map((a) => a.type));
    return Array.from(types).sort();
  },
});

// List activities with agent info (enriched for dashboard)
export const listWithAgents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
    
    // Get all agents
    const agents = await ctx.db.query("agents").collect();
    const agentMap = new Map(agents.map((a) => [a._id, a]));
    
    // Enrich with agent data
    return activities.map((activity) => {
      const agent = agentMap.get(activity.agentId);
      return {
        ...activity,
        agent: agent ? {
          name: agent.name,
          emoji: agent.emoji,
          color: agent.color,
        } : null,
      };
    });
  },
});
