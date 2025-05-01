
-- Function to get company members
CREATE OR REPLACE FUNCTION get_company_members(p_company_id UUID)
RETURNS SETOF company_members
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT * FROM company_members WHERE company_id = p_company_id;
$$;

-- Function to create a company and add the creator as admin
CREATE OR REPLACE FUNCTION create_company_with_admin(p_name TEXT, p_user_id UUID, p_email TEXT)
RETURNS companies
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id UUID;
  v_company companies;
BEGIN
  -- Create company
  INSERT INTO companies (name)
  VALUES (p_name)
  RETURNING * INTO v_company;
  
  -- Add user as admin
  INSERT INTO company_members (
    company_id,
    user_id,
    role,
    status,
    invited_email,
    accepted_at
  ) VALUES (
    v_company.id,
    p_user_id,
    'company_admin',
    'active',
    p_email,
    now()
  );
  
  RETURN v_company;
END;
$$;

-- Function to update a company
CREATE OR REPLACE FUNCTION update_company(p_id UUID, p_name TEXT, p_external_id TEXT)
RETURNS companies
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company companies;
BEGIN
  UPDATE companies
  SET 
    name = COALESCE(p_name, name),
    external_id = COALESCE(p_external_id, external_id),
    updated_at = now()
  WHERE id = p_id
  AND id IN (
    SELECT company_id FROM company_members 
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'company_admin'
  )
  RETURNING * INTO v_company;
  
  RETURN v_company;
END;
$$;

-- Function to invite a new company member
CREATE OR REPLACE FUNCTION invite_company_member(
  p_company_id UUID, 
  p_email TEXT, 
  p_first_name TEXT, 
  p_last_name TEXT, 
  p_role TEXT
)
RETURNS company_members
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member company_members;
BEGIN
  -- Verify the caller is a company admin
  IF NOT EXISTS (
    SELECT 1 FROM company_members
    WHERE company_id = p_company_id
    AND user_id = auth.uid()
    AND role = 'company_admin'
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Not authorized to invite members to this company';
  END IF;
  
  -- Create invitation
  INSERT INTO company_members (
    company_id,
    invited_email,
    first_name,
    last_name,
    role,
    status,
    invited_at
  ) VALUES (
    p_company_id,
    p_email,
    p_first_name,
    p_last_name,
    p_role::role_code,
    'pending',
    now()
  )
  RETURNING * INTO v_member;
  
  RETURN v_member;
END;
$$;

-- Function to update a company member
CREATE OR REPLACE FUNCTION update_company_member(p_id UUID, p_status TEXT, p_role TEXT)
RETURNS company_members
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member company_members;
  v_company_id UUID;
BEGIN
  -- Get the company ID for this member
  SELECT company_id INTO v_company_id FROM company_members WHERE id = p_id;
  
  -- Verify the caller is a company admin
  IF NOT EXISTS (
    SELECT 1 FROM company_members
    WHERE company_id = v_company_id
    AND user_id = auth.uid()
    AND role = 'company_admin'
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Not authorized to update members in this company';
  END IF;
  
  -- Update the member
  UPDATE company_members
  SET 
    status = COALESCE(p_status, status),
    role = COALESCE(p_role::role_code, role)
  WHERE id = p_id
  RETURNING * INTO v_member;
  
  RETURN v_member;
END;
$$;

-- Function to delete a company member
CREATE OR REPLACE FUNCTION delete_company_member(p_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Get the company ID for this member
  SELECT company_id INTO v_company_id FROM company_members WHERE id = p_id;
  
  -- Verify the caller is a company admin
  IF NOT EXISTS (
    SELECT 1 FROM company_members
    WHERE company_id = v_company_id
    AND user_id = auth.uid()
    AND role = 'company_admin'
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Not authorized to delete members from this company';
  END IF;
  
  -- Delete the member
  DELETE FROM company_members WHERE id = p_id;
END;
$$;
