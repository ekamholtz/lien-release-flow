
-- Function to get all permissions
CREATE OR REPLACE FUNCTION get_all_permissions()
RETURNS SETOF permissions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM permissions
  ORDER BY name;
END;
$$;

-- Function to get role permissions for a specific company and role
CREATE OR REPLACE FUNCTION get_role_permissions(p_company_id UUID, p_role text)
RETURNS TABLE (permission_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT rp.permission_id
  FROM role_permissions rp
  WHERE rp.company_id = p_company_id
  AND rp.role = p_role::role_code;
END;
$$;

-- Function to save role permissions
CREATE OR REPLACE FUNCTION save_role_permissions(p_company_id UUID, p_role text, p_permission_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete existing permissions for this role and company
  DELETE FROM role_permissions
  WHERE company_id = p_company_id
  AND role = p_role::role_code;
  
  -- Insert new permissions
  INSERT INTO role_permissions (company_id, role, permission_id)
  SELECT 
    p_company_id,
    p_role::role_code,
    p_id
  FROM unnest(p_permission_ids) AS p_id;
END;
$$;
