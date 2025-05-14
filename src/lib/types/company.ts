
import { type role_code } from '@/lib/supabase';

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
  user_id: string | null;
  role: role_code;
  status: 'pending' | 'active' | 'disabled' | 'declined';
  invited_email: string;
  invited_at: string;
  accepted_at?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  // Additional properties from RPC function results
  company_name?: string;
  invited_by?: string;
}

export interface Role {
  code: role_code;
  display_name: string;
  description?: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface RolePermission {
  id: string;
  company_id: string;
  role: role_code;
  permission_id: string;
}
