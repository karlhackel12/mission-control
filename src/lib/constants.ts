export const AGENTS = [
  { id: 'chief', name: 'Chief', emoji: '🎯', role: 'Squad Lead', color: '#FFD700', badge: 'LEAD', avatar: '/avatars/chief.png' },
  { id: 'builder', name: 'Builder', emoji: '🔨', role: 'Work Execution', color: '#F97316', badge: 'INT', avatar: '/avatars/builder.png' },
  { id: 'growth', name: 'Growth', emoji: '📈', role: 'Marketing & Growth', color: '#10B981', badge: 'SPC', avatar: '/avatars/growth.png' },
  { id: 'developer', name: 'Developer', emoji: '💻', role: 'Developer Agent', color: '#3B82F6', badge: 'INT', avatar: '/avatars/developer.png' },
  { id: 'scout', name: 'Scout', emoji: '🔍', role: 'Research & Intel', color: '#8B5CF6', badge: 'SPC', avatar: '/avatars/scout.png' },
  { id: 'metrics', name: 'Metrics', emoji: '📊', role: 'Analytics', color: '#EC4899', badge: 'SPC', avatar: '/avatars/metrics.png' },
  { id: 'infra', name: 'Infra', emoji: '🛠️', role: 'Infrastructure', color: '#6B7280', badge: 'INT', avatar: '/avatars/infra.png' },
  { id: 'finance', name: 'Finance', emoji: '💰', role: 'Financial Ops', color: '#059669', badge: 'SPC', avatar: '/avatars/finance.png' },
] as const

export const PRODUCTS = [
  { id: 'golance', name: 'goLance', emoji: '🚀', color: '#3B82F6', shortName: 'GL' },
  { id: 'transforce', name: 'TransForce', emoji: '🚚', color: '#F97316', shortName: 'TF' },
  { id: 'hellopeople', name: 'HelloPeople', emoji: '👋', color: '#10B981', shortName: 'HP' },
  { id: 'manuai', name: 'Manuai', emoji: '🤖', color: '#8B5CF6', shortName: 'MA' },
] as const

export const TASK_STATUSES = ['inbox', 'assigned', 'in_progress', 'review', 'done'] as const

export const TASK_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const

export const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
} as const

export const STATUS_LABELS = {
  inbox: 'INBOX',
  assigned: 'ASSIGNED',
  in_progress: 'IN PROGRESS',
  review: 'REVIEW',
  done: 'DONE',
} as const

export const STATUS_COLORS = {
  inbox: '#F59E0B',
  assigned: '#3B82F6',
  in_progress: '#8B5CF6',
  review: '#F97316',
  done: '#10B981',
} as const

export const BADGE_COLORS = {
  LEAD: 'bg-amber-100 text-amber-700 border-amber-200',
  INT: 'bg-blue-100 text-blue-700 border-blue-200',
  SPC: 'bg-emerald-100 text-emerald-700 border-emerald-200',
} as const

export type Agent = typeof AGENTS[number]
export type Product = typeof PRODUCTS[number]
export type TaskStatus = typeof TASK_STATUSES[number]
export type TaskPriority = typeof TASK_PRIORITIES[number]
