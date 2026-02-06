import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List messages with pagination (for squad chat)
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    
    return await ctx.db
      .query("messages")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
  },
});

// Send a message
export const send = mutation({
  args: {
    agentId: v.id("agents"),
    content: v.string(),
    replyTo: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      ...args,
      timestamp: Date.now(),
    });
  },
});
