import { query } from "./_generated/server";
import { v } from "convex/values";

// Text search in tasks
export const searchTasks = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const queryLower = args.query.toLowerCase().trim();

    if (!queryLower) return [];

    const tasks = await ctx.db.query("tasks").collect();

    // Score and filter tasks by title and description match
    const scored = tasks
      .map((task) => {
        const titleLower = task.title.toLowerCase();
        const descLower = (task.description ?? "").toLowerCase();
        const tagsLower = task.tags.map((t) => t.toLowerCase());

        let score = 0;

        // Exact title match is highest
        if (titleLower === queryLower) score += 100;
        // Title starts with query
        else if (titleLower.startsWith(queryLower)) score += 50;
        // Title contains query
        else if (titleLower.includes(queryLower)) score += 30;

        // Description contains query
        if (descLower.includes(queryLower)) score += 10;

        // Tag match
        if (tagsLower.some((tag) => tag.includes(queryLower))) score += 20;

        return { task, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ task }) => task);

    return scored;
  },
});

// Text search in memories
export const searchMemories = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const queryLower = args.query.toLowerCase().trim();

    if (!queryLower) return [];

    const memories = await ctx.db.query("memories").collect();

    // Score memories by content match
    const scored = memories
      .map((memory) => {
        const contentLower = memory.content.toLowerCase();

        let score = 0;
        // Count occurrences for scoring
        const occurrences = (
          contentLower.match(new RegExp(queryLower, "g")) ?? []
        ).length;
        score = occurrences * 10;

        // Boost if starts with query
        if (contentLower.startsWith(queryLower)) score += 20;

        return { memory, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ memory }) => memory);

    return scored;
  },
});

// Combined global search
export const globalSearch = query({
  args: {
    query: v.string(),
    taskLimit: v.optional(v.number()),
    memoryLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const queryLower = args.query.toLowerCase().trim();
    const taskLimit = args.taskLimit ?? 5;
    const memoryLimit = args.memoryLimit ?? 5;

    if (!queryLower) {
      return { tasks: [], memories: [], query: args.query };
    }

    // Search tasks
    const tasks = await ctx.db.query("tasks").collect();
    const scoredTasks = tasks
      .map((task) => {
        const titleLower = task.title.toLowerCase();
        const descLower = (task.description ?? "").toLowerCase();
        const tagsLower = task.tags.map((t) => t.toLowerCase());

        let score = 0;
        if (titleLower === queryLower) score += 100;
        else if (titleLower.startsWith(queryLower)) score += 50;
        else if (titleLower.includes(queryLower)) score += 30;
        if (descLower.includes(queryLower)) score += 10;
        if (tagsLower.some((tag) => tag.includes(queryLower))) score += 20;

        return { task, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, taskLimit)
      .map(({ task }) => task);

    // Search memories
    const memories = await ctx.db.query("memories").collect();
    const scoredMemories = memories
      .map((memory) => {
        const contentLower = memory.content.toLowerCase();
        let score = 0;
        const occurrences = (
          contentLower.match(new RegExp(queryLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []
        ).length;
        score = occurrences * 10;
        if (contentLower.startsWith(queryLower)) score += 20;

        return { memory, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, memoryLimit)
      .map(({ memory }) => memory);

    return {
      tasks: scoredTasks,
      memories: scoredMemories,
      query: args.query,
    };
  },
});
