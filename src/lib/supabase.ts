
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
// In production, these would be set in your deployment environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Authentication and data persistence will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type role_code = 'company_owner' | 'project_manager' | 'office_manager';

export interface Company {
  id: string;
  name: string;
  external_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: role_code;
  status: 'pending' | 'active' | 'disabled';
  invited_email: string;
  invited_at: string;
  accepted_at?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export type DbProject = {
  id: string;
  name: string;
  client: string;
  value: number;
  status: 'draft' | 'active' | 'in_progress' | 'completed' | 'closed' | 'cancelled';
  start_date: string;
  end_date: string | null;
  created_at: string;
  description?: string;
  location?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  project_type_id?: string;
  company_id: string;
  pm_member_id?: string;
};

export type DbTeamMember = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  status: string;
  created_at: string;
};

export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue';

export type DbInvoice = {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  project_id: string;
  amount: number;
  due_date: string;
  status: InvoiceStatus;
  created_at: string;
  payment_method: string;
  payment_id?: string;
  payment_date?: string;
  payment_provider?: string;
  payment_reference?: string;
  payment_link?: string;
  company_id: string;
  has_line_items?: boolean;
};

export type BillStatus = "pending_approval" | "pending_payment" | "paid" | "rejected";

export type DbBill = {
  id: string;
  bill_number: string;
  vendor_name: string;
  vendor_email: string;
  project_id: string;
  amount: number;
  due_date: string;
  status: BillStatus;
  created_at: string;
  payment_id?: string;
  payment_date?: string;
  payment_provider?: string;
  payment_reference?: string;
  requires_lien_release?: boolean;
  company_id: string;
  has_line_items?: boolean;
};

export type DbMilestone = {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  amount: number;
  percentage?: number;
  due_date?: string;
  is_completed: boolean;
  completed_at?: string;
  status?: string;
  due_type: string;
  created_at: string;
  updated_at: string;
  company_id: string;
  change_order_id?: string;
}

export type DbChangeOrder = {
  id: string;
  project_id: string;
  description: string;
  amount: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  created_by: string;
  created_at: string;
  updated_at: string;
}
