import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

// HTTP action to receive cron jobs from OpenClaw
export const syncCronJobs = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { jobs } = body as { jobs: Array<{
      id: string;
      name: string;
      schedule: string;
      agentName?: string;
      payload?: any;
      nextRunAtMs?: number;
      isActive: boolean;
    }> };

    // Get agent mapping
    const agents = await ctx.runQuery(api.agents.list, {});
    const agentByName = new Map(agents.map((a) => [a.name.toLowerCase(), a]));

    // Sync each job
    for (const job of jobs) {
      const agent = job.agentName ? agentByName.get(job.agentName.toLowerCase()) : null;
      
      await ctx.runMutation(api.cronJobs.sync, {
        openclawId: job.id,
        name: job.name,
        schedule: job.schedule,
        agentId: agent?._id,
        payload: job.payload,
        nextRunAtMs: job.nextRunAtMs,
        isActive: job.isActive,
      });
    }

    return new Response(JSON.stringify({ success: true, synced: jobs.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// Mutation to seed initial cron jobs data
export const seedCronJobs = mutation({
  args: {},
  handler: async (ctx) => {
    // Get agents first
    const agents = await ctx.db.query("agents").collect();
    const agentByName = new Map(agents.map((a) => [a.name.toLowerCase(), a]));
    
    // Sample cron jobs based on typical OpenClaw setup
    const mockJobs = [
      // Developer agent jobs
      { id: "cron-dev-morning", name: "Morning Briefing", schedule: "0 7 * * 1-6", agent: "developer", nextHour: 7 },
      { id: "cron-dev-standup", name: "Daily Standup", schedule: "0 9 * * 1-5", agent: "developer", nextHour: 9 },
      { id: "cron-dev-evening", name: "Evening Review", schedule: "0 18 * * 1-5", agent: "developer", nextHour: 18 },
      { id: "cron-dev-git-check", name: "Git Status Check", schedule: "0 */4 * * *", agent: "developer", nextHour: 12 },
      
      // Marketing agent jobs
      { id: "cron-mkt-twitter", name: "Twitter Engagement", schedule: "0 10,14,17 * * *", agent: "marketing", nextHour: 10 },
      { id: "cron-mkt-content", name: "Content Ideas", schedule: "0 8 * * 1,3,5", agent: "marketing", nextHour: 8 },
      { id: "cron-mkt-analytics", name: "Weekly Analytics", schedule: "0 9 * * 1", agent: "marketing", nextHour: 9 },
      { id: "cron-mkt-newsletter", name: "Newsletter Draft", schedule: "0 14 * * 5", agent: "marketing", nextHour: 14 },
      
      // Research agent jobs
      { id: "cron-research-news", name: "AI News Digest", schedule: "0 8 * * *", agent: "research", nextHour: 8 },
      { id: "cron-research-papers", name: "Paper Review", schedule: "0 15 * * 2,4", agent: "research", nextHour: 15 },
      { id: "cron-research-trends", name: "Trend Analysis", schedule: "0 11 * * 1", agent: "research", nextHour: 11 },
      
      // Operations agent jobs
      { id: "cron-ops-backup", name: "System Backup", schedule: "0 3 * * *", agent: "operations", nextHour: 3 },
      { id: "cron-ops-health", name: "Health Check", schedule: "0 */6 * * *", agent: "operations", nextHour: 6 },
      { id: "cron-ops-cleanup", name: "Log Cleanup", schedule: "0 4 * * 0", agent: "operations", nextHour: 4 },
      { id: "cron-ops-metrics", name: "Metrics Report", schedule: "0 7 * * 1-5", agent: "operations", nextHour: 7 },
      
      // Finance agent jobs
      { id: "cron-fin-expenses", name: "Expense Report", schedule: "0 9 * * 5", agent: "finance", nextHour: 9 },
      { id: "cron-fin-invoices", name: "Invoice Check", schedule: "0 10 1,15 * *", agent: "finance", nextHour: 10 },
      { id: "cron-fin-forecast", name: "Cash Forecast", schedule: "0 8 * * 1", agent: "finance", nextHour: 8 },
      
      // General jobs
      { id: "cron-heartbeat", name: "Heartbeat Poll", schedule: "*/30 * * * *", agent: "developer", nextHour: 0 },
      { id: "cron-sync-calendar", name: "Calendar Sync", schedule: "0 */2 * * *", agent: "developer", nextHour: 10 },
    ];

    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let seeded = 0;

    for (const job of mockJobs) {
      const existing = await ctx.db
        .query("cronJobs")
        .withIndex("by_openclaw_id", (q) => q.eq("openclawId", job.id))
        .unique();
      
      if (!existing) {
        const agent = agentByName.get(job.agent);
        
        // Calculate next run time (next occurrence of that hour)
        const nextRun = new Date(today);
        nextRun.setHours(job.nextHour, 0, 0, 0);
        if (nextRun.getTime() <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        
        await ctx.db.insert("cronJobs", {
          openclawId: job.id,
          name: job.name,
          schedule: job.schedule,
          agentId: agent?._id,
          nextRunAtMs: nextRun.getTime(),
          isActive: true,
          createdAt: now,
        });
        seeded++;
      }
    }

    return { seeded, total: mockJobs.length };
  },
});

// Bulk sync mutation for external calls
export const bulkSync = mutation({
  args: {
    jobs: v.array(v.object({
      openclawId: v.string(),
      name: v.string(),
      schedule: v.string(),
      agentName: v.optional(v.string()),
      payload: v.optional(v.any()),
      nextRunAtMs: v.optional(v.number()),
      isActive: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const agents = await ctx.db.query("agents").collect();
    const agentByName = new Map(agents.map((a) => [a.name.toLowerCase(), a]));
    
    let synced = 0;
    for (const job of args.jobs) {
      const agent = job.agentName ? agentByName.get(job.agentName.toLowerCase()) : null;
      
      const existing = await ctx.db
        .query("cronJobs")
        .withIndex("by_openclaw_id", (q) => q.eq("openclawId", job.openclawId))
        .unique();
      
      if (existing) {
        await ctx.db.patch(existing._id, {
          name: job.name,
          schedule: job.schedule,
          agentId: agent?._id,
          payload: job.payload,
          nextRunAtMs: job.nextRunAtMs,
          isActive: job.isActive,
        });
      } else {
        await ctx.db.insert("cronJobs", {
          openclawId: job.openclawId,
          name: job.name,
          schedule: job.schedule,
          agentId: agent?._id,
          payload: job.payload,
          nextRunAtMs: job.nextRunAtMs,
          isActive: job.isActive,
          createdAt: Date.now(),
        });
      }
      synced++;
    }
    
    return { synced };
  },
});
