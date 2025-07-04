
-- Add missing sync status enum values if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_status') THEN
        CREATE TYPE sync_status AS ENUM ('pending', 'processing', 'success', 'error');
    END IF;
END $$;

-- Add company_id to accounting_sync table for better data isolation
ALTER TABLE accounting_sync 
ADD COLUMN IF NOT EXISTS company_id uuid;

-- Create index for better performance on sync statistics queries
CREATE INDEX IF NOT EXISTS idx_accounting_sync_company_entity_provider 
ON accounting_sync (company_id, entity_type, provider, status);

-- Create index for sync date queries
CREATE INDEX IF NOT EXISTS idx_accounting_sync_last_synced 
ON accounting_sync (last_synced_at DESC);

-- Add a function to get comprehensive sync statistics
CREATE OR REPLACE FUNCTION get_sync_statistics(p_company_id uuid DEFAULT NULL)
RETURNS TABLE(
  entity_type text,
  provider text,
  total_count bigint,
  success_count bigint,
  error_count bigint,
  pending_count bigint,
  processing_count bigint,
  last_sync_date timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.entity_type,
    a.provider,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE a.status = 'success') as success_count,
    COUNT(*) FILTER (WHERE a.status = 'error') as error_count,
    COUNT(*) FILTER (WHERE a.status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE a.status = 'processing') as processing_count,
    MAX(a.last_synced_at) as last_sync_date
  FROM accounting_sync a
  WHERE (p_company_id IS NULL OR a.company_id = p_company_id OR a.user_id IN (
    SELECT cm.user_id FROM company_members cm WHERE cm.company_id = p_company_id AND cm.status = 'active'
  ))
  GROUP BY a.entity_type, a.provider
  ORDER BY a.entity_type, a.provider;
END;
$$;

-- Update existing sync records to include company_id where possible
UPDATE accounting_sync 
SET company_id = (
  SELECT CASE 
    WHEN accounting_sync.entity_type = 'invoice' THEN i.company_id
    WHEN accounting_sync.entity_type = 'bill' THEN b.company_id
    WHEN accounting_sync.entity_type = 'payment' THEN p.company_id
    WHEN accounting_sync.entity_type = 'project' THEN pr.company_id
    ELSE NULL
  END
  FROM invoices i
  FULL OUTER JOIN bills b ON b.id = accounting_sync.entity_id
  FULL OUTER JOIN payments p ON p.id = accounting_sync.entity_id  
  FULL OUTER JOIN projects pr ON pr.id = accounting_sync.entity_id
  WHERE i.id = accounting_sync.entity_id 
     OR b.id = accounting_sync.entity_id
     OR p.id = accounting_sync.entity_id
     OR pr.id = accounting_sync.entity_id
)
WHERE company_id IS NULL;
