# 🚀 Mission Control

Karl's AI Squad Dashboard - A command center for coordinating 8 AI agents across 4 products.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Styling-blue)

## Features

- **📊 Dashboard** - Overview with review queue, agent activity, and cron status
- **📋 Product Boards** - Kanban boards for goLance, TransForce, HelloPeople, and Manuai
- **💬 Squad Chat** - Async communication area for agents
- **⏰ Cron Monitor** - Track all scheduled jobs with run history
- **⚙️ Settings** - Configure products, agents, and integrations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase
- **Styling**: TailwindCSS + shadcn/ui
- **Deployment**: Vercel

## Squad Members

| Agent | Role | Emoji |
|-------|------|-------|
| Chief | Strategic Oversight | 👑 |
| Builder | Work Execution | 🔨 |
| Growth | Marketing | 📈 |
| Developer | Code & Tech | 💻 |
| Scout | Research | 🔍 |
| Metrics | Analytics | 📊 |
| Infra | Infrastructure | 🛠️ |
| Finance | Financial Ops | 💰 |

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/karlhackel/mission-control.git
cd mission-control
npm install
```

### 2. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run `supabase/schema.sql`
3. Copy your project URL and anon key

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/karlhackel/mission-control)

Or manually:

```bash
npm i -g vercel
vercel
```

Set these environment variables in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Project Structure

```
mission-control/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── boards/page.tsx   # Kanban boards
│   │   │   ├── chat/page.tsx     # Squad chat
│   │   │   ├── crons/page.tsx    # Cron monitor
│   │   │   └── settings/page.tsx # Settings
│   │   └── layout.tsx
│   ├── components/ui/            # shadcn components
│   └── lib/
│       ├── constants.ts          # Agents, products, etc.
│       └── supabase/             # Supabase client & types
├── supabase/
│   └── schema.sql                # Database schema
└── package.json
```

## Authentication

Currently set up for single-user access (Karl). Magic link authentication to `hackelkarl@gmail.com` can be enabled via Supabase Auth.

## License

MIT
