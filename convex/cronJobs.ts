import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all cron jobs
export const list = query({
  args: {
    agentId: v.optional(v.id("agents")),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let jobs;
    
    if (args.agentId) {
      jobs = await ctx.db
        .query("cronJobs")
        .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
        .collect();
    } else {
      jobs = await ctx.db.query("cronJobs").collect();
    }
    
    if (args.activeOnly) {
      jobs = jobs.filter((j) => j.isActive);
    }
    
    return jobs.sort((a, b) => (a.nextRunAtMs ?? 0) - (b.nextRunAtMs ?? 0));
  },
});

// Get upcoming cron jobs for calendar
export const getUpcoming = query({
  args: {
    startMs: v.number(),
    endMs: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cronJobs")
      .withIndex("by_next_run")
      .filter((q) =>
        q.and(
          q.gte(q.field("nextRunAtMs"), args.startMs),
          q.lte(q.field("nextRunAtMs"), args.endMs),
          q.eq(q.field("isActive"), true)
        )
      )
      .collect();
  },
});

// Sync cron job from OpenClaw
export const sync = mutation({
  args: {
    openclawId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    schedule: v.string(),
    product: v.optional(v.string()),
    agentId: v.optional(v.id("agents")),
    payload: v.optional(v.any()),
    nextRunAtMs: v.optional(v.number()),
    lastRunAtMs: v.optional(v.number()),
    lastStatus: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("cronJobs")
      .withIndex("by_openclaw_id", (q) => q.eq("openclawId", args.openclawId))
      .unique();
    
    // Normalize lastStatus to valid enum value
    const validStatuses = ["success", "failure", "running"] as const;
    const normalizedStatus = args.lastStatus && validStatuses.includes(args.lastStatus as any) 
      ? args.lastStatus as "success" | "failure" | "running"
      : undefined;
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        description: args.description,
        schedule: args.schedule,
        product: args.product,
        agentId: args.agentId,
        payload: args.payload,
        nextRunAtMs: args.nextRunAtMs,
        lastRunAtMs: args.lastRunAtMs,
        lastStatus: normalizedStatus,
        isActive: args.isActive,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("cronJobs", {
        openclawId: args.openclawId,
        name: args.name,
        description: args.description,
        schedule: args.schedule,
        product: args.product,
        agentId: args.agentId,
        payload: args.payload,
        nextRunAtMs: args.nextRunAtMs,
        lastRunAtMs: args.lastRunAtMs,
        lastStatus: normalizedStatus,
        isActive: args.isActive,
        createdAt: Date.now(),
      });
    }
  },
});

// List cron jobs with agent info (enriched for UI)
export const listWithAgents = query({
  args: {
    product: v.optional(v.string()),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let jobs;
    
    if (args.product) {
      jobs = await ctx.db
        .query("cronJobs")
        .withIndex("by_product", (q) => q.eq("product", args.product))
        .collect();
    } else {
      jobs = await ctx.db.query("cronJobs").collect();
    }
    
    if (args.activeOnly) {
      jobs = jobs.filter((j) => j.isActive);
    }
    
    // Get all agents for enrichment
    const agents = await ctx.db.query("agents").collect();
    const agentMap = new Map(agents.map((a) => [a._id, a]));
    
    // Enrich with agent data
    const enriched = jobs.map((job) => {
      const agent = job.agentId ? agentMap.get(job.agentId) : null;
      return {
        ...job,
        agent: agent ? {
          name: agent.name,
          emoji: agent.emoji,
          color: agent.color,
        } : null,
      };
    });
    
    return enriched.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// List cron jobs for a specific week (calendar view)
export const listByWeek = query({
  args: {
    weekStartMs: v.number(),
    weekEndMs: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all active cron jobs
    const allJobs = await ctx.db
      .query("cronJobs")
      .collect();
    
    // Get agents for enrichment
    const agents = await ctx.db.query("agents").collect();
    const agentMap = new Map(agents.map((a) => [a._id, a]));
    
    // Filter jobs that have a run in this week range
    // For recurring jobs, we need to calculate all occurrences in the week
    const jobsWithOccurrences = allJobs
      .filter((job) => job.isActive)
      .map((job) => {
        const agent = job.agentId ? agentMap.get(job.agentId) : null;
        return {
          ...job,
          agent: agent ? {
            name: agent.name,
            emoji: agent.emoji,
            color: agent.color,
          } : null,
        };
      });
    
    return jobsWithOccurrences;
  },
});

// Update cron job status after run
export const updateStatus = mutation({
  args: {
    openclawId: v.string(),
    lastStatus: v.union(
      v.literal("success"),
      v.literal("failure"),
      v.literal("running")
    ),
    nextRunAtMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("cronJobs")
      .withIndex("by_openclaw_id", (q) => q.eq("openclawId", args.openclawId))
      .unique();
    
    if (job) {
      await ctx.db.patch(job._id, {
        lastStatus: args.lastStatus,
        lastRunAtMs: Date.now(),
        nextRunAtMs: args.nextRunAtMs,
      });
    }
  },
});

// Get cron job by OpenClaw ID
export const getByOpenclawId = query({
  args: { openclawId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cronJobs")
      .withIndex("by_openclaw_id", (q) => q.eq("openclawId", args.openclawId))
      .unique();
  },
});

// Update run status with more details
export const updateRunStatus = mutation({
  args: {
    id: v.id("cronJobs"),
    status: v.union(
      v.literal("success"),
      v.literal("failure"),
      v.literal("running")
    ),
    runAtMs: v.number(),
    durationMs: v.optional(v.number()),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      lastStatus: args.status,
      lastRunAtMs: args.runAtMs,
    });
  },
});

// Get failed cron jobs (for health monitoring)
export const getFailedJobs = query({
  args: {
    since: v.optional(v.number()), // timestamp, default 24h
  },
  handler: async (ctx, args) => {
    const since = args.since ?? Date.now() - 24 * 60 * 60 * 1000;
    
    const jobs = await ctx.db
      .query("cronJobs")
      .collect();
    
    // Return jobs that failed and haven't run successfully since
    return jobs.filter((job) => 
      job.lastStatus === "failure" && 
      job.isActive &&
      job.lastRunAtMs && 
      job.lastRunAtMs >= since
    );
  },
});

// Get stale cron jobs (haven't run when they should have)
export const getStaleJobs = query({
  args: {
    thresholdMs: v.optional(v.number()), // default 2 hours
  },
  handler: async (ctx, args) => {
    const threshold = args.thresholdMs ?? 2 * 60 * 60 * 1000;
    const now = Date.now();
    
    const jobs = await ctx.db
      .query("cronJobs")
      .collect();
    
    // Return active jobs whose nextRunAtMs is in the past by more than threshold
    return jobs.filter((job) => 
      job.isActive &&
      job.nextRunAtMs &&
      job.nextRunAtMs < now - threshold
    );
  },
});
