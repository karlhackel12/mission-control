import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List messages with pagination (for squad chat)
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
    
    // Reverse to get chronological order (oldest first)
    return messages.reverse();
  },
});

// List messages with agent info (enriched for UI)
export const listWithAgents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
    
    // Get all agents for lookup
    const agents = await ctx.db.query("agents").collect();
    const agentMap = new Map(
      agents.map((a) => [a._id, a])
    );
    
    // Enrich messages with agent data
    const enriched = messages.map((msg) => {
      const agent = agentMap.get(msg.agentId);
      return {
        ...msg,
        agent: agent ? {
          name: agent.name,
          emoji: agent.emoji,
          color: agent.color,
          role: agent.role,
        } : null,
      };
    });
    
    // Reverse to get chronological order (oldest first)
    return enriched.reverse();
  },
});

// Send a message
export const send = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      agentId: args.agentId,
      content: args.content,
      replyTo: args.replyTo,
      taskRef: args.taskRef,
      isHuman: args.isHuman ?? false,
      messageType: args.messageType ?? "message",
      timestamp: Date.now(),
    });
  },
});

// Get agent by name (helper for chat where we have name, not ID)
export const getAgentByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();
  },
});
