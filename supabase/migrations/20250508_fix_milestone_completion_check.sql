-- Fix milestone completion check in trigger function
CREATE OR REPLACE FUNCTION update_project_status_on_milestone_change()
RETURNS TRIGGER AS $$
DECLARE
  total_milestones INT;
  completed_milestones INT;
  project_id UUID;
  new_status TEXT;
BEGIN
  -- Get the project ID
  project_id := NEW.project_id;
  
  -- Count total and completed milestones
  SELECT 
    COUNT(*), 
    COUNT(*) FILTER (WHERE is_completed = true)
  INTO 
    total_milestones, 
    completed_milestones
  FROM milestones
  WHERE project_id = project_id;
  
  -- Determine the new status
  IF completed_milestones = 0 THEN
    new_status := 'not_started';
  ELSIF completed_milestones < total_milestones THEN
    new_status := 'in_progress';
  ELSE
    new_status := 'completed';
  END IF;
  
  -- Update the project status
  UPDATE projects
  SET status = new_status
  WHERE id = project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;