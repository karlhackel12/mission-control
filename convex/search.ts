import { query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

// Text search in tasks
export const searchTasks = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Doc<"tasks">[]> => {
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
  handler: async (ctx, args): Promise<Doc<"memories">[]> => {
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

// Result type for global search
interface GlobalSearchResult {
  tasks: Doc<"tasks">[];
  memories: Doc<"memories">[];
  query: string;
}

// Combined global search
export const globalSearch = query({
  args: {
    query: v.string(),
    taskLimit: v.optional(v.number()),
    memoryLimit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<GlobalSearchResult> => {
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

// Types for hybrid search
interface ScoredMemory {
  memory: Doc<"memories">;
  score: number;
  textScore: number;
  vectorScore: number;
}

// Hybrid search combining text and vector search for memories
export const hybridSearchMemories = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    vectorWeight: v.optional(v.number()), // 0-1, default 0.7
  },
  handler: async (ctx, args): Promise<ScoredMemory[]> => {
    const limit = args.limit ?? 10;
    const vectorWeight = args.vectorWeight ?? 0.7;
    const textWeight = 1 - vectorWeight;
    
    // Run text search
    const textResults: Doc<"memories">[] = await ctx.runQuery(api.search.searchMemories, {
      query: args.query,
      limit: limit * 2, // Get more for merging
    });
    
    // Run vector search (will fallback to text search if no API key)
    type MemoryWithScore = Doc<"memories"> & { _score?: number };
    const vectorResults: MemoryWithScore[] = await ctx.runAction(api.memories.vectorSearch, {
      query: args.query,
      limit: limit * 2,
    });
    
    // Create a map to merge and score results
    const scoreMap = new Map<string, { memory: Doc<"memories">; textScore: number; vectorScore: number }>();
    
    // Add text results with normalized scores
    const maxTextScore = Math.max(...textResults.map((_: Doc<"memories">, i: number) => textResults.length - i), 1);
    textResults.forEach((memory: Doc<"memories">, index: number) => {
      const normalizedScore = (textResults.length - index) / maxTextScore;
      scoreMap.set(memory._id, {
        memory,
        textScore: normalizedScore,
        vectorScore: 0,
      });
    });
    
    // Add/update with vector results
    vectorResults.forEach((result: MemoryWithScore, index: number) => {
      if (!result) return;
      const memory = result;
      const normalizedScore = (vectorResults.length - index) / vectorResults.length;
      
      const existing = scoreMap.get(memory._id);
      if (existing) {
        existing.vectorScore = normalizedScore;
      } else {
        scoreMap.set(memory._id, {
          memory,
          textScore: 0,
          vectorScore: normalizedScore,
        });
      }
    });
    
    // Calculate combined scores and sort
    const values = Array.from(scoreMap.values());
    const combined: ScoredMemory[] = values
      .map((item) => ({
        memory: item.memory,
        score: item.textScore * textWeight + item.vectorScore * vectorWeight,
        textScore: item.textScore,
        vectorScore: item.vectorScore,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    return combined;
  },
});

// Types for semantic search results
interface MemoryWithSearchScore extends Doc<"memories"> {
  _searchScore?: number;
  _textScore?: number;
  _vectorScore?: number;
}

interface SemanticSearchResult {
  tasks: Doc<"tasks">[];
  memories: MemoryWithSearchScore[];
  query: string;
}

// Global search with semantic memory search
export const globalSearchSemantic = action({
  args: {
    query: v.string(),
    taskLimit: v.optional(v.number()),
    memoryLimit: v.optional(v.number()),
    useVectorSearch: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<SemanticSearchResult> => {
    const taskLimit = args.taskLimit ?? 5;
    const memoryLimit = args.memoryLimit ?? 5;
    const useVectorSearch = args.useVectorSearch ?? true;
    
    if (!args.query.trim()) {
      return { tasks: [], memories: [], query: args.query };
    }
    
    // Search tasks (text only for now)
    const tasks: Doc<"tasks">[] = await ctx.runQuery(api.search.searchTasks, {
      query: args.query,
      limit: taskLimit,
    });
    
    // Search memories with hybrid search if enabled
    let memories: MemoryWithSearchScore[];
    if (useVectorSearch) {
      const hybridResults: ScoredMemory[] = await ctx.runAction(api.search.hybridSearchMemories, {
        query: args.query,
        limit: memoryLimit,
      });
      memories = hybridResults.map((r: ScoredMemory) => ({
        ...r.memory,
        _searchScore: r.score,
        _textScore: r.textScore,
        _vectorScore: r.vectorScore,
      }));
    } else {
      const textMemories: Doc<"memories">[] = await ctx.runQuery(api.search.searchMemories, {
        query: args.query,
        limit: memoryLimit,
      });
      memories = textMemories;
    }
    
    return {
      tasks,
      memories,
      query: args.query,
    };
  },
});
