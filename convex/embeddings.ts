import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Generate embedding using OpenAI API
export const generateEmbedding = action({
  args: { text: v.string() },
  handler: async (ctx, args): Promise<number[] | null> => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log("OPENAI_API_KEY not set, skipping embedding generation");
      return null;
    }
    
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-ada-002",
          input: args.text,
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error("OpenAI API error:", error);
        return null;
      }
      
      const data = await response.json();
      return data.data[0].embedding as number[];
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      return null;
    }
  },
});

// Internal action for scheduled/background embedding generation
export const generateEmbeddingInternal = internalAction({
  args: { text: v.string() },
  handler: async (ctx, args): Promise<number[] | null> => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return null;
    }
    
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-ada-002",
          input: args.text,
        }),
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.data[0].embedding as number[];
    } catch {
      return null;
    }
  },
});

// Batch generate embeddings for multiple texts
export const generateEmbeddingsBatch = action({
  args: { texts: v.array(v.string()) },
  handler: async (ctx, args): Promise<(number[] | null)[]> => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log("OPENAI_API_KEY not set, skipping batch embedding generation");
      return args.texts.map(() => null);
    }
    
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-ada-002",
          input: args.texts,
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error("OpenAI API error:", error);
        return args.texts.map(() => null);
      }
      
      const data = await response.json();
      // Sort by index to maintain order
      const sorted = data.data.sort((a: { index: number }, b: { index: number }) => a.index - b.index);
      return sorted.map((item: { embedding: number[] }) => item.embedding);
    } catch (error) {
      console.error("Failed to generate embeddings:", error);
      return args.texts.map(() => null);
    }
  },
});

// Check if OpenAI API is configured
export const isConfigured = action({
  args: {},
  handler: async (): Promise<boolean> => {
    return !!process.env.OPENAI_API_KEY;
  },
});
