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
