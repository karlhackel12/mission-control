import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// List recurring tasks
export const list = query({
  args: {
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("failed"),
      v.literal("completed")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    if (args.status) {
      return await ctx.db
        .query("recurringTasks")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(limit);
    }

    return await ctx.db
      .query("recurringTasks")
      .order("desc")
      .take(limit);
  },
});

// Get task by name
export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("recurringTasks")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

// Get tasks due to run
export const getDueTasks = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const tasks = await ctx.db
      .query("recurringTasks")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    return tasks.filter((t) => t.nextRunAt && t.nextRunAt <= now);
  },
});

// Create recurring task
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    schedule: v.string(),
    agentId: v.optional(v.id("agents")),
    payload: v.optional(v.any()),
    maxRetries: v.optional(v.number()),
    nextRunAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if task with same name exists
    const existing = await ctx.db
      .query("recurringTasks")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      throw new Error(`Task with name "${args.name}" already exists`);
    }

    return await ctx.db.insert("recurringTasks", {
      name: args.name,
      description: args.description,
      schedule: args.schedule,
      agentId: args.agentId,
      payload: args.payload,
      status: "active",
      retryCount: 0,
      maxRetries: args.maxRetries ?? 3,
      nextRunAt: args.nextRunAt,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update task status
export const updateStatus = mutation({
  args: {
    id: v.id("recurringTasks"),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("failed"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

// Record task run result
export const recordRun = mutation({
  args: {
    id: v.id("recurringTasks"),
    success: v.boolean(),
    error: v.optional(v.string()),
    nextRunAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }

    const now = Date.now();
    const updates: any = {
      lastRunAt: now,
      lastStatus: args.success ? "success" : "failure",
      updatedAt: now,
    };

    if (args.nextRunAt) {
      updates.nextRunAt = args.nextRunAt;
    }

    if (args.success) {
      updates.retryCount = 0;
      updates.lastError = undefined;
    } else {
      updates.retryCount = task.retryCount + 1;
      updates.lastError = args.error;

      // Check if max retries exceeded
      if (updates.retryCount >= task.maxRetries) {
        updates.status = "failed";
      }
    }

    await ctx.db.patch(args.id, updates);
  },
});

// Internal record run
export const recordRunInternal = internalMutation({
  args: {
    name: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
    nextRunAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("recurringTasks")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (!task) {
      console.log(`Task "${args.name}" not found, skipping record`);
      return;
    }

    const now = Date.now();
    const updates: any = {
      lastRunAt: now,
      lastStatus: args.success ? "success" : "failure",
      updatedAt: now,
    };

    if (args.nextRunAt) {
      updates.nextRunAt = args.nextRunAt;
    }

    if (args.success) {
      updates.retryCount = 0;
      updates.lastError = undefined;
    } else {
      updates.retryCount = task.retryCount + 1;
      updates.lastError = args.error;

      if (updates.retryCount >= task.maxRetries) {
        updates.status = "failed";
      }
    }

    await ctx.db.patch(task._id, updates);
  },
});

// Retry failed task
export const retry = mutation({
  args: { id: v.id("recurringTasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }

    await ctx.db.patch(args.id, {
      status: "active",
      retryCount: 0,
      lastError: undefined,
      updatedAt: Date.now(),
    });
  },
});

// Delete task
export const remove = mutation({
  args: { id: v.id("recurringTasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get task stats
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("recurringTasks").collect();

    const byStatus: Record<string, number> = {};
    let totalRuns = 0;
    let failedRuns = 0;

    for (const task of tasks) {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
      if (task.lastRunAt) totalRuns++;
      if (task.lastStatus === "failure") failedRuns++;
    }

    return {
      total: tasks.length,
      byStatus,
      totalRuns,
      failedRuns,
    };
  },
});

// List with agent info
export const listWithAgents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    const tasks = await ctx.db
      .query("recurringTasks")
      .order("desc")
      .take(limit);
    
    const agents = await ctx.db.query("agents").collect();
    const agentMap = new Map(agents.map((a) => [a._id, a]));
    
    return tasks.map((task) => {
      const agent = task.agentId ? agentMap.get(task.agentId) : null;
      return {
        ...task,
        agent: agent ? {
          name: agent.name,
          emoji: agent.emoji,
          color: agent.color,
        } : null,
      };
    });
  },
});
