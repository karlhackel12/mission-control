-- Migration: Add error handling to tasks
-- Description: Adds error_message field and 'failed' status for task failure tracking

-- Add error_message column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS error_message TEXT DEFAULT NULL;

-- Create index for quickly finding failed tasks
CREATE INDEX IF NOT EXISTS idx_tasks_status_failed 
ON tasks(status) 
WHERE status = 'failed';

-- Create index for tasks with errors
CREATE INDEX IF NOT EXISTS idx_tasks_has_error 
ON tasks(id) 
WHERE error_message IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN tasks.error_message IS 'Error message when task/cron fails. NULL when no error.';

-- Note: The status enum constraint should already allow any string value.
-- If there's a constraint, run this to add 'failed':
-- ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'failed';
