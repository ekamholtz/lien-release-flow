-- Simplified version of the delete_company_member function with fewer permission checks
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
