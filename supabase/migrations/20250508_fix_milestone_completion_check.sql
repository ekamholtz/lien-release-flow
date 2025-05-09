-- Fix the milestone completion check to use is_completed field instead of status
CREATE OR REPLACE FUNCTION public.update_project_status_on_milestone_change()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
  total_milestones INTEGER;
  completed_milestones INTEGER;
BEGIN
  -- Get current project status
  SELECT * INTO project_record FROM public.projects WHERE id = NEW.project_id;
  
  -- Use is_completed field instead of status for consistency with front-end
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_completed = true) as completed
  INTO 
    total_milestones, completed_milestones
  FROM public.milestones
  WHERE project_id = NEW.project_id;
  
  -- Add debug logging
  RAISE NOTICE 'Project % has %/% milestones completed', 
    NEW.project_id, completed_milestones, total_milestones;
  
  -- Update project status based on milestone completion
  IF total_milestones > 0 THEN
    IF completed_milestones = total_milestones THEN
      -- All milestones completed
      UPDATE public.projects 
      SET status = 'completed' 
      WHERE id = NEW.project_id;
      RAISE NOTICE 'Project % status updated to completed', NEW.project_id;
    ELSIF completed_milestones > 0 THEN
      -- Some milestones completed
      UPDATE public.projects 
      SET status = 'in_progress' 
      WHERE id = NEW.project_id;
      RAISE NOTICE 'Project % status updated to in_progress', NEW.project_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
