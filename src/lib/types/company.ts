
import { role_code } from '@/lib/supabase';

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

export interface Role {
  code: role_code;
  display_name: string;
  description?: string;
}
