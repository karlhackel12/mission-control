import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List activities with pagination
export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    let q = ctx.db
      .query("activities")
      .withIndex("by_timestamp")
      .order("desc");
    
    const activities = await q.take(limit + 1);
    
    const hasMore = activities.length > limit;
    const items = hasMore ? activities.slice(0, limit) : activities;
    
    return {
      items,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]._id : null,
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

// Log new activity
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
