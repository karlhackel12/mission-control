import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
  handler: async (ctx, args) => {
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
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const queryLower = args.query.toLowerCase();
    
    let memories;
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
  handler: async (ctx, args) => {
    return await ctx.db.insert("memories", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Delete memory
export const remove = mutation({
  args: { id: v.id("memories") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
