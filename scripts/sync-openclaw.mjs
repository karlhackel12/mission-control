#!/usr/bin/env node
/**
 * Sync OpenClaw data to Convex
 * Usage: node scripts/sync-openclaw.mjs
 */

import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://reminiscent-leopard-896.convex.cloud";

const client = new ConvexHttpClient(CONVEX_URL);

// Agent definitions based on OpenClaw setup
const AGENTS = [
  { name: "Developer", emoji: "🛠️", role: "Software Engineering", color: "blue", badge: "SPC", openclawAgentId: "developer" },
  { name: "Marketing", emoji: "📣", role: "Content & Growth", color: "pink", badge: "SPC", openclawAgentId: "marketing" },
  { name: "Work", emoji: "💼", role: "Work Management", color: "green", badge: "INT", openclawAgentId: "work" },
  { name: "Finance", emoji: "💰", role: "Financial Management", color: "yellow", badge: "SPC", openclawAgentId: "finance" },
  { name: "Metrics", emoji: "📊", role: "Analytics & Reporting", color: "purple", badge: "SPC", openclawAgentId: "metrics" },
  { name: "Scout", emoji: "🔬", role: "Research & Discovery", color: "cyan", badge: "SPC", openclawAgentId: "scout" },
  { name: "Chief", emoji: "🎯", role: "Coordination Lead", color: "orange", badge: "LEAD", openclawAgentId: "main" },
];

// Real cron jobs from OpenClaw
const CRON_JOBS = [
  { openclawId: "69b11f25-9605-45b8-bec9-9a3acc030ec0", name: "Lembrete Horas", schedule: "0 17 * * 5", agentName: "Chief", nextRunAtMs: 1770408000000, isActive: true },
  { openclawId: "9989a85e-1a5c-45eb-8d9f-66c555e1e9e2", name: "TF1 Support Tickets Check", schedule: "0 9,13,17 * * 1-5", agentName: "Chief", nextRunAtMs: 1770408000000, isActive: true },
  { openclawId: "2504aa14-5e55-4063-809c-27a7a78ee329", name: "Jira Comment Digest", schedule: "0 17 * * 1-5", agentName: "Chief", nextRunAtMs: 1770408000000, isActive: true },
  { openclawId: "1f10a703-e05d-400f-bb45-df16c2b95b4d", name: "Slack Message Digest", schedule: "0 17 * * 1-5", agentName: "Chief", nextRunAtMs: 1770408000000, isActive: true },
  { openclawId: "246198dc-2e88-4d23-835c-bdcfc58443fd", name: "EOD Summary", schedule: "0 19 * * 1-6", agentName: "Work", nextRunAtMs: 1770415200000, isActive: true },
  { openclawId: "576dd5d6-0b91-4613-ac8c-69f9bd491446", name: "Learning Sync", schedule: "0 20 * * *", agentName: "Chief", nextRunAtMs: 1770418800000, isActive: true },
  { openclawId: "ea63841b-e6b2-41ea-af73-8483f5554b83", name: "Circleback Review", schedule: "0 22 * * *", agentName: "Work", nextRunAtMs: 1770426000000, isActive: true },
  { openclawId: "c3e8436a-00f1-4da6-955c-cdac4c8937d1", name: "Daily Standup", schedule: "30 23 * * *", agentName: "Chief", nextRunAtMs: 1770431400000, isActive: true },
  { openclawId: "db8a45fa-f0e8-4af2-bd49-37f039197c78", name: "Notion Daily Sync", schedule: "0 5 * * *", agentName: "Chief", nextRunAtMs: 1770451200000, isActive: true },
  { openclawId: "eb1aec86-37a1-4bf8-9b42-1359b28a995d", name: "Daily Metrics Pulse", schedule: "30 6 * * *", agentName: "Metrics", nextRunAtMs: 1770456600000, isActive: true },
  { openclawId: "95446a89-8e4c-4304-8582-ed4dd94da223", name: "Morning Briefing", schedule: "0 7 * * 1-6", agentName: "Chief", nextRunAtMs: 1770458400000, isActive: true },
  { openclawId: "dc41af2e-abff-4a3f-a693-d74b0992cd91", name: "Lembrete Fatura Semanal", schedule: "0 10 * * 6", agentName: "Finance", nextRunAtMs: 1770469200000, isActive: true },
  { openclawId: "6629cc6e-9306-43d7-8caa-2532bdd6ff2d", name: "Standup Summary", schedule: "30 11 * * 1-6", agentName: "Work", nextRunAtMs: 1770474600000, isActive: true },
  { openclawId: "42f20b6f-3821-400a-b52b-5bfd61c01ffb", name: "Dependency Check", schedule: "0 15 * * 1-6", agentName: "Developer", nextRunAtMs: 1770487200000, isActive: true },
  { openclawId: "e099522f-17b7-417d-b984-6ca667ee65bc", name: "Research Watch", schedule: "0 5 * * 1,3,5", agentName: "Scout", nextRunAtMs: 1770624000000, isActive: true },
  { openclawId: "c68da759-c40c-4f4c-b1b8-771864c0f890", name: "GTM Publishing System", schedule: "at:2026-02-10T10:00:00", agentName: "Marketing", nextRunAtMs: 1770717600000, isActive: true },
  { openclawId: "bffaab7d-e598-4105-9c56-4f5a191f21e1", name: "Weekly Metrics Report", schedule: "0 9 * * 2", agentName: "Metrics", nextRunAtMs: 1770724800000, isActive: true },
  { openclawId: "00506809-21c0-4cfb-bdb2-8a5874f0dc90", name: "Mariotti Quadra 1", schedule: "45 18 * * 2,4", agentName: "Chief", nextRunAtMs: 1770759900000, isActive: true },
  { openclawId: "c26a5218-b686-4330-85cf-7f1c6cbd2165", name: "Mariotti Quadra 2", schedule: "45 18 * * 2,4", agentName: "Chief", nextRunAtMs: 1770759900000, isActive: true },
  { openclawId: "b6246e58-6d1f-43b0-9dd3-7a5b31a17001", name: "Monthly Context Sync", schedule: "0 10 1 * *", agentName: "Chief", nextRunAtMs: 1772370000000, isActive: true },
];

async function seedAgents() {
  console.log("🤖 Seeding agents...");
  
  for (const agent of AGENTS) {
    try {
      // Check if agent exists
      const existing = await client.query("agents:getByOpenclawId", { openclawAgentId: agent.openclawAgentId });
      
      if (!existing) {
        await client.mutation("agents:create", agent);
        console.log(`  ✅ Created: ${agent.name}`);
      } else {
        console.log(`  ⏭️ Exists: ${agent.name}`);
      }
    } catch (error) {
      console.log(`  ❌ Error with ${agent.name}:`, error.message);
    }
  }
}

async function syncCronJobs() {
  console.log("\n📅 Syncing cron jobs...");
  
  try {
    const result = await client.mutation("sync:bulkSync", { jobs: CRON_JOBS });
    console.log(`  ✅ Synced ${result.synced} cron jobs`);
  } catch (error) {
    console.log(`  ❌ Error syncing:`, error.message);
  }
}

async function main() {
  console.log("🚀 OpenClaw → Convex Sync\n");
  console.log(`Convex URL: ${CONVEX_URL}\n`);
  
  await seedAgents();
  await syncCronJobs();
  
  console.log("\n✨ Done!");
}

main().catch(console.error);
