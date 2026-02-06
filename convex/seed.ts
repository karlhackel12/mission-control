import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Seed mock activity data for testing
export const seedActivities = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all agents
    const agents = await ctx.db.query("agents").collect();
    
    if (agents.length === 0) {
      throw new Error("No agents found. Please create agents first.");
    }

    const now = Date.now();
    const minute = 60 * 1000;
    const hour = 60 * minute;

    // Sample activities for different types
    const mockActivities = [
      // Developer activities
      {
        type: "tool_call",
        action: "exec",
        details: "git push origin main",
        minutesAgo: 2,
      },
      {
        type: "file_written",
        action: "create",
        details: "Created src/components/ActivityFeed.tsx",
        minutesAgo: 5,
      },
      {
        type: "tool_call",
        action: "npm run build",
        details: "Build completed successfully",
        minutesAgo: 8,
      },
      {
        type: "search",
        action: "web_search",
        details: "Next.js 14 server actions best practices",
        minutesAgo: 15,
      },
      {
        type: "task_completed",
        action: "completed",
        details: "Implemented user authentication flow",
        minutesAgo: 30,
      },
      
      // Marketing activities
      {
        type: "message_sent",
        action: "whatsapp",
        details: "Sent TikTok video #3 to Karl",
        minutesAgo: 5,
      },
      {
        type: "task_created",
        action: "created",
        details: "Create Instagram carousel for product launch",
        minutesAgo: 20,
      },
      {
        type: "tool_call",
        action: "image_generate",
        details: "Generated social media banner",
        minutesAgo: 45,
      },
      
      // Chief activities
      {
        type: "decision",
        action: "approved",
        details: "Approved PR #142: Add activity feed",
        minutesAgo: 10,
      },
      {
        type: "message_sent",
        action: "slack",
        details: "Team standup summary posted",
        minutesAgo: 60,
      },
      
      // Scout activities
      {
        type: "search",
        action: "research",
        details: "Competitor analysis: pricing strategies",
        minutesAgo: 25,
      },
      {
        type: "file_written",
        action: "report",
        details: "Generated market research report",
        minutesAgo: 40,
      },
      
      // Error examples
      {
        type: "error",
        action: "api_error",
        details: "Rate limited by Twitter API",
        minutesAgo: 12,
      },
      {
        type: "error",
        action: "timeout",
        details: "OpenAI API request timed out",
        minutesAgo: 55,
      },

      // More varied activities
      {
        type: "tool_call",
        action: "database_query",
        details: "Fetched user analytics data",
        minutesAgo: 3,
      },
      {
        type: "message_sent",
        action: "email",
        details: "Sent weekly digest to subscribers",
        minutesAgo: 90,
      },
      {
        type: "task_completed",
        action: "deployed",
        details: "Deployed v2.3.1 to production",
        minutesAgo: 120,
      },
      {
        type: "decision",
        action: "prioritized",
        details: "Moved bug fix to top of sprint",
        minutesAgo: 35,
      },
      {
        type: "search",
        action: "code_search",
        details: "Found similar implementation in react-query",
        minutesAgo: 18,
      },
      {
        type: "file_written",
        action: "update",
        details: "Updated README.md with new API docs",
        minutesAgo: 22,
      },
    ];

    // Insert activities with random agent assignment
    const insertedIds = [];
    for (const activity of mockActivities) {
      // Assign to a random agent (or specific based on type)
      let agentIndex = Math.floor(Math.random() * agents.length);
      
      // Assign certain types to specific agents if they exist
      if (activity.type === "tool_call" || activity.type === "file_written") {
        const developer = agents.find(a => a.name.toLowerCase().includes("developer") || a.role.toLowerCase().includes("developer"));
        if (developer) agentIndex = agents.indexOf(developer);
      } else if (activity.type === "message_sent" && activity.action === "whatsapp") {
        const marketing = agents.find(a => a.name.toLowerCase().includes("marketing") || a.role.toLowerCase().includes("marketing"));
        if (marketing) agentIndex = agents.indexOf(marketing);
      }

      const agent = agents[agentIndex];
      
      const id = await ctx.db.insert("activities", {
        agentId: agent._id,
        type: activity.type,
        action: activity.action,
        details: activity.details,
        metadata: {
          seeded: true,
          originalMinutesAgo: activity.minutesAgo,
        },
        timestamp: now - (activity.minutesAgo * minute),
      });
      
      insertedIds.push(id);
    }

    return {
      success: true,
      insertedCount: insertedIds.length,
      message: `Seeded ${insertedIds.length} mock activities`,
    };
  },
});

