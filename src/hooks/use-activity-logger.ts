'use client';

import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useCallback } from 'react';

export interface LogActivityOptions {
  agentName: string;
  type: string;
  action: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Hook for logging activities to Mission Control
 * 
 * @example
 * ```tsx
 * const { logActivity, logTaskCompleted, logError } = useActivityLogger('Developer');
 * 
 * // Log custom activity
 * await logActivity({ type: 'search', action: 'Searched documentation', details: 'Found 5 results' });
 * 
 * // Log task completion
 * await logTaskCompleted('Implemented feature X', { taskId: '123' });
 * 
 * // Log error
 * await logError('Failed to connect to API', { statusCode: 500 });
 * ```
 */
export function useActivityLogger(defaultAgentName?: string) {
  const logMutation = useMutation(api.activities.logByAgentName);

  const logActivity = useCallback(
    async (options: Omit<LogActivityOptions, 'agentName'> & { agentName?: string }) => {
      const agentName = options.agentName || defaultAgentName;
      if (!agentName) {
        console.warn('No agent name provided for activity log');
        return null;
      }

      try {
        return await logMutation({
          agentName,
          type: options.type,
          action: options.action,
          details: options.details,
          metadata: options.metadata,
        });
      } catch (error) {
        console.error('Failed to log activity:', error);
        return null;
      }
    },
    [logMutation, defaultAgentName]
  );

  const logTaskCompleted = useCallback(
    async (action: string, metadata?: Record<string, unknown>) => {
      return logActivity({
        type: 'task_completed',
        action,
        metadata,
      });
    },
    [logActivity]
  );

  const logTaskCreated = useCallback(
    async (action: string, metadata?: Record<string, unknown>) => {
      return logActivity({
        type: 'task_created',
        action,
        metadata,
      });
    },
    [logActivity]
  );

  const logError = useCallback(
    async (action: string, metadata?: Record<string, unknown>) => {
      return logActivity({
        type: 'error',
        action,
        metadata,
      });
    },
    [logActivity]
  );

  const logToolCall = useCallback(
    async (action: string, details?: string, metadata?: Record<string, unknown>) => {
      return logActivity({
        type: 'tool_call',
        action,
        details,
        metadata,
      });
    },
    [logActivity]
  );

  const logMessage = useCallback(
    async (action: string, details?: string, metadata?: Record<string, unknown>) => {
      return logActivity({
        type: 'message_sent',
        action,
        details,
        metadata,
      });
    },
    [logActivity]
  );

  const logDecision = useCallback(
    async (action: string, details?: string, metadata?: Record<string, unknown>) => {
      return logActivity({
        type: 'decision',
        action,
        details,
        metadata,
      });
    },
    [logActivity]
  );

  return {
    logActivity,
    logTaskCompleted,
    logTaskCreated,
    logError,
    logToolCall,
    logMessage,
    logDecision,
  };
}

export default useActivityLogger;
