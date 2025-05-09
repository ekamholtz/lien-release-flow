-- Fix company invitation function to properly handle user permissions
CREATE OR REPLACE FUNCTION handle_company_invitation()
RETURNS TRIGGER AS $$
BEGIN
  -- When an invitation is accepted, add the user to the company_users table
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    INSERT INTO company_users (company_id, user_id, role)
    VALUES (NEW.company_id, NEW.invitee_id, NEW.role);
    
    -- Also grant access to all company projects
    INSERT INTO project_users (project_id, user_id, role)
    SELECT p.id, NEW.invitee_id, 'member'
    FROM projects p
    WHERE p.company_id = NEW.company_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;