
-- Add company profile fields to the companies table
ALTER TABLE public.companies 
ADD COLUMN address TEXT,
ADD COLUMN phone TEXT,
ADD COLUMN email TEXT,
ADD COLUMN logo_url TEXT;

-- Update the updated_at timestamp when companies are modified
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for companies table if it doesn't exist
DROP TRIGGER IF EXISTS update_companies_updated_at_trigger ON public.companies;
CREATE TRIGGER update_companies_updated_at_trigger
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();
