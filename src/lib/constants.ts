export const AGENTS = [
  { id: 'chief', name: 'Chief', emoji: '👑', role: 'Strategic Oversight', color: '#FFD700' },
  { id: 'builder', name: 'Builder', emoji: '🔨', role: 'Work Execution', color: '#F97316' },
  { id: 'growth', name: 'Growth', emoji: '📈', role: 'Marketing', color: '#10B981' },
  { id: 'developer', name: 'Developer', emoji: '💻', role: 'Code & Tech', color: '#3B82F6' },
  { id: 'scout', name: 'Scout', emoji: '🔍', role: 'Research', color: '#8B5CF6' },
  { id: 'metrics', name: 'Metrics', emoji: '📊', role: 'Analytics', color: '#EC4899' },
  { id: 'infra', name: 'Infra', emoji: '🛠️', role: 'Infrastructure', color: '#6B7280' },
  { id: 'finance', name: 'Finance', emoji: '💰', role: 'Financial Ops', color: '#059669' },
] as const

export const PRODUCTS = [
  { id: 'golance', name: 'goLance', emoji: '🚀', color: '#3B82F6', shortName: 'GL' },
  { id: 'transforce', name: 'TransForce', emoji: '🚚', color: '#F97316', shortName: 'TF' },
  { id: 'hellopeople', name: 'HelloPeople', emoji: '👋', color: '#10B981', shortName: 'HP' },
  { id: 'manuai', name: 'Manuai', emoji: '🤖', color: '#8B5CF6', shortName: 'Manuai' },
] as const

export const TASK_STATUSES = ['backlog', 'in_progress', 'review', 'done'] as const

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

export const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
} as const

export const STATUS_LABELS = {
  backlog: '📋 Backlog',
  in_progress: '🚧 In Progress',
  review: '👀 Review',
  done: '✅ Done',
} as const
