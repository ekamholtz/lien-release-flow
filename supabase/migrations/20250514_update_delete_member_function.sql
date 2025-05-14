-- Update the delete_company_member function to deactivate instead of delete
CREATE OR REPLACE FUNCTION delete_company_member(p_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id UUID;
  v_user_id UUID;
BEGIN
  -- Get the company ID and user ID for this member
  SELECT company_id, user_id INTO v_company_id, v_user_id FROM company_members WHERE id = p_id;
  
  -- Verify the caller is a company owner or has manage_users permission
  IF NOT EXISTS (
    SELECT 1 FROM company_members
    WHERE company_id = v_company_id
    AND user_id = auth.uid()
    AND (role = 'company_owner' OR user_has_permission_for_company(v_company_id, 'manage_users', auth.uid()))
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Not authorized to remove members from this company';
  END IF;
  
  -- Update the member to disabled status instead of deleting
  UPDATE company_members 
  SET status = 'disabled' 
  WHERE id = p_id;
  
  -- Remove user from all company projects
  DELETE FROM project_users 
  WHERE user_id = v_user_id 
  AND project_id IN (
    SELECT id FROM projects WHERE company_id = v_company_id
  );
  
  -- Remove from company_users if exists
  DELETE FROM company_users 
  WHERE user_id = v_user_id 
  AND company_id = v_company_id;
END;
$$;
