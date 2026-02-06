import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// List all sessions
export const list = query({
  args: {
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("idle"),
      v.literal("sleeping"),
      v.literal("terminated")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let q;
    if (args.status) {
      q = ctx.db
        .query("sessions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc");
    } else {
      q = ctx.db
        .query("sessions")
        .withIndex("by_last_activity")
        .order("desc");
    }

    return await q.take(limit);
  },
});

// Get session by OpenClaw session ID
export const getBySessionId = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

// Get sessions by agent name
export const getByAgentName = query({
  args: { agentName: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_agent_name", (q) => q.eq("agentName", args.agentName))
      .collect();
  },
});

// Get active sessions count
export const getActiveCount = query({
  args: {},
  handler: async (ctx) => {
    const active = await ctx.db
      .query("sessions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    return active.length;
  },
});

// Upsert session (create or update)
export const upsert = mutation({
  args: {
    sessionId: v.string(),
    agentName: v.string(),
    channel: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("idle"),
      v.literal("sleeping"),
      v.literal("terminated")
    ),
    model: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if session exists
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    // Try to resolve agent ID
    let agentId = undefined;
    const agents = await ctx.db.query("agents").collect();
    const agent = agents.find(
      (a) => a.name.toLowerCase() === args.agentName.toLowerCase() ||
             a.openclawAgentId === args.agentName
    );
    if (agent) {
      agentId = agent._id;
    }

    if (existing) {
      // Update existing session
      await ctx.db.patch(existing._id, {
        status: args.status,
        channel: args.channel ?? existing.channel,
        model: args.model ?? existing.model,
        metadata: args.metadata ?? existing.metadata,
        agentId: agentId ?? existing.agentId,
        lastActivityAt: now,
      });
      return existing._id;
    } else {
      // Create new session
      return await ctx.db.insert("sessions", {
        sessionId: args.sessionId,
        agentName: args.agentName,
        agentId,
        channel: args.channel,
        status: args.status,
        model: args.model,
        metadata: args.metadata,
        lastActivityAt: now,
        startedAt: now,
      });
    }
  },
});

// Internal upsert for HTTP endpoint
export const upsertInternal = internalMutation({
  args: {
    sessionId: v.string(),
    agentName: v.string(),
    channel: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("idle"),
      v.literal("sleeping"),
      v.literal("terminated")
    ),
    model: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    let agentId = undefined;
    const agents = await ctx.db.query("agents").collect();
    const agent = agents.find(
      (a) => a.name.toLowerCase() === args.agentName.toLowerCase() ||
             a.openclawAgentId === args.agentName
    );
    if (agent) {
      agentId = agent._id;
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        channel: args.channel ?? existing.channel,
        model: args.model ?? existing.model,
        metadata: args.metadata ?? existing.metadata,
        agentId: agentId ?? existing.agentId,
        lastActivityAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("sessions", {
        sessionId: args.sessionId,
        agentName: args.agentName,
        agentId,
        channel: args.channel,
        status: args.status,
        model: args.model,
        metadata: args.metadata,
        lastActivityAt: now,
        startedAt: now,
      });
    }
  },
});

// Update session status
export const updateStatus = mutation({
  args: {
    sessionId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("idle"),
      v.literal("sleeping"),
      v.literal("terminated")
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) {
      throw new Error(`Session not found: ${args.sessionId}`);
    }

    await ctx.db.patch(session._id, {
      status: args.status,
      lastActivityAt: Date.now(),
    });

    return session._id;
  },
});

// Heartbeat - update lastActivityAt
export const heartbeat = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        lastActivityAt: Date.now(),
      });
    }

    return session?._id;
  },
});

// Get session stats
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("sessions").collect();
    
    const byStatus: Record<string, number> = {};
    const byChannel: Record<string, number> = {};
    const byAgent: Record<string, number> = {};

    for (const session of sessions) {
      byStatus[session.status] = (byStatus[session.status] || 0) + 1;
      if (session.channel) {
        byChannel[session.channel] = (byChannel[session.channel] || 0) + 1;
      }
      byAgent[session.agentName] = (byAgent[session.agentName] || 0) + 1;
    }

    return {
      total: sessions.length,
      byStatus,
      byChannel,
      byAgent,
    };
  },
});

// Clean up old terminated sessions (older than 24h)
export const cleanupOld = mutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    
    const oldSessions = await ctx.db
      .query("sessions")
      .withIndex("by_status", (q) => q.eq("status", "terminated"))
      .filter((q) => q.lt(q.field("lastActivityAt"), cutoff))
      .collect();

    for (const session of oldSessions) {
      await ctx.db.delete(session._id);
    }

    return { deleted: oldSessions.length };
  },
});

// List sessions with agent info (enriched)
export const listWithAgents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_last_activity")
      .order("desc")
      .take(limit);
    
    const agents = await ctx.db.query("agents").collect();
    const agentMap = new Map(agents.map((a) => [a._id, a]));
    
    return sessions.map((session) => {
      const agent = session.agentId ? agentMap.get(session.agentId) : null;
      return {
        ...session,
        agent: agent ? {
          name: agent.name,
          emoji: agent.emoji,
          color: agent.color,
        } : null,
      };
    });
  },
});
