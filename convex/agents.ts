import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all agents
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("agents")
      .order("asc")
      .collect();
  },
});

// List only active agents
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query("agents").collect();
    return agents.filter((a) => a.isActive);
  },
});

// Get agent by ID
export const getById = query({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get agent by OpenClaw ID
export const getByOpenclawId = query({
  args: { openclawAgentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_openclaw_id", (q) => q.eq("openclawAgentId", args.openclawAgentId))
      .unique();
  },
});

// Create new agent
export const create = mutation({
  args: {
    name: v.string(),
    emoji: v.string(),
    role: v.string(),
    color: v.string(),
    badge: v.optional(v.string()),
    openclawAgentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("agents", {
      ...args,
      isActive: true,
      createdAt: now,
    });
  },
});

// Update agent
export const update = mutation({
  args: {
    id: v.id("agents"),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
    role: v.optional(v.string()),
    color: v.optional(v.string()),
    badge: v.optional(v.string()),
    openclawAgentId: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});
