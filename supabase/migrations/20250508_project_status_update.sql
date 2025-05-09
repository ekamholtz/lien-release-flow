-- Update the projects table to support more granular status options

-- First, check if project_status is an enum type
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    -- Modify the enum type to add new values
    ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'in_progress';
    ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'closed';
  ELSE
    -- If not using an enum, use a check constraint instead
    ALTER TABLE public.projects
      DROP CONSTRAINT IF EXISTS projects_status_check;
      
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_status_check 
      CHECK (status IN ('draft', 'active', 'in_progress', 'completed', 'closed', 'cancelled'));
  END IF;
END
$$;

-- Add column to track original contract value
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS original_value DECIMAL(12,2);

-- Update existing projects to set original_value equal to value
UPDATE public.projects
  SET original_value = value,
      status = 'active'
  WHERE original_value IS NULL;

-- Create change_orders table
CREATE TABLE IF NOT EXISTS public.change_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on change_orders table
ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for change_orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'change_orders' AND policyname = 'Company members can view change orders from their company'
  ) THEN
    CREATE POLICY "Company members can view change orders from their company" ON public.change_orders
    FOR SELECT USING (
      project_id IN (
        SELECT id FROM public.projects
        WHERE company_id IN (
          SELECT company_id FROM public.company_members
          WHERE user_id = auth.uid() AND status = 'active'
        )
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'change_orders' AND policyname = 'Company members can insert change orders for their company''s projects'
  ) THEN
    CREATE POLICY "Company members can insert change orders for their company's projects" ON public.change_orders
    FOR INSERT WITH CHECK (
      project_id IN (
        SELECT id FROM public.projects
        WHERE company_id IN (
          SELECT company_id FROM public.company_members
          WHERE user_id = auth.uid() AND status = 'active'
        )
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'change_orders' AND policyname = 'Company members can update change orders for their company''s projects'
  ) THEN
    CREATE POLICY "Company members can update change orders for their company's projects" ON public.change_orders
    FOR UPDATE USING (
      project_id IN (
        SELECT id FROM public.projects
        WHERE company_id IN (
          SELECT company_id FROM public.company_members
          WHERE user_id = auth.uid() AND status = 'active'
        )
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'change_orders' AND policyname = 'Company members can delete change orders for their company''s projects'
  ) THEN
    CREATE POLICY "Company members can delete change orders for their company's projects" ON public.change_orders
    FOR DELETE USING (
      project_id IN (
        SELECT id FROM public.projects
        WHERE company_id IN (
          SELECT company_id FROM public.company_members
          WHERE user_id = auth.uid() AND status = 'active'
        )
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'change_orders' AND policyname = 'Users can view change orders for their company''s projects'
  ) THEN
    CREATE POLICY "Users can view change orders for their company's projects" ON public.change_orders
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.company_members cm ON p.company_id = cm.company_id
        WHERE p.id = project_id AND cm.user_id = auth.uid() AND cm.status = 'active'
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'change_orders' AND policyname = 'Users can create change orders for their company''s projects'
  ) THEN
    CREATE POLICY "Users can create change orders for their company's projects" ON public.change_orders
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.company_members cm ON p.company_id = cm.company_id
        WHERE p.id = project_id AND cm.user_id = auth.uid() AND cm.status = 'active'
        AND (cm.role = 'company_owner' OR cm.role = 'project_manager')
      )
    );
  END IF;
END
$$;

-- Update or add status field to milestones table
ALTER TABLE public.milestones
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed'));

-- Create function to update project status based on milestone completion
CREATE OR REPLACE FUNCTION public.update_project_status_on_milestone_change()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
  all_completed BOOLEAN;
  any_completed BOOLEAN;
  has_milestones BOOLEAN;
BEGIN
  -- Get current project status
  SELECT * INTO project_record FROM public.projects WHERE id = NEW.project_id;
  
  -- Check milestone completion status
  SELECT 
    bool_and(status = 'completed') as all_completed,
    bool_or(status = 'completed') as any_completed,
    count(*) > 0 as has_milestones
  INTO all_completed, any_completed, has_milestones
  FROM public.milestones
  WHERE project_id = NEW.project_id;
  
  -- Update project status based on milestone completion
  IF has_milestones THEN
    IF all_completed THEN
      UPDATE public.projects SET status = 'completed' WHERE id = NEW.project_id;
    ELSIF any_completed THEN
      -- If any milestone is completed but not all, set to in_progress
      UPDATE public.projects SET status = 'in_progress' WHERE id = NEW.project_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create milestone status change trigger
DROP TRIGGER IF EXISTS update_project_status_trigger ON public.milestones;
CREATE TRIGGER update_project_status_trigger
AFTER UPDATE OF status ON public.milestones
FOR EACH ROW
EXECUTE FUNCTION public.update_project_status_on_milestone_change();

-- Create function to add a change order
CREATE OR REPLACE FUNCTION public.create_change_order(
  p_project_id UUID,
  p_description TEXT,
  p_amount DECIMAL,
  p_status TEXT,
  p_created_by UUID
) RETURNS UUID AS $$
DECLARE
  v_change_order_id UUID;
BEGIN
  -- Insert the change order
  INSERT INTO public.change_orders (
    project_id,
    description,
    amount,
    status,
    created_by
  ) VALUES (
    p_project_id,
    p_description,
    p_amount,
    p_status,
    p_created_by
  ) RETURNING id INTO v_change_order_id;
  
  RETURN v_change_order_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update project status
CREATE OR REPLACE FUNCTION public.update_project_status(
  p_project_id UUID,
  p_status TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE public.projects
  SET status = p_status
  WHERE id = p_project_id
  AND EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = projects.company_id
    AND cm.user_id = auth.uid()
    AND cm.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
