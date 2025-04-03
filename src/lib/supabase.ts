
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
// In production, these would be set in your deployment environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Authentication and data persistence will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type DbProject = {
  id: string;
  name: string;
  client: string;
  value: number;
  status: 'active' | 'completed' | 'pending';
  start_date: string;
  end_date: string | null;
  created_at: string;
};

export type DbTeamMember = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  status: 'active' | 'inactive';
  created_at: string;
};

export type DbInvoice = {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  project_id: string;
  amount: number;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  created_at: string;
  payment_method: 'regular' | 'accelerated';
};

export type DbBill = {
  id: string;
  bill_number: string;
  vendor_name: string;
  vendor_email: string;
  project_id: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  created_at: string;
};
