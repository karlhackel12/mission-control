import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all tasks
export const list = query({
  args: {
    status: v.optional(v.string()),
    product: v.optional(v.string()),
    assignedTo: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    let tasks;
    
    if (args.status) {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_status", (q) => q.eq("status", args.status as any))
        .collect();
    } else if (args.product) {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_product", (q) => q.eq("product", args.product))
        .collect();
    } else if (args.assignedTo) {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_assigned", (q) => q.eq("assignedTo", args.assignedTo))
        .collect();
    } else {
      tasks = await ctx.db.query("tasks").collect();
    }
    
    // Sort by priority then by createdAt
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return tasks.sort((a, b) => {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return b.createdAt - a.createdAt;
    });
  },
});

// Get task by ID
export const getById = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get scheduled tasks for calendar view
export const getScheduled = query({
  args: {
    startMs: v.number(),
    endMs: v.number(),
  },
  handler: async (ctx, args) => {
    // Get tasks with scheduledFor in range
    const scheduled = await ctx.db
      .query("tasks")
      .withIndex("by_scheduled")
      .filter((q) =>
        q.and(
          q.gte(q.field("scheduledFor"), args.startMs),
          q.lte(q.field("scheduledFor"), args.endMs)
        )
      )
      .collect();
    
    // Get tasks with dueDate in range
    const withDue = await ctx.db
      .query("tasks")
      .withIndex("by_due")
      .filter((q) =>
        q.and(
          q.gte(q.field("dueDate"), args.startMs),
          q.lte(q.field("dueDate"), args.endMs)
        )
      )
      .collect();
    
    // Merge and dedupe
    const all = [...scheduled, ...withDue];
    const seen = new Set();
    return all.filter((t) => {
      if (seen.has(t._id)) return false;
      seen.add(t._id);
      return true;
    });
  },
});

// Create new task
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("backlog"),
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("done"),
      v.literal("cancelled")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    product: v.optional(v.string()),
    assignedTo: v.optional(v.id("agents")),
    scheduledFor: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    createdBy: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status: args.status ?? "backlog",
      priority: args.priority ?? "medium",
      product: args.product,
      assignedTo: args.assignedTo,
      scheduledFor: args.scheduledFor,
      dueDate: args.dueDate,
      tags: args.tags ?? [],
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update task
export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("backlog"),
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("done"),
      v.literal("cancelled")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    product: v.optional(v.string()),
    assignedTo: v.optional(v.id("agents")),
    scheduledFor: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Delete task
export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
