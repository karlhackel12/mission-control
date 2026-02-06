import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Valid session statuses
const SESSION_STATUSES = ["active", "idle", "sleeping", "terminated"] as const;
type SessionStatus = typeof SESSION_STATUSES[number];

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

// ============================================
// SESSION ENDPOINTS
// ============================================

// POST /session - upsert session from OpenClaw
http.route({
  path: "/session",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { sessionId, agentName, channel, status, model, metadata } = body;

      // Validate required fields
      if (!sessionId || !agentName) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: sessionId, agentName" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Validate status
      const validStatus: SessionStatus = SESSION_STATUSES.includes(status) ? status : "active";

      const id = await ctx.runMutation(internal.sessions.upsertInternal, {
        sessionId,
        agentName,
        channel: channel || undefined,
        status: validStatus,
        model: model || undefined,
        metadata: metadata || undefined,
      });

      return new Response(
        JSON.stringify({ success: true, id }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error upserting session:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

// GET /session - list sessions or get by ID
http.route({
  path: "/session",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const sessionId = url.searchParams.get("sessionId");
      const status = url.searchParams.get("status") as SessionStatus | null;
      const limit = parseInt(url.searchParams.get("limit") || "20", 10);

      if (sessionId) {
        const session = await ctx.runQuery(api.sessions.getBySessionId, { sessionId });
        return new Response(
          JSON.stringify(session || { error: "Session not found" }),
          { 
            status: session ? 200 : 404, 
            headers: { "Content-Type": "application/json" } 
          }
        );
      }

      const sessions = await ctx.runQuery(api.sessions.list, { 
        status: SESSION_STATUSES.includes(status as any) ? status as SessionStatus : undefined,
        limit 
      });

      return new Response(
        JSON.stringify({ sessions }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error fetching sessions:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

// POST /session/heartbeat - update session heartbeat
http.route({
  path: "/session/heartbeat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { sessionId } = body;

      if (!sessionId) {
        return new Response(
          JSON.stringify({ error: "Missing required field: sessionId" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const id = await ctx.runMutation(api.sessions.heartbeat, { sessionId });

      return new Response(
        JSON.stringify({ success: true, id }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error updating heartbeat:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

// CORS preflight for /session
http.route({
  path: "/session",
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

// CORS preflight for /session/heartbeat
http.route({
  path: "/session/heartbeat",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

// ============================================
// CRON RUN ENDPOINTS
// ============================================

// POST /cron-run - receive cron run results
http.route({
  path: "/cron-run",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { openclawId, status, runAtMs, durationMs, summary } = body;

      if (!openclawId) {
        return new Response(
          JSON.stringify({ error: "Missing required field: openclawId" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Find the cron job and update it
      const cronJob = await ctx.runQuery(api.cronJobs.getByOpenclawId, { openclawId });
      
      if (cronJob) {
        await ctx.runMutation(api.cronJobs.updateRunStatus, {
          id: cronJob._id,
          status: status || "success",
          runAtMs: runAtMs || Date.now(),
          durationMs: durationMs,
          summary: summary,
        });
      }

      return new Response(
        JSON.stringify({ success: true, found: !!cronJob }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error updating cron run:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

// CORS preflight for /cron-run
http.route({
  path: "/cron-run",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

// ============================================
// CRON SYNC ENDPOINTS
// ============================================

// POST /cron-sync - sync cron jobs from OpenClaw
http.route({
  path: "/cron-sync",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { jobs } = body;

      if (!jobs || !Array.isArray(jobs)) {
        return new Response(
          JSON.stringify({ error: "Missing required field: jobs (array)" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Get all agents for mapping
      const allAgents = await ctx.runQuery(api.agents.list, {});
      const agentLookup = new Map<string, Id<"agents">>();
      for (const agent of allAgents) {
        if (agent.openclawAgentId) {
          agentLookup.set(agent.openclawAgentId, agent._id);
        }
        agentLookup.set(agent.name.toLowerCase(), agent._id);
      }

      let synced = 0;
      let errors: string[] = [];

      for (const job of jobs) {
        try {
          // Resolve agentId from job.agentId string
          let resolvedAgentId: Id<"agents"> | undefined = undefined;
          if (job.agentId) {
            resolvedAgentId = agentLookup.get(job.agentId) || 
                             agentLookup.get(job.agentId.toLowerCase());
          }

          // Map OpenClaw job format to Convex cronJobs.sync format
          await ctx.runMutation(api.cronJobs.sync, {
            openclawId: job.id,
            name: job.name,
            description: job.payload?.message?.substring(0, 200) || undefined,
            schedule: job.schedule?.expr || job.schedule?.at || "unknown",
            product: undefined, // OpenClaw doesn't have product field
            agentId: resolvedAgentId,
            payload: job.payload,
            nextRunAtMs: job.state?.nextRunAtMs,
            lastRunAtMs: job.state?.lastRunAtMs,
            lastStatus: job.state?.lastStatus,
            isActive: job.enabled !== false,
          });
          synced++;
        } catch (err) {
          errors.push(`${job.id}: ${err}`);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          synced, 
          total: jobs.length,
          errors: errors.length > 0 ? errors : undefined 
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error syncing cron jobs:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

// CORS preflight for /cron-sync
http.route({
  path: "/cron-sync",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

// ============================================
// AGENT HEARTBEAT ENDPOINTS
// ============================================

// POST /agent-heartbeat - update agent lastSeenAt timestamp
http.route({
  path: "/agent-heartbeat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { agentId, status } = body;

      if (!agentId) {
        return new Response(
          JSON.stringify({ error: "Missing required field: agentId" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Validate status
      const validStatus = status === "active" || status === "idle" ? status : undefined;

      const id = await ctx.runMutation(api.agents.updateHeartbeat, {
        openclawAgentId: agentId,
        status: validStatus,
      });

      return new Response(
        JSON.stringify({ success: true, found: !!id }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error updating agent heartbeat:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

// CORS preflight for /agent-heartbeat
http.route({
  path: "/agent-heartbeat",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

export default http;
