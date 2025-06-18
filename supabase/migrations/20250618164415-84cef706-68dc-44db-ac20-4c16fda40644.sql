
-- Update the invoices table check constraint to include 'partially_paid' status
ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('draft', 'sent', 'partially_paid', 'paid', 'overdue'));
