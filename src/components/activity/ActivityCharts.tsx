'use client';

import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { TrendingUp, PieChartIcon, BarChart3 } from 'lucide-react';

// Colors for charts
const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#6366F1', // indigo
];

const TYPE_COLORS: Record<string, string> = {
  tool_call: '#3B82F6',
  message_sent: '#10B981',
  task_created: '#8B5CF6',
  task_completed: '#059669',
  file_written: '#F59E0B',
  search: '#06B6D4',
  decision: '#FBBF24',
  error: '#EF4444',
};

interface ActivityChartsProps {
  days?: number;
  showDailyChart?: boolean;
  showTypeChart?: boolean;
  showAgentChart?: boolean;
}

export function ActivityCharts({
  days = 7,
  showDailyChart = true,
  showTypeChart = true,
  showAgentChart = true,
}: ActivityChartsProps) {
  // Fetch activities for the time range
  const startDate = useMemo(() => startOfDay(subDays(new Date(), days - 1)).getTime(), [days]);
  const endDate = useMemo(() => endOfDay(new Date()).getTime(), []);

  const activitiesResult = useQuery(api.activities.listByDateRange, {
    startDate,
    endDate,
    limit: 1000,
  });

  const agents = useQuery(api.agents.list);

  // Process data for daily chart
  const dailyData = useMemo(() => {
    if (!activitiesResult) return [];

    const dayMap = new Map<string, number>();
    
    // Initialize all days with 0
    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'MMM dd');
      dayMap.set(date, 0);
    }

    // Count activities per day
    for (const activity of activitiesResult) {
      const date = format(new Date(activity.timestamp), 'MMM dd');
      dayMap.set(date, (dayMap.get(date) || 0) + 1);
    }

    return Array.from(dayMap.entries()).map(([date, count]) => ({
      date,
      activities: count,
    }));
  }, [activitiesResult, days]);

  // Process data for type pie chart
  const typeData = useMemo(() => {
    if (!activitiesResult) return [];

    const typeMap = new Map<string, number>();

    for (const activity of activitiesResult) {
      typeMap.set(activity.type, (typeMap.get(activity.type) || 0) + 1);
    }

    return Array.from(typeMap.entries())
      .map(([type, count]) => ({
        name: type.replace('_', ' '),
        value: count,
        color: TYPE_COLORS[type] || COLORS[0],
      }))
      .sort((a, b) => b.value - a.value);
  }, [activitiesResult]);

  // Process data for agent bar chart
  const agentData = useMemo(() => {
    if (!activitiesResult || !agents) return [];

    const agentMap = new Map<string, { name: string; emoji: string; color: string; count: number }>();

    // Initialize with all agents
    for (const agent of agents) {
      agentMap.set(agent._id, {
        name: agent.name,
        emoji: agent.emoji,
        color: agent.color,
        count: 0,
      });
    }

    // Count activities per agent
    for (const activity of activitiesResult) {
      const agentId = activity.agentId;
      const current = agentMap.get(agentId);
      if (current) {
        agentMap.set(agentId, { ...current, count: current.count + 1 });
      }
    }

    return Array.from(agentMap.values())
      .filter((a) => a.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [activitiesResult, agents]);

  const isLoading = activitiesResult === undefined || agents === undefined;

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {showDailyChart && (
          <Card className="col-span-full">
            <CardContent className="h-64 flex items-center justify-center">
              <div className="animate-pulse text-gray-400">Loading charts...</div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      {/* Daily Activity Trend */}
      {showDailyChart && (
        <Card className="col-span-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Activity Trend (Last {days} Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorActivities" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    labelStyle={{ fontWeight: 600, color: '#111827' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="activities"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorActivities)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity by Type */}
      {showTypeChart && typeData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-purple-500" />
              Activity by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    formatter={(value) => (
                      <span className="text-xs text-gray-600 capitalize">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity by Agent */}
      {showAgentChart && agentData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-green-500" />
              Activity by Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    width={80}
                    tickFormatter={(name) => {
                      const agent = agentData.find((a) => a.name === name);
                      return agent ? `${agent.emoji} ${name}` : name;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {agentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {typeData.length === 0 && agentData.length === 0 && (
        <Card className="col-span-full">
          <CardContent className="h-64 flex flex-col items-center justify-center text-gray-400">
            <BarChart3 className="w-12 h-12 mb-4" />
            <p>No activity data for charts</p>
            <p className="text-sm">Activities will appear here as agents work</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ActivityCharts;
