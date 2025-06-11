
-- Add columns to payments table for offline payment details
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_type text,
ADD COLUMN IF NOT EXISTS payor_name text,
ADD COLUMN IF NOT EXISTS payor_company text,
ADD COLUMN IF NOT EXISTS payment_details text,
ADD COLUMN IF NOT EXISTS is_offline boolean DEFAULT false;

-- Update the payment_method check constraint to include more options
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_payment_method_check;

ALTER TABLE payments 
ADD CONSTRAINT payments_payment_method_check 
CHECK (payment_method IN ('credit_card', 'ach', 'check', 'bank_transfer', 'cash', 'wire_transfer'));

-- Update the payment_provider check constraint to include offline
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_payment_provider_check;

ALTER TABLE payments 
ADD CONSTRAINT payments_payment_provider_check 
CHECK (payment_provider IN ('rainforestpay', 'manual', 'offline'));