// Seed sample memories for testing
export const seedMemories = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Sample memories for different categories
    const sampleMemories: Array<{
      content: string;
      category: "preference" | "fact" | "decision" | "entity" | "other";
    }> = [
      // Preferences
      {
        content: "Karl prefers to work in the mornings and have meetings in the afternoon",
        category: "preference",
      },
      {
        content: "Use TypeScript for all new projects, avoid JavaScript",
        category: "preference",
      },
      {
        content: "Communication should be in Portuguese unless explicitly asked for English",
        category: "preference",
      },
      {
        content: "Karl likes detailed technical explanations with code examples",
        category: "preference",
      },
      
      // Facts
      {
        content: "Mission Control is built with Next.js 14, Convex, and TailwindCSS",
        category: "fact",
      },
      {
        content: "HelloPeople is the main product, a recruiting platform",
        category: "fact",
      },
      {
        content: "The team uses Asana for project management and Slack for communication",
        category: "fact",
      },
      {
        content: "TransForce and goLance are partner companies sharing infrastructure",
        category: "fact",
      },
      {
        content: "Karl is the founder and main developer working on AI agents",
        category: "fact",
      },
      
      // Decisions
      {
        content: "Decided to use Convex instead of Supabase for real-time features",
        category: "decision",
      },
      {
        content: "Moving from monolith to microservices architecture in Q2 2026",
        category: "decision",
      },
      {
        content: "AI agents will communicate via structured JSON protocols",
        category: "decision",
      },
      
      // Entities
      {
        content: "Developer agent (Dewey) handles coding tasks, git operations, and deployments",
        category: "entity",
      },
      {
        content: "Marketing agent (Margo) manages social media, content creation, and campaigns",
        category: "entity",
      },
      {
        content: "Chief agent (Charlie) coordinates tasks and makes high-level decisions",
        category: "entity",
      },
      {
        content: "Scout agent researches markets, competitors, and gathers intelligence",
        category: "entity",
      },
      
      // Other
      {
        content: "Remember to backup the database every Sunday at midnight",
        category: "other",
      },
      {
        content: "API rate limits: OpenAI 10k/day, Twitter 500/15min, Slack unlimited",
        category: "other",
      },
      {
        content: "Production deployments require at least 2 test passes and code review",
        category: "other",
      },
    ];
    
    const insertedIds = [];
    for (const memory of sampleMemories) {
      const id = await ctx.db.insert("memories", {
        content: memory.content,
        category: memory.category,
        createdAt: now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last week
      });
      insertedIds.push(id);
    }
    
    return {
      success: true,
      insertedCount: insertedIds.length,
      message: `Seeded ${insertedIds.length} sample memories. Run backfillEmbeddings action to add vector embeddings.`,
    };
  },
});

// Clear all memories (use with caution!)
export const clearMemories = mutation({
  args: {},
  handler: async (ctx) => {
    const memories = await ctx.db.query("memories").collect();
    
    for (const memory of memories) {
      await ctx.db.delete(memory._id);
    }
    
    return {
      success: true,
      deletedCount: memories.length,
      message: `Deleted ${memories.length} memories`,
    };
  },
});

// Clear all seeded activities
export const clearSeededActivities = mutation({
  args: {},
  handler: async (ctx) => {
    const activities = await ctx.db.query("activities").collect();
    
    let deletedCount = 0;
    for (const activity of activities) {
      if (activity.metadata?.seeded === true) {
        await ctx.db.delete(activity._id);
        deletedCount++;
      }
    }

    return {
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} seeded activities`,
    };
  },
});
