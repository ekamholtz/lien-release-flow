
-- Function to get pending invitations by email
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
    COALESCE(p.first_name || ' ' || p.last_name, 'Administrator') AS invited_by,
    cm.invited_email,
    cm.status
  FROM company_members cm
  JOIN companies c ON cm.company_id = c.id
  LEFT JOIN profiles p ON cm.created_by = p.id
  WHERE 
    cm.invited_email = p_email 
    AND cm.status = 'pending'
    AND cm.user_id IS NULL;
END;
$$;

-- Function to get user companies
CREATE OR REPLACE FUNCTION get_user_companies()
RETURNS SETOF companies
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT c.*
  FROM companies c
  JOIN company_members cm ON c.id = cm.company_id
  WHERE cm.user_id = auth.uid()
  AND cm.status = 'active';
END;
$$;

-- Function to accept an invitation
CREATE OR REPLACE FUNCTION accept_company_invitation(
  p_invitation_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE company_members
  SET 
    user_id = p_user_id,
    status = 'active',
    accepted_at = now()
  WHERE id = p_invitation_id
  AND status = 'pending';
  
  RETURN FOUND;
END;
$$;

-- Function to decline an invitation
CREATE OR REPLACE FUNCTION decline_company_invitation(
  p_invitation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE company_members
  SET 
    status = 'declined'
  WHERE id = p_invitation_id
  AND status = 'pending';
  
  RETURN FOUND;
END;
$$;
