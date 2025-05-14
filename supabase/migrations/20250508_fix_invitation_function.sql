-- Fix the get_pending_invitations_by_email function
CREATE OR REPLACE FUNCTION get_pending_invitations_by_email(p_email TEXT)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  company_name TEXT,
  role role_code,
  invited_by TEXT,
  invited_email TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    cm.company_id,
    c.name AS company_name,
    cm.role,
    -- Use the email directly instead of trying to join with profiles
    COALESCE(cm.invited_by_email, 'Administrator') AS invited_by,
    cm.invited_email,
    cm.status
  FROM company_members cm
  JOIN companies c ON cm.company_id = c.id
  WHERE 
    cm.invited_email = p_email 
    AND cm.status = 'pending'
    AND cm.user_id IS NULL;
END;
$$;

-- Fix company invitation function to properly handle user permissions
CREATE OR REPLACE FUNCTION handle_company_invitation()
RETURNS TRIGGER AS $$
BEGIN
  -- When an invitation is accepted, add the user to the company_users table
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    INSERT INTO company_users (company_id, user_id, role)
    VALUES (NEW.company_id, NEW.user_id, NEW.role);
    
    -- Also grant access to all company projects
    INSERT INTO project_users (project_id, user_id, role)
    SELECT proj.id, NEW.user_id, 'member'
    FROM projects proj
    WHERE proj.company_id = NEW.company_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger on company_members table
DROP TRIGGER IF EXISTS company_invitation_trigger ON company_members;
CREATE TRIGGER company_invitation_trigger
AFTER UPDATE ON company_members
FOR EACH ROW
EXECUTE FUNCTION handle_company_invitation();
