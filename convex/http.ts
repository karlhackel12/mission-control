import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

// POST /activity - receive activity logs from OpenClaw
http.route({
  path: "/activity",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { agentId, agentName, type, action, details, metadata, timestamp } = body;

      // Validate required fields
      if (!type || !action) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: type, action" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      let resolvedAgentId: Id<"agents"> | null = null;

      // Try to resolve agent by ID first, then by name
      if (agentId) {
        resolvedAgentId = agentId as Id<"agents">;
      } else if (agentName) {
        // Look up agent by name
        const agent = await ctx.runQuery(api.agents.getByOpenclawId, {
          openclawAgentId: agentName,
        });
        if (agent) {
          resolvedAgentId = agent._id;
        } else {
          // Try by exact name match using internal query
          const allAgents = await ctx.runQuery(api.agents.list, {});
          const matchedAgent = allAgents.find(
            (a) => a.name.toLowerCase() === agentName.toLowerCase() ||
                   a.openclawAgentId === agentName
          );
          if (matchedAgent) {
            resolvedAgentId = matchedAgent._id;
          }
        }
      }

      if (!resolvedAgentId) {
        return new Response(
          JSON.stringify({ error: "Agent not found. Provide agentId or valid agentName." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Log the activity
      const activityId = await ctx.runMutation(internal.activities.logInternal, {
        agentId: resolvedAgentId,
        type,
        action,
        details: details || undefined,
        metadata: metadata || undefined,
        timestamp: timestamp || Date.now(),
      });

      return new Response(
        JSON.stringify({ success: true, activityId }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error logging activity:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

// GET /activity - list recent activities (for testing/debugging)
http.route({
  path: "/activity",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get("limit") || "20", 10);

      const result = await ctx.runQuery(api.activities.list, { limit });

      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error fetching activities:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

// Health check endpoint
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({ status: "ok", timestamp: Date.now() }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

// CORS preflight for /activity
http.route({
  path: "/activity",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

export default http;
