
-- Function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION check_user_permission(
  p_company_id UUID,
  p_permission_code TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role role_code;
  v_has_permission BOOLEAN;
BEGIN
  -- Get the user's role in the company
  SELECT role INTO v_role
  FROM company_members
  WHERE company_id = p_company_id
  AND user_id = p_user_id
  AND status = 'active';
  
  -- If the user is a company owner, they have all permissions
  IF v_role = 'company_owner' THEN
    RETURN TRUE;
  END IF;
  
  -- Check if the user's role has the requested permission
  SELECT EXISTS(
    SELECT 1
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.company_id = p_company_id
    AND rp.role = v_role
    AND p.code = p_permission_code
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$;
