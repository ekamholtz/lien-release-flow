-- Fix the milestone completion check to use is_completed field instead of status
-- Note: The actual function implementation is in 20250508_project_status_update.sql
-- This migration is kept for documentation purposes

-- The fix ensures that:
-- 1. We check is_completed=true instead of status='completed'
-- 2. Projects show as 'in_progress' when some milestones are completed
-- 3. Projects only show as 'completed' when all milestones are completed
-- 4. Project status logic matches the same milestone completion tracking used in the frontend
