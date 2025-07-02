
-- Replace the single address field with separate address fields
ALTER TABLE public.companies 
DROP COLUMN IF EXISTS address;

ALTER TABLE public.companies 
ADD COLUMN street_address TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT;
