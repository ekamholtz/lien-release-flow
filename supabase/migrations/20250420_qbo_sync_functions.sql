
-- Create function to atomically lock and retrieve the next pending invoice
CREATE OR REPLACE FUNCTION public.lock_next_pending_invoice()
RETURNS SETOF public.invoices AS $$
  UPDATE invoices
  SET qbo_sync_status = 'processing',
      qbo_last_synced_at = now()
  WHERE id = (
    SELECT id
    FROM invoices
    WHERE qbo_sync_status = 'pending'
    ORDER BY qbo_retries ASC, created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING *;
$$ LANGUAGE sql;

-- Create function to atomically lock a specific invoice for syncing
CREATE OR REPLACE FUNCTION public.lock_invoice_for_sync(invoice_id uuid)
RETURNS SETOF public.invoices AS $$
  UPDATE invoices
  SET qbo_sync_status = 'processing',
      qbo_last_synced_at = now()
  WHERE id = invoice_id
    AND qbo_sync_status != 'processing'
  RETURNING *;
$$ LANGUAGE sql;

-- Create function to increment the retry counter for an invoice
CREATE OR REPLACE FUNCTION public.increment_retries(invoice_id uuid)
RETURNS integer AS $$
  UPDATE invoices
  SET qbo_retries = COALESCE(qbo_retries, 0) + 1
  WHERE id = invoice_id
  RETURNING qbo_retries;
$$ LANGUAGE sql;

-- Add severity column to qbo_logs table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'qbo_logs' 
    AND column_name = 'severity'
  ) THEN
    ALTER TABLE public.qbo_logs ADD COLUMN severity text NOT NULL DEFAULT 'info';
  END IF;
END $$;

-- Create index on qbo_sync_status for performance
CREATE INDEX IF NOT EXISTS invoices_qbo_sync_status_idx ON public.invoices (qbo_sync_status);
