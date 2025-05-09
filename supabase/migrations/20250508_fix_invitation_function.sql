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
