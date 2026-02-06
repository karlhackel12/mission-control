import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";

type MemoryCategory = "preference" | "fact" | "decision" | "entity" | "other";

// List memories
export const list = query({
  args: {
    category: v.optional(v.union(
      v.literal("preference"),
      v.literal("fact"),
      v.literal("decision"),
      v.literal("entity"),
      v.literal("other")
    )),
    agentId: v.optional(v.id("agents")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Doc<"memories">[]> => {
    const limit = args.limit ?? 50;
    
    if (args.category) {
      return await ctx.db
        .query("memories")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .order("desc")
        .take(limit);
    }
    
    if (args.agentId) {
      return await ctx.db
        .query("memories")
        .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
        .order("desc")
        .take(limit);
    }
    
    return await ctx.db
      .query("memories")
      .order("desc")
      .take(limit);
  },
});

// Vector search for memories - uses action for vectorSearch API
// TODO: Implement with action when needed
// For now, provide a simple text-based search fallback
export const searchByText = query({
  args: {
    query: v.string(),
    category: v.optional(v.union(
      v.literal("preference"),
      v.literal("fact"),
      v.literal("decision"),
      v.literal("entity"),
      v.literal("other")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Doc<"memories">[]> => {
    const limit = args.limit ?? 10;
    const queryLower = args.query.toLowerCase();
    
    let memories: Doc<"memories">[];
    if (args.category) {
      memories = await ctx.db
        .query("memories")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    } else {
      memories = await ctx.db.query("memories").collect();
    }
    
    // Simple text matching (replace with vector search in action later)
    const filtered = memories.filter((m) => 
      m.content.toLowerCase().includes(queryLower)
    );
    
    return filtered.slice(0, limit);
  },
});

// Store new memory
export const store = mutation({
  args: {
    content: v.string(),
    category: v.union(
      v.literal("preference"),
      v.literal("fact"),
      v.literal("decision"),
      v.literal("entity"),
      v.literal("other")
    ),
    agentId: v.optional(v.id("agents")),
    embedding: v.optional(v.array(v.float64())),
  },
  handler: async (ctx, args): Promise<Id<"memories">> => {
    return await ctx.db.insert("memories", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Delete memory
export const remove = mutation({
  args: { id: v.id("memories") },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.delete(args.id);
  },
});

// Internal mutation to update memory with embedding
export const updateEmbedding = internalMutation({
  args: {
    id: v.id("memories"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.patch(args.id, { embedding: args.embedding });
  },
});

// Action to store memory with automatic embedding generation
export const storeWithEmbedding = action({
  args: {
    content: v.string(),
    category: v.union(
      v.literal("preference"),
      v.literal("fact"),
      v.literal("decision"),
      v.literal("entity"),
      v.literal("other")
    ),
    agentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args): Promise<Id<"memories">> => {
    // First, generate embedding
    const embedding: number[] | null = await ctx.runAction(api.embeddings.generateEmbedding, {
      text: args.content,
    });
    
    // Then store the memory with or without embedding
    const memoryId = await ctx.runMutation(api.memories.store, {
      content: args.content,
      category: args.category,
      agentId: args.agentId,
      embedding: embedding ?? undefined,
    });
    
    return memoryId;
  },
});

// Action to backfill embeddings for existing memories
export const backfillEmbeddings = action({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ processed: number; skipped: number; failed: number }> => {
    const limit = args.limit ?? 50;
    
    // Get memories without embeddings
    const memories: Doc<"memories">[] = await ctx.runQuery(api.memories.list, { limit: 500 });
    const memoriesWithoutEmbedding = memories.filter((m: Doc<"memories">) => !m.embedding).slice(0, limit);
    
    if (memoriesWithoutEmbedding.length === 0) {
      return { processed: 0, skipped: 0, failed: 0 };
    }
    
    // Generate embeddings in batch
    const texts = memoriesWithoutEmbedding.map((m: Doc<"memories">) => m.content);
    const embeddings: (number[] | null)[] = await ctx.runAction(api.embeddings.generateEmbeddingsBatch, { texts });
    
    let processed = 0;
    let skipped = 0;
    let failed = 0;
    
    // Update each memory with its embedding
    for (let i = 0; i < memoriesWithoutEmbedding.length; i++) {
      const memory = memoriesWithoutEmbedding[i];
      const embedding = embeddings[i];
      
      if (embedding) {
        try {
          await ctx.runMutation(internal.memories.updateEmbedding, {
            id: memory._id,
            embedding,
          });
          processed++;
        } catch {
          failed++;
        }
      } else {
        skipped++;
      }
    }
    
    return { processed, skipped, failed };
  },
});

// Memory with optional score for search results
type MemoryWithScore = Doc<"memories"> & { _score?: number };

// Vector search for memories using similarity
export const vectorSearch = action({
  args: {
    query: v.string(),
    category: v.optional(v.union(
      v.literal("preference"),
      v.literal("fact"),
      v.literal("decision"),
      v.literal("entity"),
      v.literal("other")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<MemoryWithScore[]> => {
    const limit = args.limit ?? 10;
    
    // Generate embedding for the query
    const queryEmbedding: number[] | null = await ctx.runAction(api.embeddings.generateEmbedding, {
      text: args.query,
    });
    
    // If no embedding (API not configured), fall back to text search
    if (!queryEmbedding) {
      console.log("No embedding generated, falling back to text search");
      const textResults: Doc<"memories">[] = await ctx.runQuery(api.memories.searchByText, {
        query: args.query,
        category: args.category,
        limit,
      });
      return textResults;
    }
    
    // Perform vector search
    const results = await ctx.vectorSearch("memories", "by_embedding", {
      vector: queryEmbedding,
      limit,
      filter: args.category ? (q) => q.eq("category", args.category!) : undefined,
    });
    
    // Fetch full documents with scores
    const memoriesWithScores: MemoryWithScore[] = [];
    for (const result of results) {
      const memory: Doc<"memories"> | null = await ctx.runQuery(api.memories.getById, { id: result._id });
      if (memory) {
        memoriesWithScores.push({ ...memory, _score: result._score });
      }
    }
    
    return memoriesWithScores;
  },
});

// Get single memory by ID
export const getById = query({
  args: { id: v.id("memories") },
  handler: async (ctx, args): Promise<Doc<"memories"> | null> => {
    return await ctx.db.get(args.id);
  },
});
